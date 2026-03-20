# Payment Gateway Setup Guide (Razorpay)

## Overview
Your application uses **Razorpay** as the payment gateway. The integration is complete, you just need to configure the credentials.

---

## Step 1: Get Razorpay Credentials

1. **Sign up/Login** to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings** → **API Keys**
3. Generate/Copy:
   - **Key ID** (starts with `rzp_test_` or `rzp_live_`)
   - **Key Secret**

---

## Step 2: Configure Environment Variables

### Local Development (.env.local)
Add these to your `.env.local` file:

```env
# Existing Supabase vars
VITE_SUPABASE_URL=https://kprssovriifzdzcufcmr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Add Razorpay credentials (for frontend - optional, already loaded from backend)
VITE_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
```

### Supabase Edge Functions
Set these secrets in Supabase:

```bash
# Navigate to your project
cd supabase

# Set Razorpay secrets
npx supabase secrets set RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID
npx supabase secrets set RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET
npx supabase secrets set RAZORPAY_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
```

**Or via Supabase Dashboard:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Edge Functions** → **Secrets**
4. Add:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET`

---

## Step 3: Deploy Edge Functions

Deploy the payment functions to Supabase:

```bash
# Deploy create-order function
npx supabase functions deploy create-order

# Deploy webhook function
npx supabase functions deploy webhook
```

---

## Step 4: Configure Razorpay Webhook

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/) → **Settings** → **Webhooks**
2. Click **Create New Webhook**
3. Set **Webhook URL**:
   ```
   https://kprssovriifzdzcufcmr.supabase.co/functions/v1/webhook
   ```
4. Select Events:
   - ✅ `payment.captured`
   - ✅ `payment.failed`
5. Set **Secret** (generate a random string)
6. Save and copy the **Webhook Secret**
7. Add this secret to Supabase (Step 2)

---

## Step 5: Test Payment Flow

### Test Mode (Recommended First)
1. Use test credentials from Razorpay
2. Test card numbers:
   - **Success**: `4111 1111 1111 1111`
   - **Failure**: `4000 0000 0000 0002`
   - CVV: Any 3 digits
   - Expiry: Any future date

### Test Flow:
1. Open your app
2. Click **Upgrade** on any paid plan
3. Razorpay checkout should open
4. Use test card
5. Verify:
   - Payment success message
   - Subscription activated in database
   - User plan updated

---

## Step 6: Go Live

When ready for production:

1. **Switch to Live Mode** in Razorpay Dashboard
2. Get **Live API Keys** (starts with `rzp_live_`)
3. Update secrets in Supabase with live keys
4. Update webhook URL to use live credentials
5. Test with real card (small amount)

---

## Database Schema

Your payment system uses these tables (already created):

```sql
-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    plan_type TEXT NOT NULL,
    status TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Payment Transactions
CREATE TABLE payment_transactions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL,
    payment_type TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report Credits
CREATE TABLE report_credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    credits_available INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Pricing Plans

Current plans configured in your app:

| Plan | Price | Original | Discount | Features |
|------|-------|----------|----------|----------|
| **Free** | $0 | - | - | 3 reports/month, Basic analysis |
| **Pro** | $10 | $20 | 50% | 50 reports/month, PDF export |
| **Agency** | $50 | $100 | 50% | Unlimited reports, White-label |

---

## Troubleshooting

### Payment not processing
- Check browser console for errors
- Verify Razorpay script loaded: `window.Razorpay`
- Check Edge Function logs in Supabase

### Webhook not working
- Verify webhook URL is correct
- Check webhook secret matches
- View webhook logs in Razorpay Dashboard

### Subscription not activating
- Check `payment_transactions` table for status
- Verify webhook received in Supabase logs
- Check `subscriptions` table for new entry

---

## Security Notes

✅ **Already Implemented:**
- Payment processing on backend (Edge Functions)
- Webhook signature verification
- User authentication required
- Secure credential storage (Supabase Secrets)

⚠️ **Never:**
- Expose `RAZORPAY_KEY_SECRET` in frontend
- Store credentials in git
- Skip webhook signature verification

---

## Support

- **Razorpay Docs**: https://razorpay.com/docs/
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions
- **Test Cards**: https://razorpay.com/docs/payments/payments/test-card-details/

---

## Quick Start Commands

```bash
# 1. Set secrets
npx supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxx
npx supabase secrets set RAZORPAY_KEY_SECRET=xxx
npx supabase secrets set RAZORPAY_WEBHOOK_SECRET=xxx

# 2. Deploy functions
npx supabase functions deploy create-order
npx supabase functions deploy webhook

# 3. Start local dev
npm run dev
```

Your payment gateway is ready! Just add the credentials and test. 🚀
