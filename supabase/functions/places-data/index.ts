
// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { place_id, query, action } = await req.json();
        const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY');

        if (!apiKey) {
            throw new Error("Missing Google Places API Key");
        }

        if (action === 'search' && query) {
            // Text search to find place
            const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id&key=${apiKey}`;
            
            const searchResponse = await fetch(searchUrl);
            const searchData = await searchResponse.json();
            
            if (searchData.status !== 'OK' || !searchData.candidates?.[0]?.place_id) {
                throw new Error(`Could not find business: ${query}`);
            }
            
            const foundPlaceId = searchData.candidates[0].place_id;
            
            // Now fetch details with the found place_id
            const fields = 'name,rating,user_ratings_total,reviews,place_id,formatted_address,url,website';
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${foundPlaceId}&fields=${fields}&key=${apiKey}`;
            
            const detailsResponse = await fetch(detailsUrl);
            const detailsData = await detailsResponse.json();
            
            if (detailsData.status !== 'OK') {
                throw new Error(`Google API Error: ${detailsData.status}`);
            }
            
            return new Response(JSON.stringify(detailsData.result), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        if (!place_id) {
            throw new Error("Missing place_id or query");
        }

        if (action === 'details') {
            // Fetch Details + Reviews
            const fields = 'name,rating,user_ratings_total,reviews,place_id,formatted_address,url,website';
            const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=${fields}&key=${apiKey}`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.status !== 'OK') {
                throw new Error(`Google API Error: ${data.status} - ${data.error_message || ''}`);
            }

            return new Response(JSON.stringify(data.result), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ error: "Invalid action" }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
