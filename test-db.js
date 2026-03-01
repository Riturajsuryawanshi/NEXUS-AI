
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kprssovriifzdzcufcmr.supabase.co'
const supabaseServiceRoleKey = 'ecc90af8807d369a3ee08fb19d588ddd7f32ccfa8173cd314c07515e31f7c99c'

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function testDb() {
    console.log('Testing DB connection and table structure...')
    const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .limit(1)

    if (error) {
        console.error('DB Error:', error)
        if (error.message.includes('type uuid')) {
            console.log('Confirmed: ID mismatch detected. Table needs fixing.')
        }
    } else {
        console.log('DB Connection successful. Data:', data)
    }
}

testDb()
