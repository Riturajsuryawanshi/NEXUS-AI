# 🚀 Review Intelligence - Launch Checklist

## Phase 1: Setup (30 minutes)

### Step 1: Google Places API Configuration
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Create new project (or select existing)
- [ ] Enable "Places API"
- [ ] Create API Key
- [ ] Copy API key to clipboard
- [ ] (Optional) Restrict key to Places API only

**API Key**: `_________________________________`

### Step 2: Supabase Configuration
- [ ] Open terminal in project directory
- [ ] Run: `supabase secrets set GOOGLE_PLACES_API_KEY=your_key_here`
- [ ] Verify secret is set: `supabase secrets list`
- [ ] Deploy edge function: `supabase functions deploy places-data`
- [ ] Check deployment: `supabase functions list`

### Step 3: Local Environment
- [ ] Verify `.env.local` has `GEMINI_API_KEY`
- [ ] Run: `npm install`
- [ ] Run: `npm run dev`
- [ ] Open: http://localhost:3000
- [ ] Verify app loads without errors

---

## Phase 2: Testing (15 minutes)

### Test 1: Basic Functionality
- [ ] Navigate to dashboard
- [ ] Find "Review Intelligence" section
- [ ] Paste test URL: `https://www.google.com/maps/place/Starbucks/@40.7589,-73.9851,17z`
- [ ] Click submit
- [ ] Wait for loading animation
- [ ] Verify results appear

**Expected**: Business summary, sentiment clusters, revenue leaks, upsell opportunities

### Test 2: Error Handling
- [ ] Paste invalid URL: `https://example.com`
- [ ] Verify error message appears
- [ ] Error should say: "Invalid Google Maps URL"

### Test 3: Caching
- [ ] Paste same URL from Test 1 again
- [ ] Results should appear instantly (< 1 second)
- [ ] Open browser DevTools → Application → Local Storage
- [ ] Verify cache key exists: `nexus_review_cache_...`

### Test 4: Different Business Types
- [ ] Test restaurant URL
- [ ] Test retail store URL
- [ ] Test service business URL
- [ ] Verify all generate relevant insights

---

## Phase 3: First Real Audit (30 minutes)

### Find Your First Target Business
- [ ] Open Google Maps
- [ ] Search for local businesses in your area
- [ ] Filter by: 50-200 reviews, 3.5-4.5 stars
- [ ] Look for businesses with visible issues in reviews
- [ ] Copy business URL

**Target Business**: `_________________________________`

### Run the Audit
- [ ] Paste URL into Review Intelligence
- [ ] Wait for analysis
- [ ] Review all sections carefully
- [ ] Take notes on key findings

**Key Findings**:
1. `_________________________________`
2. `_________________________________`
3. `_________________________________`

### Analyze the Output
- [ ] Are sentiment clusters accurate?
- [ ] Do revenue leaks make sense?
- [ ] Are upsell opportunities realistic?
- [ ] Is the report client-ready?

**Quality Score**: ___/10

---

## Phase 4: First Outreach (1 hour)

### Prepare Your Pitch
- [ ] Read `MONETIZATION_PLAYBOOK.md`
- [ ] Choose outreach template
- [ ] Customize with business-specific insights
- [ ] Prepare pricing (suggest: $299 for first client)

### Find Contact Information
- [ ] Check business website
- [ ] Look for owner/manager name
- [ ] Find email address
- [ ] Check LinkedIn for decision maker

**Contact Info**:
- Name: `_________________________________`
- Email: `_________________________________`
- Phone: `_________________________________`

### Send First Email
- [ ] Personalize subject line
- [ ] Include 2-3 specific insights from audit
- [ ] Attach or link to full report
- [ ] Include clear call-to-action
- [ ] Send email

**Email Sent**: ___/___/___ at ___:___

### Follow Up Plan
- [ ] Set reminder for 3 days
- [ ] Prepare follow-up email
- [ ] Have discovery call script ready
- [ ] Prepare pricing sheet

---

## Phase 5: Scale (Ongoing)

### Week 1 Goals
- [ ] Run 20 audits
- [ ] Send 10 outreach emails
- [ ] Book 2 discovery calls
- [ ] Close 1 deal

### Week 2 Goals
- [ ] Run 30 audits
- [ ] Send 15 outreach emails
- [ ] Book 3 discovery calls
- [ ] Close 2 deals

### Week 3 Goals
- [ ] Run 40 audits
- [ ] Send 20 outreach emails
- [ ] Book 5 discovery calls
- [ ] Close 3 deals

### Week 4 Goals
- [ ] Run 50 audits
- [ ] Send 25 outreach emails
- [ ] Book 5 discovery calls
- [ ] Close 3 deals
- [ ] Hit $1,000 revenue

---

## Troubleshooting Checklist

### If audits aren't working:
- [ ] Check browser console for errors
- [ ] Verify `GEMINI_API_KEY` in `.env.local`
- [ ] Check `GOOGLE_PLACES_API_KEY` in Supabase
- [ ] Test edge function: `supabase functions logs places-data`
- [ ] Verify Google Places API is enabled
- [ ] Check API key restrictions

### If results are poor quality:
- [ ] Try businesses with more reviews (100+)
- [ ] Avoid businesses with < 20 reviews
- [ ] Check if reviews are in English
- [ ] Verify Gemini API is responding
- [ ] Review prompt in `reviewService.ts`

### If outreach isn't working:
- [ ] Review email templates
- [ ] Make emails more specific
- [ ] Include actual numbers from audit
- [ ] Follow up after 3 days
- [ ] Try different subject lines
- [ ] Test with different industries

---

## Success Metrics

### Technical Metrics
- [ ] 95%+ audit success rate
- [ ] < 10 second average processing time
- [ ] 80%+ cache hit rate
- [ ] Zero critical errors

### Business Metrics
- [ ] 10%+ email response rate
- [ ] 20%+ call booking rate
- [ ] 40%+ close rate
- [ ] $299+ average deal size

### Revenue Goals
- [ ] Week 1: $299 (1 client)
- [ ] Week 2: $598 (2 clients)
- [ ] Week 3: $897 (3 clients)
- [ ] Week 4: $1,196 (4 clients)
- [ ] Month 2: $2,500
- [ ] Month 3: $5,000

---

## Quick Reference

### Important Files
- Setup Guide: `REVIEW_INTELLIGENCE_GUIDE.md`
- Test Guide: `REVIEW_INTELLIGENCE_TEST.md`
- Monetization: `MONETIZATION_PLAYBOOK.md`
- Architecture: `ARCHITECTURE.md`
- Summary: `REVIEW_INTELLIGENCE_SUMMARY.md`

### Key Commands
```bash
# Start dev server
npm run dev

# Deploy edge function
supabase functions deploy places-data

# Check logs
supabase functions logs places-data

# Set secret
supabase secrets set GOOGLE_PLACES_API_KEY=your_key
```

### Support Resources
- Google Places API: https://developers.google.com/maps/documentation/places
- Gemini API: https://ai.google.dev/docs
- Supabase Docs: https://supabase.com/docs

---

## 🎉 You're Ready to Launch!

**Current Status**: [ ] Setup Complete [ ] Tested [ ] First Audit Done [ ] First Email Sent

**Next Action**: `_________________________________`

**Target Date**: ___/___/___

**Expected Revenue (30 days)**: $__________

---

**Remember**: The feature is already built. You just need to configure it and start using it!

Good luck! 🚀
