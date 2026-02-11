// Quick API Test Script
const GEMINI_KEY = 'AIzaSyA2pMYxwNb4y72557N8LxVWMlj2avY_gbo';

// Test Gemini API
fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + GEMINI_KEY, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: 'Say "API works"' }] }]
  })
})
.then(r => r.json())
.then(d => console.log('✅ Gemini API:', d.candidates?.[0]?.content?.parts?.[0]?.text || 'ERROR'))
.catch(e => console.log('❌ Gemini API Error:', e.message));

// Test Supabase
fetch('https://kprssovriifzdzcufcmr.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwcnNzb3ZyaWlmemR6Y3VmY21yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NjA0NDcsImV4cCI6MjA4NjEzNjQ0N30.Rp3EahQ6f5WEsnHlDSAc-GDosu4Llj_hPa1hAfPSnZk'
  }
})
.then(r => r.ok ? console.log('✅ Supabase API: Connected') : console.log('❌ Supabase API: Error'))
.catch(e => console.log('❌ Supabase Error:', e.message));
