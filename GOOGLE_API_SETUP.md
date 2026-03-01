# Google Places API Setup Guide

To get the Review Intelligence feature working, you need a Google Maps API Key with the **Places API** enabled.

### 1. Enable the Correct API

Go to the Google Cloud Console Library:
[https://console.cloud.google.com/apis/library](https://console.cloud.google.com/apis/library)

Search for **"Places API"**.

> **Important:** You might see "Places API (New)" and just "Places API".
> Please select **"Places API"** (the one with the icon that looks like a map pin).
>
> *If you only see "Places API (New)", enable that, but try to find the standard "Places API" if available. The feature uses the standard `maps.googleapis.com` endpoints.*

Click **Enable**.

### 2. Create Credentials (API Key)

1.  Go to the **Credentials** page in your Google Cloud Project:
    [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
2.  Click **Create Credentials** -> **API key**.
3.  Copy the generated key (it starts with `AIza...`).

> **⚠️ CRITICAL:** Do **NOT** set "HTTP referers (web sites)" restrictions on this API key. 
> The Places Web Service API (which the backend uses) does not support referer restrictions. 
> If you must restrict it, choose **IP addresses** or leave it unrestricted.

### 3. Set the Key in Supabase

Run this command in your terminal (replace `YOUR_KEY_HERE` with the key you just copied):

```bash
npx supabase secrets set GOOGLE_PLACES_API_KEY=YOUR_KEY_HERE --project-ref kprssovriifzdzcufcmr
```

### 4. Verification

Once the command finishes, restart your app or just refresh the browser page. The Review Intelligence feature should now fetch real reviews!
