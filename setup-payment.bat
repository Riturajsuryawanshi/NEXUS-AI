@echo off
echo Setting up Razorpay payment gateway...
echo.

echo Please enter your Razorpay credentials:
set /p KEY_ID="Razorpay Key ID (rzp_test_xxx): "
set /p KEY_SECRET="Razorpay Key Secret: "
set /p WEBHOOK_SECRET="Webhook Secret (generate random string): "

echo.
echo Setting Supabase secrets...
cd supabase
npx supabase secrets set RAZORPAY_KEY_ID=%KEY_ID%
npx supabase secrets set RAZORPAY_KEY_SECRET=%KEY_SECRET%
npx supabase secrets set RAZORPAY_WEBHOOK_SECRET=%WEBHOOK_SECRET%

echo.
echo Deploying Edge Functions...
npx supabase functions deploy create-order
npx supabase functions deploy webhook

echo.
echo ✅ Payment gateway setup complete!
echo.
echo Next steps:
echo 1. Configure webhook URL in Razorpay Dashboard:
echo    https://kprssovriifzdzcufcmr.supabase.co/functions/v1/webhook
echo 2. Test payment flow in your app
echo.
pause