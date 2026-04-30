const SUPABASE_URL     = 'https://eekefsuaefgpqmjdyniy.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_pcXHwQVMpvEojb4K3afEMw_RMvgZM-Y'

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

window.getUserModules = async function (userId) {
  const { data, error } = await window.supabaseClient
    .from('user_modules')
    .select('*')
    .eq('user_id', userId)
    .eq('active', true)
  if (error) { console.error('Error fetching user modules:', error); return [] }
  return data || []
}

window.getOrganisation = async function (userId) {
  const { data, error } = await window.supabaseClient
    .from('organisations')
    .select('*')
    .eq('user_id', userId)
    .single()
  if (error) { console.error('Error fetching organisation:', error); return null }
  return data
}
