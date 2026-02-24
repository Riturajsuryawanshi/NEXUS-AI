
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { url, placeId } = await req.json();

        if (!url && !placeId) {
            throw new Error("Missing 'url' or 'placeId' parameter");
        }

        const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
        if (!apiKey) {
            console.warn("GOOGLE_PLACES_API_KEY not set. Returning mock data.");
            return new Response(JSON.stringify(getMockData()), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        let targetPlaceId = placeId;

        // 1. If URL provided, try to resolve it and extract info
        if (!targetPlaceId && url) {
            let finalUrl = url;

            // Handle Short URLs (maps.app.goo.gl)
            if (url.includes("maps.app.goo.gl") || url.includes("goo.gl/maps")) {
                try {
                    const resp = await fetch(url, { method: 'HEAD', redirect: 'manual' });
                    // Google often returns 301/302. Deno fetch with 'manual' might not follow, 
                    // or we can let it follow default.
                    // Actually, standard fetch follows redirects by default.
                    const fullResp = await fetch(url);
                    finalUrl = fullResp.url;
                    console.log("Resolved short URL to:", finalUrl);
                } catch (e) {
                    console.warn("Failed to resolve short URL:", e);
                    // Continue with original URL, maybe it works as a search query
                }
            }

            // Extract Place ID from the resolved URL
            targetPlaceId = extractPlaceIdFromUrl(finalUrl);

            // If still no ID, use 'findplacefromtext' or 'textsearch' with the extracted name/query
            if (!targetPlaceId) {
                const searchQuery = extractSearchQueryFromUrl(finalUrl);

                if (searchQuery) {
                    // Use 'findplacefromtext' for better specific matching if we have a qualified query
                    // But 'textsearch' is more robust for loose queries.
                    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;
                    console.log("Searching for place:", searchQuery);

                    const searchRes = await fetch(searchUrl);
                    const searchData = await searchRes.json();

                    if (searchData.status === "OK" && searchData.results.length > 0) {
                        targetPlaceId = searchData.results[0].place_id;
                    } else {
                        console.error("Search failed for query:", searchQuery, searchData);
                        throw new Error(`Could not find business for: ${searchQuery}`);
                    }
                } else {
                    throw new Error("Could not parse business info from URL");
                }
            }
        }

        if (!targetPlaceId) {
            throw new Error("Could not determine Place ID");
        }

        // 2. Fetch Place Details
        // Fields: name, formatted_address, rating, user_ratings_total, types, reviews, url, website
        const fields = "name,formatted_address,rating,user_ratings_total,types,reviews,url,website,place_id,geometry,formatted_phone_number";
        // sort by newest to get fresh data
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${targetPlaceId}&fields=${fields}&reviews_sort=newest&key=${apiKey}`;

        const response = await fetch(detailsUrl);
        const data = await response.json();

        if (data.status !== "OK") {
            throw new Error(`Google Places API Error: ${data.status} - ${data.error_message || ''}`);
        }

        return new Response(JSON.stringify(data.result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Edge Function Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});

function extractPlaceIdFromUrl(url: string): string | null {
    try {
        const decoded = decodeURIComponent(url);
        // 1. CID parameter (often used in backend maps links)
        // https://maps.google.com/?cid=123456789 -> This needs a CID lookup, not direct Place ID usage.
        // Actually, Text Search supports `cid:12345`? No. 
        // We will skip CID for now and rely on name search if ID is missing.

        // 2. Data attribute (long hex strings) - specific to Google Maps Internal IDs
        // /data=!4m5!3m4!1s0x0:0x... 
        // The hex after 0x0:0x is the CID hex.

        // 3. /place/NAME/data=... 
        // Sometimes the URL URL contains the Place ID embedded? No, usually it's coordinates.

        return null;
    } catch {
        return null;
    }
}

function extractSearchQueryFromUrl(url: string): string | null {
    try {
        const decoded = decodeURIComponent(url);

        // Pattern: /place/Business+Name/
        const placeMatch = decoded.match(/\/place\/([^\/@?]+)/);
        if (placeMatch) {
            return placeMatch[1].replace(/\+/g, " ");
        }

        // Pattern: ?q=Business+Name
        const qMatch = decoded.match(/[?&]q=([^&]+)/);
        if (qMatch) {
            return qMatch[1].replace(/\+/g, " ");
        }

        // Fallback for short URLs that resolved to something readable but w/o /place/
        // e.g. https://www.google.com/maps/search/Business+Name/@...
        const searchMatch = decoded.match(/\/search\/([^\/@?]+)/);
        if (searchMatch) {
            return searchMatch[1].replace(/\+/g, " ");
        }

        return null;
    } catch {
        return null;
    }
}

function getMockData() {
    return {
        name: "Mock Coffee Roasters",
        formatted_address: "123 Mock St, Tech City, TC 90210",
        rating: 4.5,
        user_ratings_total: 128,
        types: ["cafe", "food", "point_of_interest", "establishment"],
        place_id: "mock_place_id_123",
        url: "https://maps.google.com/?cid=mock",
        website: "https://mockcoffee.com",
        reviews: [
            {
                author_name: "John Doe",
                rating: 5,
                relative_time_description: "a month ago",
                text: "Amazing coffee and great atmosphere! The staff is super friendly.",
                time: Math.floor(Date.now() / 1000) - 2592000
            },
            {
                author_name: "Jane Smith",
                rating: 2,
                relative_time_description: "2 months ago",
                text: "Coffee was cold and service was slow. Disappointed.",
                time: Math.floor(Date.now() / 1000) - 5184000
            },
            {
                author_name: "Bob Johnson",
                rating: 4,
                relative_time_description: "3 months ago",
                text: "Good place to work, wifi is fast. Prices are a bit high though.",
                time: Math.floor(Date.now() / 1000) - 7776000
            },
            {
                author_name: "Alice Brown",
                rating: 1,
                relative_time_description: "a week ago",
                text: "Rude staff. I will not be coming back.",
                time: Math.floor(Date.now() / 1000) - 604800
            },
            {
                author_name: "Chris Wilson",
                rating: 5,
                relative_time_description: "yesterday",
                text: "Best latte in town! Highly recommend the avocado toast.",
                time: Math.floor(Date.now() / 1000) - 86400
            }
        ]
    };
}
