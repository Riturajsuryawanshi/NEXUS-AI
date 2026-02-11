# 🎯 Review Intelligence - Quick Start

## Where to Find It

After logging into Nexus Studio, you'll see the Review Intelligence section on your main dashboard:

```
┌─────────────────────────────────────────────────────────┐
│  NEXUS STUDIO                    [+ New Analysis Session]│
│                                                           │
│  Connect your business intelligence to our deterministic │
│  neural engine...                                         │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  📊 Data Upload Section (existing)               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  ⭐ Review Intelligence                          │   │
│  │  Turn public reviews into revenue insights       │   │
│  │                                                   │   │
│  │  ┌─────────────────────────────────────────┐   │   │
│  │  │                                           │   │   │
│  │  │     Ready to Analyze                      │   │   │
│  │  │     📍                                    │   │   │
│  │  │     Paste a Google Maps business link    │   │   │
│  │  │     below to generate report              │   │   │
│  │  │                                           │   │   │
│  │  └─────────────────────────────────────────┘   │   │
│  │                                                   │   │
│  │  ┌─────────────────────────────────────────┐   │   │
│  │  │ Paste Google Maps link...    [Analyze]  │   │   │
│  │  └─────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## 3 Simple Steps

### 1️⃣ Get a Google Maps Link
```
Go to: maps.google.com
Search: "Any business name"
Click: On the business
Copy: The URL from your browser
```

Example: `https://www.google.com/maps/place/Starbucks/@40.7589,-73.9851...`

### 2️⃣ Paste & Analyze
```
Paste the link in the input field
Click "Analyze" button
Wait 5-10 seconds
```

### 3️⃣ Get Your Report
```
✅ Business Summary (name, rating, total reviews)
✅ Review Themes (Service, Pricing, Staff, Product, Wait Times)
✅ Sentiment Analysis (positive/negative/mixed)
✅ Key Customer Feedback
✅ Revenue Leak Indicators (SOLO/PRO)
✅ Growth Opportunities (SOLO/PRO)
```

## What You'll See

### FREE Plan Users:
```
┌─────────────────────────────────────┐
│ ⭐⭐⭐⭐⭐ 4.5 stars                  │
│ Business Name                        │
│ 150 reviews                          │
├─────────────────────────────────────┤
│ Review Themes:                       │
│ ✅ Service Quality (65% positive)    │
│    • Fast service                    │
│    • Friendly staff                  │
├─────────────────────────────────────┤
│ 🔒 Upgrade to view more themes       │
├─────────────────────────────────────┤
│ 🔒 Revenue Leak Analysis Locked      │
│    Upgrade to identify critical      │
│    business risks                    │
│    [Upgrade to Solo Plan]            │
└─────────────────────────────────────┘
```

### SOLO/PRO Plan Users:
```
┌─────────────────────────────────────┐
│ ⭐⭐⭐⭐⭐ 4.5 stars                  │
│ Business Name                        │
│ 150 reviews                          │
├─────────────────────────────────────┤
│ Review Themes:                       │
│ ✅ Service Quality (65% positive)    │
│ ✅ Pricing (45% mixed)               │
│ ✅ Staff Behavior (80% positive)     │
│ ✅ Product Quality (70% positive)    │
│ ⚠️  Wait Times (55% negative)        │
├─────────────────────────────────────┤
│ 💰 Revenue Leak Indicators:          │
│ ⚠️  Long wait times                  │
│    Risk: Customer dissatisfaction    │
│    Fix: Add more staff during peak   │
├─────────────────────────────────────┤
│ 🚀 Growth Opportunities:             │
│ 💡 Leverage strong staff service     │
│    Customers praise friendly staff   │
├─────────────────────────────────────┤
│        [Export Full Report]          │
└─────────────────────────────────────┘
```

## Real-World Example

**Scenario**: Analyze a local coffee shop

1. **Copy Link**: `https://maps.google.com/...coffee-shop...`
2. **Paste & Analyze**: Click button
3. **Get Insights**:
   - ⭐ 4.2 stars, 89 reviews
   - ✅ Coffee Quality: 85% positive
   - ⚠️ Service Speed: 60% negative
   - 💰 Revenue Leak: "Slow service during morning rush"
   - 💡 Fix: "Hire 2 more baristas for 7-9am shift"
4. **Export Report**: Send to coffee shop owner
5. **Win Client**: Professional insights = new business!

## Testing the Feature

Since we're using mock data for now, you can test with ANY Google Maps link:

```
Try these:
• https://www.google.com/maps/place/Starbucks
• https://www.google.com/maps/place/McDonalds
• https://goo.gl/maps/abc123
• Any business URL from Google Maps
```

The system will:
- Validate the URL format ✓
- Extract the Place ID ✓
- Generate sample insights ✓
- Show you the full interface ✓

## Next: Connect Real API

To use real Google Maps data:

1. Get Google Places API key from: https://console.cloud.google.com
2. Add to `.env.local`:
   ```
   GOOGLE_PLACES_API_KEY=your_key_here
   ```
3. The system will automatically fetch real reviews!

## Questions?

- 📖 Full docs: `REVIEW_INTELLIGENCE_IMPLEMENTATION.md`
- 📝 User guide: `HOW_TO_USE_REVIEW_INTELLIGENCE.md`
- 💬 Need help? Check the Settings page

---

**Ready to turn reviews into revenue? Start analyzing now! 🚀**
