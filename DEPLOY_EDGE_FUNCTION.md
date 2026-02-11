# Deploy Updated Edge Function

Run this command to deploy the updated places-data function:

```bash
supabase functions deploy places-data
```

If you don't have Supabase CLI installed:

```bash
npm install -g supabase
```

Then login and deploy:

```bash
supabase login
supabase functions deploy places-data
```

## What Was Fixed

1. **Better URL parsing**: Now handles all Google Maps URL formats
2. **Text search fallback**: If Place ID can't be extracted, searches by business name
3. **Updated placeholder**: "Paste Google Maps business link..."

## Supported URL Formats

✅ https://maps.app.goo.gl/xyz123
✅ https://www.google.com/maps/place/Business+Name/@lat,lng
✅ https://www.google.com/maps/place/Business+Name/data=...
✅ https://maps.google.com/?cid=123456789
✅ Any URL with place_id parameter

## Test After Deploy

Paste any Google Maps business URL and it should work now.
