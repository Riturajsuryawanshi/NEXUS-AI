# Payment Gateway Test Checklist

## Pre-Testing Setup
- [ ] Razorpay account created
- [ ] Test API keys obtained
- [ ] Secrets added to Supabase
- [ ] Edge functions deployed
- [ ] Webhook configured in Razorpay

---

## Test 1: Order Creation
**Goal**: Verify backend can create Razorpay orders

### Steps:
1. Open browser DevTools (F12) → Network tab
2. Click "Upgrade to Pro" in your app
3. Check Network tab for `create-order` request

### Expected Result:
```json
{
  "orderId": "order_xxxxx",
  "amount": 1000,
  "currency": "USD",
  "keyId": "rzp_test_xxxxx"
}
```

### If Failed:
- Check Supabase Edge Function logs
- Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set
- Check browser console for errors

---

## Test 2: Razorpay Checkout
**Goal**: Verify Razorpay modal opens

### Steps:
1. Click "Upgrade to Pro"
2. Razorpay checkout modal should appear

### Expected Result:
- Modal shows "Nexus Analyst"
- Amount displays correctly ($10.00)
- Test card form visible

### If Failed:
- Check if `https://checkout.razorpay.com/v1/checkout.js` loaded
- Verify `window.Razorpay` exists in console
- Check `index.html` has Razorpay script tag

---

## Test 3: Successful Payment
**Goal**: Complete payment and verify subscription activation

### Steps:
1. Open Razorpay checkout
2. Use test card: `4111 1111 1111 1111`
3. CVV: `123`, Expiry: `12/25`
4. Click "Pay"

### Expected Result:
- Success message appears
- Page reloads
- User plan shows "Pro" in UI
- Database `subscriptions` table has new entry with `status='active'`

### Verify in Database:
```sql
-- Check subscription
SELECT * FROM subscriptions 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY started_at DESC LIMIT 1;

-- Check transaction
SELECT * FROM payment_transactions 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC LIMIT 1;
```

### If Failed:
- Check webhook logs in Razorpay Dashboard
- Verify webhook URL is correct
- Check Supabase Edge Function logs for `webhook`
- Verify `RAZORPAY_WEBHOOK_SECRET` matches

---

## Test 4: Failed Payment
**Goal**: Verify failed payment handling

### Steps:
1. Open Razorpay checkout
2. Use test card: `4000 0000 0000 0002`
3. CVV: `123`, Expiry: `12/25`
4. Click "Pay"

### Expected Result:
- Error message appears
- No subscription created
- Transaction status = 'failed' in database

---

## Test 5: Plan Limits
**Goal**: Verify plan restrictions work

### Free Plan Test:
1. Create 3 reports (should work)
2. Try 4th report (should be blocked)

### Pro Plan Test:
1. Upgrade to Pro
2. Create 50 reports (should work)
3. Try 51st report (should be blocked)

### Agency Plan Test:
1. Upgrade to Agency
2. Create unlimited reports (should work)

---

## Test 6: Webhook Verification
**Goal**: Ensure webhook signature is validated

### Steps:
1. Go to Razorpay Dashboard → Webhooks
2. Find your webhook
3. Click "View Logs"
4. Check recent payment events

### Expected Result:
- `payment.captured` event shows "200 OK"
- No signature errors

### If Failed:
- Regenerate webhook secret
- Update `RAZORPAY_WEBHOOK_SECRET` in Supabase
- Redeploy webhook function

---

## Test 7: Subscription Expiry
**Goal**: Verify subscriptions expire correctly

### Manual Test:
```sql
-- Set subscription to expire in past
UPDATE subscriptions 
SET expires_at = NOW() - INTERVAL '1 day'
WHERE user_id = 'YOUR_USER_ID';
```

### Expected Result:
- User reverts to Free plan
- Report limits enforced

---

## Production Checklist

Before going live:

- [ ] Switch to Live API keys in Razorpay
- [ ] Update Supabase secrets with live keys
- [ ] Update webhook to use live credentials
- [ ] Test with real card (small amount)
- [ ] Verify webhook works in production
- [ ] Set up monitoring/alerts
- [ ] Test refund flow (if applicable)
- [ ] Document customer support process

---

## Common Issues & Solutions

### Issue: "Failed to initiate payment"
**Solution**: Check Edge Function logs, verify API keys

### Issue: Payment succeeds but subscription not activated
**Solution**: Check webhook logs, verify webhook secret

### Issue: Razorpay modal doesn't open
**Solution**: Check if script loaded, verify keyId returned from backend

### Issue: "Unauthorized" error
**Solution**: User not logged in, check authentication

---

## Monitoring

### Key Metrics to Track:
- Payment success rate
- Webhook delivery rate
- Average payment time
- Failed payment reasons
- Subscription churn rate

### Logs to Monitor:
- Supabase Edge Function logs
- Razorpay webhook logs
- Browser console errors
- Database transaction logs

---

## Support Resources

- **Razorpay Test Cards**: https://razorpay.com/docs/payments/payments/test-card-details/
- **Webhook Events**: https://razorpay.com/docs/webhooks/
- **Supabase Logs**: Dashboard → Edge Functions → Logs

---

## Quick Debug Commands

```bash
# View Edge Function logs
npx supabase functions logs create-order
npx supabase functions logs webhook

# Check secrets
npx supabase secrets list

# Test webhook locally
curl -X POST http://localhost:54321/functions/v1/webhook \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.captured","payload":{"payment":{"entity":{"order_id":"test_order"}}}}'
```

---

## Success Criteria

✅ Payment gateway is working when:
1. Orders create successfully
2. Razorpay checkout opens
3. Test payments complete
4. Subscriptions activate automatically
5. Webhooks process correctly
6. Plan limits enforce properly
7. Failed payments handled gracefully

---

**Ready to test?** Start with Test 1 and work through each step! 🚀
