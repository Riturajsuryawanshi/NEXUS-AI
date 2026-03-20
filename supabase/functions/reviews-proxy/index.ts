import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// MULTI-PLATFORM REVIEWS PROXY
// Supports: Google, Yelp, Trustpilot + stubs
// ============================================

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const { action, platform, url, placeId, query, location, category } = body;

        if (action === "find_competitors") {
            // Competitor discovery via Google Nearby Search
            const result = await findCompetitors(query, location, category, placeId);
            return jsonResponse(result);
        }

        if (action === "fetch_reviews") {
            // Multi-platform review fetching
            const result = await fetchPlatformReviews(platform || "google", url, placeId, query);
            return jsonResponse(result);
        }

        // Default: treat as Google places lookup (backward compat)
        if (url || placeId) {
            const result = await fetchGoogleReviews(url, placeId);
            return jsonResponse(result);
        }

        throw new Error("Missing 'action' parameter. Use 'fetch_reviews' or 'find_competitors'.");
    } catch (error) {
        console.error("reviews-proxy error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

// ============================================
// PLATFORM ROUTER
// ============================================

async function fetchPlatformReviews(
    platform: string,
    url?: string,
    placeId?: string,
    query?: string
): Promise<any> {
    switch (platform) {
        case "google":
            return fetchGoogleReviews(url, placeId);
        case "trustpilot":
            return fetchTrustpilotReviews(url, query);
        case "yelp":
            return fetchYelpReviews(url, query);
        case "tripadvisor":
        case "zomato":
        case "justdial":
        case "facebook":
            return {
                platform,
                reviews: [],
                rating: 0,
                totalReviews: 0,
                error: `${platform} integration coming soon. Add your ${platform.toUpperCase()}_API_KEY to enable.`,
                fetchedAt: Date.now(),
            };
        default:
            throw new Error(`Unknown platform: ${platform}`);
    }
}

// ============================================
// GOOGLE PLACES (reuses existing logic)
// ============================================

async function fetchGoogleReviews(url?: string, placeId?: string): Promise<any> {
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
        return {
            platform: "google",
            reviews: [],
            rating: 0,
            totalReviews: 0,
            error: "GOOGLE_PLACES_API_KEY not configured",
            fetchedAt: Date.now(),
        };
    }

    let targetPlaceId = placeId;

    // Resolve URL to place ID
    if (!targetPlaceId && url) {
        let finalUrl = url;

        // Handle short URLs
        if (url.includes("maps.app.goo.gl") || url.includes("goo.gl/maps")) {
            try {
                const fullResp = await fetch(url);
                finalUrl = fullResp.url;
            } catch (e) {
                console.warn("Failed to resolve short URL:", e);
            }
        }

        // Extract search query from URL
        const searchQuery = extractSearchQueryFromUrl(finalUrl);
        if (searchQuery) {
            const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;
            const searchRes = await fetch(searchUrl);
            const searchData = await searchRes.json();

            if (searchData.status === "OK" && searchData.results.length > 0) {
                targetPlaceId = searchData.results[0].place_id;
            } else {
                throw new Error(`Could not find business for: ${searchQuery}`);
            }
        }
    }

    if (!targetPlaceId) {
        throw new Error("Could not determine Google Place ID");
    }

    // Fetch place details
    const fields = "name,formatted_address,rating,user_ratings_total,types,reviews,url,website,place_id,geometry,formatted_phone_number";
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${targetPlaceId}&fields=${fields}&reviews_sort=newest&key=${apiKey}`;
    const response = await fetch(detailsUrl);
    const data = await response.json();

    if (data.status !== "OK") {
        throw new Error(`Google Places API Error: ${data.status} - ${data.error_message || ""}`);
    }

    const result = data.result;

    return {
        platform: "google",
        place_id: result.place_id,
        name: result.name,
        formatted_address: result.formatted_address,
        rating: result.rating || 0,
        totalReviews: result.user_ratings_total || 0,
        types: result.types || [],
        geometry: result.geometry,
        reviews: (result.reviews || []).map((r: any) => ({
            rating: r.rating,
            text: r.text || "",
            timestamp: r.time ? new Date(r.time * 1000).toISOString() : new Date().toISOString(),
            author: r.author_name || "Google User",
            platform: "google",
        })),
        profileUrl: result.url,
        fetchedAt: Date.now(),
    };
}

// ============================================
// TRUSTPILOT (Public API — no key required)
// ============================================

async function fetchTrustpilotReviews(url?: string, query?: string): Promise<any> {
    try {
        // Extract business domain from URL or use query as domain
        let domain = query || "";

        if (url) {
            // Trustpilot URLs: https://www.trustpilot.com/review/example.com
            const match = url.match(/trustpilot\.com\/review\/([^/?#]+)/);
            if (match) {
                domain = match[1];
            }
        }

        if (!domain) {
            return {
                platform: "trustpilot",
                reviews: [],
                rating: 0,
                totalReviews: 0,
                error: "Provide a Trustpilot URL (trustpilot.com/review/domain.com) or business domain",
                fetchedAt: Date.now(),
            };
        }

        // Find business unit by domain
        const findUrl = `https://api.trustpilot.com/v1/business-units/find?name=${encodeURIComponent(domain)}`;
        const findRes = await fetch(findUrl, {
            headers: { "Accept": "application/json" },
        });

        if (!findRes.ok) {
            return {
                platform: "trustpilot",
                reviews: [],
                rating: 0,
                totalReviews: 0,
                error: `Trustpilot: Could not find business for domain "${domain}"`,
                fetchedAt: Date.now(),
            };
        }

        const businessUnit = await findRes.json();
        const businessUnitId = businessUnit.id;
        const trustScore = businessUnit.score?.trustScore || 0;
        const numberOfReviews = businessUnit.numberOfReviews || 0;

        // Fetch recent reviews
        const reviewsUrl = `https://api.trustpilot.com/v1/business-units/${businessUnitId}/reviews?perPage=20&orderBy=recency`;
        const reviewsRes = await fetch(reviewsUrl, {
            headers: { "Accept": "application/json" },
        });

        let reviews: any[] = [];
        if (reviewsRes.ok) {
            const reviewsData = await reviewsRes.json();
            reviews = (reviewsData.reviews || []).map((r: any) => ({
                rating: r.stars || 0,
                text: r.text || r.title || "",
                timestamp: r.createdAt || new Date().toISOString(),
                author: r.consumer?.displayName || "Trustpilot User",
                platform: "trustpilot" as const,
            }));
        }

        return {
            platform: "trustpilot",
            name: businessUnit.displayName || domain,
            rating: trustScore,
            totalReviews: numberOfReviews,
            reviews,
            profileUrl: `https://www.trustpilot.com/review/${domain}`,
            fetchedAt: Date.now(),
        };
    } catch (err) {
        console.error("Trustpilot fetch error:", err);
        return {
            platform: "trustpilot",
            reviews: [],
            rating: 0,
            totalReviews: 0,
            error: `Trustpilot fetch failed: ${err.message}`,
            fetchedAt: Date.now(),
        };
    }
}

// ============================================
// YELP (Fusion API — requires YELP_API_KEY)
// ============================================

async function fetchYelpReviews(url?: string, query?: string): Promise<any> {
    const apiKey = Deno.env.get("YELP_API_KEY");
    if (!apiKey) {
        return {
            platform: "yelp",
            reviews: [],
            rating: 0,
            totalReviews: 0,
            error: "YELP_API_KEY not configured. Add it to Supabase secrets to enable Yelp reviews.",
            fetchedAt: Date.now(),
        };
    }

    try {
        let businessId = "";

        // Extract business ID from Yelp URL
        if (url) {
            const match = url.match(/yelp\.com\/biz\/([^/?#]+)/);
            if (match) businessId = match[1];
        }

        // If no ID from URL, search by query
        if (!businessId && query) {
            const searchUrl = `https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(query)}&limit=1`;
            const searchRes = await fetch(searchUrl, {
                headers: { Authorization: `Bearer ${apiKey}` },
            });
            const searchData = await searchRes.json();
            if (searchData.businesses && searchData.businesses.length > 0) {
                businessId = searchData.businesses[0].id;
            }
        }

        if (!businessId) {
            return {
                platform: "yelp",
                reviews: [],
                rating: 0,
                totalReviews: 0,
                error: "Could not find Yelp business. Provide a Yelp URL or business name.",
                fetchedAt: Date.now(),
            };
        }

        // Fetch business details
        const detailRes = await fetch(`https://api.yelp.com/v3/businesses/${businessId}`, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });
        const business = await detailRes.json();

        // Fetch reviews
        const reviewsRes = await fetch(`https://api.yelp.com/v3/businesses/${businessId}/reviews?limit=20&sort_by=yelp_sort`, {
            headers: { Authorization: `Bearer ${apiKey}` },
        });
        const reviewsData = await reviewsRes.json();

        const reviews = (reviewsData.reviews || []).map((r: any) => ({
            rating: r.rating || 0,
            text: r.text || "",
            timestamp: r.time_created || new Date().toISOString(),
            author: r.user?.name || "Yelp User",
            platform: "yelp" as const,
        }));

        return {
            platform: "yelp",
            name: business.name || businessId,
            rating: business.rating || 0,
            totalReviews: business.review_count || 0,
            reviews,
            profileUrl: business.url || `https://www.yelp.com/biz/${businessId}`,
            fetchedAt: Date.now(),
        };
    } catch (err) {
        console.error("Yelp fetch error:", err);
        return {
            platform: "yelp",
            reviews: [],
            rating: 0,
            totalReviews: 0,
            error: `Yelp fetch failed: ${err.message}`,
            fetchedAt: Date.now(),
        };
    }
}

// ============================================
// COMPETITOR DISCOVERY (Google Nearby Search)
// ============================================

async function findCompetitors(
    query?: string,
    location?: string,
    category?: string,
    excludePlaceId?: string
): Promise<any> {
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
        return { competitors: [], error: "GOOGLE_PLACES_API_KEY not configured" };
    }

    try {
        let competitors: any[] = [];

        if (location) {
            // Nearby search using coordinates + category
            const type = category || "establishment";
            const radius = 3000; // 3km radius
            const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=${type}&key=${apiKey}`;
            const res = await fetch(nearbyUrl);
            const data = await res.json();

            if (data.status === "OK") {
                competitors = data.results;
            }
        } else if (query) {
            // Text search for competitors
            const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
            const res = await fetch(searchUrl);
            const data = await res.json();

            if (data.status === "OK") {
                competitors = data.results;
            }
        }

        // Filter out subject business and limit to 5
        const filtered = competitors
            .filter((c: any) => c.place_id !== excludePlaceId)
            .slice(0, 5)
            .map((c: any) => ({
                name: c.name,
                place_id: c.place_id,
                rating: c.rating || 0,
                total_reviews: c.user_ratings_total || 0,
                types: c.types || [],
                address: c.formatted_address || c.vicinity || "",
                location: c.geometry?.location || null,
            }));

        return { competitors: filtered };
    } catch (err) {
        console.error("Competitor discovery error:", err);
        return { competitors: [], error: `Competitor search failed: ${err.message}` };
    }
}

// ============================================
// UTILITIES
// ============================================

function extractSearchQueryFromUrl(url: string): string | null {
    try {
        const decoded = decodeURIComponent(url);
        const placeMatch = decoded.match(/\/place\/([^/@?]+)/);
        if (placeMatch) return placeMatch[1].replace(/\+/g, " ");
        const qMatch = decoded.match(/[?&]q=([^&]+)/);
        if (qMatch) return qMatch[1].replace(/\+/g, " ");
        const searchMatch = decoded.match(/\/search\/([^/@?]+)/);
        if (searchMatch) return searchMatch[1].replace(/\+/g, " ");
        return null;
    } catch {
        return null;
    }
}

function jsonResponse(data: any) {
    return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}
