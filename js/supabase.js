// Supabase configuration
const SUPABASE_URL = 'https://uoixetfvboevjxlkfyqy.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvaXhldGZ2Ym9ldmp4bGtmeXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NDY2ODAsImV4cCI6MjA5MDQyMjY4MH0.ZXYJVdvcj70aGMH1FAixIr0hNCaCDSYLEL93hHVCGDU'

// Initialize Supabase client (window.supabase is provided by the CDN script)
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * Get all active user modules/hubs for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} Array of active hubs for the user
 */
window.getUserModules = async function(userId) {
  const { data, error } = await window.supabaseClient
    .from('user_modules')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)

  if (error) {
    console.error('Error fetching user modules:', error)
    return []
  }

  return data || []
}

/**
 * Get user's organisation
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} User's organisation object
 */
window.getOrganisation = async function(userId) {
  const { data, error } = await window.supabaseClient
    .from('organisations')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching organisation:', error)
    return null
  }

  return data
}