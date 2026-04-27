// Supabase Configuration
// Update these with your Supabase project credentials

const SUPABASE_URL = 'https://eekefsuaefgpqmjdyniy.supabase.co'; // Update when Supabase is ready
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Update when Supabase is ready

let supabase;

// Initialize Supabase client
function initSupabase() {
  if (typeof window.supabase === 'undefined') {
    console.error('Supabase library not loaded');
    return null;
  }

  if (!supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

// Make Supabase available globally
window.getSupabase = () => initSupabase();
