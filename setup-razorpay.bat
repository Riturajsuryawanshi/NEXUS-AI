@echo off
echo Setting up Razorpay Payment Gateway...
echo.

REM Update .env.local with live Razorpay key
echo Updating .env.local with Razorpay Live Key...
powershell -Command "(Get-Content '.env.local') -replace '<RAZORPAY_LIVE_KEY_ID>', 'rzp_live_SKh1YVzEINyU1f' | Set-Content '.env.local'"

REM Update supabase .env with credentials
echo Updating Supabase Edge Function environment...
powershell -Command "(Get-Content 'supabase\.env') -replace '<RAZORPAY_LIVE_KEY_ID>', 'rzp_live_SKh1YVzEINyU1f' | Set-Content 'supabase\.env'"
powershell -Command "(Get-Content 'supabase\.env') -replace '<RAZORPAY_LIVE_KEY_SECRET>', '6Ziihz8YdfZuJEedvH9JStQq' | Set-Content 'supabase\.env'"

echo.
echo ✅ Razorpay credentials configured!
echo.
echo Next steps:
echo 1. Deploy the Edge Function: supabase functions deploy create-order
echo 2. Set environment variables in Supabase dashboard
echo 3. Test payment flow
echo.
echo ⚠️  SECURITY WARNING: 
echo - These are LIVE credentials - handle with care
echo - Never commit .env files to version control
echo - Consider rotating these keys after setup
echo.
pause