// Supabase Configuration

const SUPABASE_URL = 'https://eekefsuaefgpqmjdyniy.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_pcXHwQVMpvEojb4K3afEMw_RMvgZM-Y';

let supabase;

function initSupabase() {
  if (typeof window.supabase === 'undefined') {
    console.error('Supabase library not loaded');
    return null;
  }

  if (!supabase) {
    try {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (error) {
      console.error('Error creating Supabase client:', error);
      return null;
    }
  }
  return supabase;
}

window.getSupabase = function() {
  return initSupabase();
};

console.log('supabase.js loaded, window.getSupabase assigned');
