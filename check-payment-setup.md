# Payment Gateway Setup Verification

## 1. Supabase Environment Variables Required

In your Supabase Dashboard → Settings → Edge Functions → Environment Variables, ensure these are set:

```
RAZORPAY_KEY_ID=rzp_live_SKh1YVzEINyU1f (or rzp_test_xxx for testing)
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

## 2. Test Payment Flow (Manual)

1. **Start your app**: `npm run dev`
2. **Login to your app** with a test user
3. **Click "Upgrade to Pro"** in the pricing modal
4. **Check browser DevTools Network tab** for:
   - `create-order` request should return 200 with orderId
   - Razorpay checkout modal should open

## 3. Test Cards (Razorpay Test Mode)

**Success**: `4111 1111 1111 1111`, CVV: `123`, Expiry: `12/25`
**Failure**: `4000 0000 0000 0002`, CVV: `123`, Expiry: `12/25`

## 4. Verify Database Updates

After successful payment, check these tables:
- `payment_transactions` - should have status 'success'
- `subscriptions` - should have new active subscription

## 5. Webhook Testing

- Go to Razorpay Dashboard → Webhooks
- Check webhook logs for successful delivery
- Webhook URL should be: `https://nexus-ai.jiobase.com/functions/v1/webhook`

## Current Status: ✅ READY TO TEST

Your payment gateway code is properly implemented. You just need to:
1. Set the Razorpay secrets in Supabase
2. Test with a logged-in user
3. Verify webhook delivery