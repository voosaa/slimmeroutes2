// Simple script to check if environment variables are loaded correctly
require('dotenv').config({ path: '.env.local' });

console.log('Checking environment variables...');
console.log('NEXT_PUBLIC_SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
console.log('NEXT_PUBLIC_MAPBOX_TOKEN exists:', !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN);

// Check URL format
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('NEXT_PUBLIC_SUPABASE_URL is a valid URL');
  } catch (e) {
    console.log('NEXT_PUBLIC_SUPABASE_URL is NOT a valid URL');
  }
}

// Check key format (basic check)
if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  const parts = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.split('.');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY has JWT format:', parts.length === 3);
}
