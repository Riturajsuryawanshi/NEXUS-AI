// Test script for create-order Edge Function
const PROJECT_URL = 'https://kprssovriifzdzcufcmr.supabase.co'; // Replace with your actual project URL
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwcnNzb3ZyaWlmemR6Y3VmY21yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NjA0NDcsImV4cCI6MjA4NjEzNjQ0N30.Rp3EahQ6f5WEsnHlDSAc-GDosu4Llj_hPa1hAfPSnZk'; // Replace with your actual anon key

async function testCreateOrder() {
    try {
        const response = await fetch(`${PROJECT_URL}/functions/v1/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ANON_KEY}`,
                'apikey': ANON_KEY
            },
            body: JSON.stringify({
                type: 'subscription',
                itemId: 'pro'
            })
        });

        const result = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', result);
        
        if (response.ok) {
            console.log('✅ Function is working correctly!');
        } else {
            console.log('❌ Function returned an error');
        }
    } catch (error) {
        console.error('❌ Network error:', error.message);
    }
}

// Uncomment and run: node test-create-order.js
testCreateOrder();

// console.log('Update PROJECT_URL and ANON_KEY, then uncomment testCreateOrder() to run the test');