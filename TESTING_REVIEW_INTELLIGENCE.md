# Testing Review Intelligence - Step by Step

## Prerequisites
✅ Nexus Studio is running (`npm run dev`)
✅ You're logged into the app
✅ You're on the Studio dashboard

## Test 1: Basic Functionality

### Steps:
1. Scroll down on the Studio dashboard
2. Look for the **"Review Intelligence"** section with a purple star icon
3. You should see:
   - Title: "Review Intelligence"
   - Subtitle: "Turn public reviews into revenue insights"
   - Empty state with map pin icon
   - Input field at bottom: "Paste Google Maps business link..."

### Expected Result:
✅ Component renders correctly
✅ Input field is visible and clickable
✅ "Analyze" button is present

---

## Test 2: URL Validation

### Test Valid URLs:
Paste each of these and click "Analyze":

```
https://www.google.com/maps/place/Starbucks/@40.7589,-73.9851,17z
https://maps.google.com/?cid=12345678901234567890
https://goo.gl/maps/abc123
```

### Expected Result:
✅ Loading spinner appears
✅ "Analyzing reviews..." message shows
✅ After 5-10 seconds, report appears

### Test Invalid URLs:
```
https://www.example.com
just some text
https://maps.google.com (without business)
```

### Expected Result:
❌ Error message: "Invalid Google Maps link. Please provide a valid business URL."

---

## Test 3: Report Display (FREE Plan)

### Steps:
1. Paste any valid Google Maps URL
2. Click "Analyze"
3. Wait for report

### Expected Result:
✅ Business Summary shows:
   - Business name
   - Star rating (1-5)
   - Total reviews count

✅ Review Themes section shows:
   - 1 theme visible (e.g., "Service Quality")
   - Sentiment badge (positive/negative/mixed)
   - Percentage of reviews
   - Key points listed

✅ Second theme card shows:
   - Lock icon 🔒
   - "Upgrade to view all themes" message
   - "Upgrade Now" button

✅ Revenue Leaks section shows:
   - Lock icon 🔒
   - "Revenue Leak Analysis Locked" message
   - "Upgrade to Solo Plan" button

---

## Test 4: Report Display (SOLO/PRO Plan)

### Steps:
1. Upgrade to SOLO or PRO plan (or modify profile in code)
2. Paste any valid Google Maps URL
3. Click "Analyze"

### Expected Result:
✅ All review themes visible (no lock)
✅ Revenue Leak Indicators section shows:
   - Red warning cards
   - Issue description
   - Potential risk
   - Recommended fix

✅ Growth Opportunities section shows:
   - Green opportunity cards
   - Opportunity description
   - Supporting pattern

✅ "Export Full Report" button visible at bottom

---

## Test 5: Loading States

### Steps:
1. Paste URL
2. Click "Analyze"
3. Observe loading state

### Expected Result:
✅ Input field disabled during loading
✅ Button shows "Analyzing" with spinner icon
✅ Loading spinner in output area
✅ "Analyzing reviews..." message

---

## Test 6: Error Handling

### Steps:
1. Disconnect internet (or simulate API failure)
2. Paste valid URL
3. Click "Analyze"

### Expected Result:
✅ Error message appears in red box
✅ Error icon visible
✅ Descriptive error message
✅ Can try again with new URL

---

## Test 7: Multiple Analyses

### Steps:
1. Analyze first business
2. Wait for results
3. Paste different URL
4. Analyze second business

### Expected Result:
✅ Previous results replaced with new results
✅ No duplicate content
✅ Smooth transition

---

## Test 8: Caching

### Steps:
1. Analyze a business (e.g., Starbucks)
2. Note the results
3. Analyze the SAME business again

### Expected Result:
✅ Results appear instantly (cached)
✅ Same data as before
✅ No loading delay

---

## Test 9: Responsive Design

### Steps:
1. Resize browser window
2. Test on mobile view (< 768px)
3. Test on tablet view (768-1024px)
4. Test on desktop view (> 1024px)

### Expected Result:
✅ Layout adjusts properly
✅ Input field remains accessible
✅ Cards stack on mobile
✅ No horizontal scroll

---

## Test 10: Integration with Dashboard

### Steps:
1. Upload a CSV file (existing feature)
2. Scroll down to Review Intelligence
3. Use Review Intelligence
4. Scroll back up to CSV analysis

### Expected Result:
✅ Both features work independently
✅ No conflicts or errors
✅ Smooth scrolling
✅ No layout issues

---

## Quick Verification Checklist

Run through this in 2 minutes:

- [ ] Component visible on dashboard
- [ ] Can paste URL in input
- [ ] Click Analyze button works
- [ ] Loading state appears
- [ ] Report displays after loading
- [ ] Business summary shows correctly
- [ ] Review themes display
- [ ] FREE plan shows locks
- [ ] Error handling works
- [ ] Can analyze multiple businesses

---

## Common Issues & Fixes

### Issue: Component not showing
**Fix**: Check that ReviewIntelligence is imported in App.tsx

### Issue: "Cannot read property 'planType'"
**Fix**: Ensure profile is passed to ReviewIntelligence component

### Issue: API errors
**Fix**: Check that GeminiService.chat() method exists

### Issue: Styling broken
**Fix**: Verify Tailwind CSS classes are loading

### Issue: No results after clicking Analyze
**Fix**: Check browser console for errors

---

## Success Criteria

✅ All 10 tests pass
✅ No console errors
✅ Smooth user experience
✅ Professional appearance
✅ Works on all screen sizes

---

## Report Issues

If you find bugs:
1. Note the exact steps to reproduce
2. Check browser console for errors
3. Take a screenshot
4. Document expected vs actual behavior

---

**Ready to test? Start with Test 1 and work your way down! 🚀**
