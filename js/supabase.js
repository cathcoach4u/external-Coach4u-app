// Import Supabase from CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'

// Supabase configuration
const SUPABASE_URL = 'https://uoixetfvboevjxlkfyqy.supabase.co'

// Get anon key from environment variable (set via .env.local or build process)
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''

if (!SUPABASE_ANON_KEY) {
  console.warn('Warning: SUPABASE_ANON_KEY is not set. Please set it in .env.local file.')
}

// Initialize Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/**
 * Get all active user modules/hubs for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} Array of active hubs for the user
 */
export async function getUserModules(userId) {
  const { data, error } = await supabase
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
export async function getOrganisation(userId) {
  const { data, error } = await supabase
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