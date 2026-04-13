// Auth functions for plain HTML project
// Requires window.supabaseClient from supabase.js

/**
 * Sign in with magic link
 * @param {string} email - User's email address
 */
window.signIn = async function(email) {
  try {
    const { error } = await window.supabaseClient.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: window.location.origin + '/dashboard.html'
      }
    })

    if (error) {
      alert('Error signing in: ' + error.message)
      return
    }

    alert('Check your email for the magic link to sign in!')
  } catch (err) {
    console.error('Sign in error:', err)
    alert('An error occurred during sign in')
  }
}

/**
 * Sign out of Supabase and redirect to home page
 */
window.signOut = async function() {
  try {
    const { error } = await window.supabaseClient.auth.signOut()

    if (error) {
      console.error('Error signing out:', error)
      return
    }

    window.location.href = '/index.html'
  } catch (err) {
    console.error('Sign out error:', err)
  }
}

/**
 * Get the current authenticated user
 * @returns {Promise<Object|null>} Current user object or null if not authenticated
 */
window.getUser = async function() {
  try {
    const { data: { user } } = await window.supabaseClient.auth.getUser()
    return user || null
  } catch (err) {
    console.error('Error getting user:', err)
    return null
  }
}

/**
 * Require authentication - redirects to home if not authenticated
 * Call this at the top of protected pages
 */
window.requireAuth = async function() {
  try {
    const { data: { user } } = await window.supabaseClient.auth.getUser()

    if (!user) {
      window.location.href = '/index.html'
    }

    return user
  } catch (err) {
    console.error('Error checking auth:', err)
    window.location.href = '/index.html'
  }
}

/**
 * Get current user's profile from the profiles table
 * @returns {Promise<Object|null>} User's profile object or null
 */
window.getUserProfile = async function() {
  try {
    const user = await window.getUser()

    if (!user) {
      return null
    }

    const { data, error } = await window.supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data
  } catch (err) {
    console.error('Error getting user profile:', err)
    return null
  }
}

// Listen for auth state changes on page load
window.supabaseClient.auth.onAuthStateChange((event, session) => {
  // If user is on index.html and has a valid session, redirect to dashboard
  if (session && window.location.pathname === '/index.html') {
    window.location.href = '/dashboard.html'
  }
})