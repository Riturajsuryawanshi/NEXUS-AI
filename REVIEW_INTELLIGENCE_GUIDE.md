# Review Intelligence Setup Guide

## Overview
Review Intelligence is **already fully implemented** in your Nexus-AI app! This feature allows users to paste a Google Maps business link and instantly generate a structured business audit based on real customer reviews.

## What's Built

### ✅ Frontend (`components/ReviewIntelligence.tsx`)
- Clean, modern UI with loading states
- Real-time analysis display
- Business summary with ratings
- Sentiment clusters (positive/negative/mixed)
- Revenue leak indicators
- Upsell opportunities
- Client-ready report format

### ✅ Backend (`services/reviewService.ts`)
- Google Maps URL parsing (extracts Place ID)
- 24-hour caching for performance
- AI-powered analysis using Gemini
- Structured JSON output

### ✅ Edge Function (`supabase/functions/places-data`)
- Fetches business data from Google Places API
- Retrieves reviews and ratings
- CORS-enabled for frontend access

### ✅ Integration
- Already added to main dashboard in `App.tsx`
- Appears above data analysis jobs
- No additional routing needed

## Setup Instructions

### 1. Get Google Places API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Places API**
4. Create credentials → API Key
5. Restrict the key to Places API for security

### 2. Configure Supabase Edge Function
Set the Google Places API key as a secret in Supabase:

```bash
# Using Supabase CLI
supabase secrets set GOOGLE_PLACES_API_KEY=your_api_key_here
```

Or via Supabase Dashboard:
- Go to Project Settings → Edge Functions
- Add secret: `GOOGLE_PLACES_API_KEY`

### 3. Deploy Edge Function
```bash
cd supabase/functions
supabase functions deploy places-data
```

### 4. Run the App
```bash
npm install
npm run dev
```

## How It Works

### User Flow
1. User pastes Google Maps URL (e.g., `https://maps.app.goo.gl/...`)
2. System extracts Place ID from URL
3. Edge function fetches business data + reviews from Google Places API
4. Gemini AI analyzes reviews and generates:
   - **Sentiment Clusters**: Recurring themes (positive/negative/mixed)
   - **Revenue Leaks**: Critical issues losing money
   - **Upsell Opportunities**: Growth potential based on customer feedback
5. Results displayed in client-ready format

### Supported URL Formats
- `https://maps.app.goo.gl/...`
- `https://www.google.com/maps/place/...`
- URLs with `place_id=...` parameter
- URLs with `/place/[name]/@...` format

### Caching
- Results cached for 24 hours in localStorage
- Key format: `nexus_review_cache_[place_id]`
- Reduces API calls and improves performance

## Example Output Structure

```json
{
  "business_summary": {
    "name": "Coffee Shop XYZ",
    "rating": 4.2,
    "total_reviews": 342,
    "place_id": "ChIJ..."
  },
  "review_clusters": [
    {
      "theme": "Coffee Quality",
      "frequency_percentage": 45,
      "sentiment": "positive",
      "key_complaints_or_praises": [
        "Best espresso in town",
        "Consistently great taste"
      ],
      "business_impact_estimate": "Strong retention driver"
    }
  ],
  "revenue_leak_indicators": [
    {
      "issue": "Slow service during peak hours",
      "potential_business_risk": "Lost customers, negative word-of-mouth",
      "recommended_fix": "Add 1-2 staff during 8-10am rush"
    }
  ],
  "upsell_opportunities": [
    {
      "opportunity": "Introduce loyalty program",
      "supporting_review_pattern": "15% of reviews mention being 'regulars'"
    }
  ]
}
```

## Monetization Strategy

### For Freelancers & Agencies
1. **Lead Generation**: Run audits on local businesses
2. **Outreach**: Send audit reports as cold outreach
3. **Consulting**: Offer implementation services for fixes
4. **Retainer**: Monthly review monitoring + action plans

### Pricing Ideas
- **Free Audit**: First report free (lead magnet)
- **One-Time Report**: $99-$299 per business
- **Monthly Monitoring**: $199-$499/month
- **Implementation Package**: $1,500-$5,000

## API Costs

### Google Places API
- **Place Details**: $0.017 per request
- **Reviews included**: No extra cost
- **Monthly free tier**: $200 credit (~11,700 requests)

### Gemini API
- **Flash model**: Very low cost
- **Typical audit**: ~2,000 tokens (~$0.001)
- **Monthly estimate**: $10-50 for 1,000 audits

## Troubleshooting

### "Invalid Google Maps URL"
- Ensure URL contains Place ID or business name
- Try opening the link in browser first
- Copy the full URL from address bar

### "Failed to fetch business data"
- Check `GOOGLE_PLACES_API_KEY` is set in Supabase
- Verify Places API is enabled in Google Cloud
- Check API key restrictions

### "Failed to generate audit report"
- Check Gemini API key in `.env.local`
- Verify `GEMINI_API_KEY` is set correctly
- Check browser console for detailed errors

### Edge Function Not Working
```bash
# Check function logs
supabase functions logs places-data

# Redeploy if needed
supabase functions deploy places-data
```

## Next Steps

### Enhancements You Could Add
1. **Export to PDF**: Generate downloadable reports
2. **Competitor Analysis**: Compare multiple businesses
3. **Trend Tracking**: Monitor review sentiment over time
4. **Email Reports**: Automated delivery to clients
5. **White Label**: Custom branding for agencies
6. **Bulk Processing**: Analyze multiple locations at once

### Integration Ideas
1. **CRM Integration**: Auto-add leads from audits
2. **Email Automation**: Send reports via SendGrid/Mailgun
3. **Payment Gateway**: Charge for premium reports
4. **API Access**: Let others use your audit engine

## Support

- **Google Places API Docs**: https://developers.google.com/maps/documentation/places/web-service
- **Gemini API Docs**: https://ai.google.dev/docs
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions

---

**Status**: ✅ Fully Implemented & Ready to Use

Just configure the Google Places API key and you're ready to start generating revenue insights!
