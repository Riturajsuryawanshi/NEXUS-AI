# Review Intelligence - Quick Test Guide

## Test URLs (Popular Businesses)

### Coffee Shops
```
https://www.google.com/maps/place/Starbucks/@40.7589,-73.9851,17z
https://www.google.com/maps/place/Blue+Bottle+Coffee/@37.7749,-122.4194,17z
```

### Restaurants
```
https://www.google.com/maps/place/The+French+Laundry/@38.4037,-122.4369,17z
https://www.google.com/maps/place/Eleven+Madison+Park/@40.7424,-73.9871,17z
```

### Hotels
```
https://www.google.com/maps/place/The+Plaza+Hotel/@40.7644,-73.9747,17z
https://www.google.com/maps/place/Waldorf+Astoria/@40.7565,-73.9744,17z
```

## How to Get a Google Maps URL

1. Go to [Google Maps](https://maps.google.com)
2. Search for any business
3. Click on the business
4. Click "Share" button
5. Copy the link
6. Paste into Review Intelligence

## Expected Analysis Time

- **Small Business** (< 50 reviews): 5-10 seconds
- **Medium Business** (50-200 reviews): 10-20 seconds
- **Large Business** (200+ reviews): 20-30 seconds

## What You'll See

### 1. Business Summary
- Business name
- Overall rating (e.g., 4.2/5)
- Total review count
- Place ID

### 2. Sentiment Clusters (2-5 clusters)
Each cluster shows:
- Theme (e.g., "Food Quality", "Service Speed")
- Frequency percentage
- Sentiment (positive/negative/mixed)
- Key points from reviews
- Business impact estimate

### 3. Revenue Leaks (1-3 critical issues)
Each leak shows:
- Issue description
- Potential business risk
- Recommended fix

### 4. Upsell Opportunities (1-3 opportunities)
Each opportunity shows:
- Growth opportunity
- Supporting review pattern

## Testing Checklist

- [ ] Paste valid Google Maps URL
- [ ] See loading animation
- [ ] Business summary appears
- [ ] Sentiment clusters display correctly
- [ ] Revenue leaks show actionable fixes
- [ ] Upsell opportunities are relevant
- [ ] Can paste another URL (cache test)
- [ ] Error handling works for invalid URLs

## Common Test Scenarios

### ✅ Valid URL
```
Input: https://maps.app.goo.gl/xyz123
Output: Full audit report
```

### ❌ Invalid URL
```
Input: https://example.com
Output: "Invalid Google Maps URL. Could not extract Place ID."
```

### ⚡ Cached Result
```
Input: Same URL within 24 hours
Output: Instant results (no API call)
```

## Sample Output Preview

```
╔══════════════════════════════════════════════════════╗
║  BUSINESS SUMMARY                                    ║
╠══════════════════════════════════════════════════════╣
║  Joe's Coffee Shop                                   ║
║  ⭐⭐⭐⭐ 4.2/5 • 156 Reviews                         ║
╚══════════════════════════════════════════════════════╝

📊 SENTIMENT CLUSTERS

🟢 Coffee Quality (45% of reviews)
   ✓ "Best espresso in the neighborhood"
   ✓ "Beans are always fresh"
   Impact: Strong retention driver

🔴 Wait Times (30% of reviews)
   ⚠ "Always a long line in the morning"
   ⚠ "Slow service during rush hour"
   Impact: Losing 20-30% of potential customers

💰 REVENUE LEAKS

🚨 Peak Hour Staffing
   Risk: Lost sales, customer churn
   Fix: Add 1-2 baristas during 7-9am

💡 UPSELL OPPORTUNITIES

✨ Loyalty Program
   Pattern: "I come here every day" (18% of reviews)
```

## Performance Benchmarks

- **API Response Time**: 2-5 seconds
- **AI Analysis Time**: 3-8 seconds
- **Total Time**: 5-15 seconds
- **Cache Hit**: < 100ms

## Debugging Tips

### Check Browser Console
```javascript
// Open DevTools (F12)
// Look for:
- "Fetching place data..."
- "AI analysis complete"
- Any error messages
```

### Check Network Tab
```
1. Open DevTools → Network
2. Filter: "places-data"
3. Check response status (should be 200)
4. View response JSON
```

### Clear Cache
```javascript
// In browser console:
localStorage.clear()
// Then refresh page
```

## Success Metrics

After testing, you should see:
- ✅ Clean, professional UI
- ✅ Fast loading (< 15 seconds)
- ✅ Accurate sentiment analysis
- ✅ Actionable recommendations
- ✅ Client-ready format
- ✅ No errors or crashes

## Next: Real-World Testing

1. **Local Business**: Test with a nearby restaurant
2. **Your Business**: Analyze your own reviews
3. **Competitor**: Check competitor insights
4. **Client Demo**: Show to potential client

---

**Ready to Test?** Just run `npm run dev` and paste a Google Maps URL!
