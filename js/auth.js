// Auth functions for plain HTML project
// Requires window.supabaseClient from supabase.js

// ─── Handle Magic Link Callback ─────────────────────────────────────────
// When user clicks magic link in email, Supabase redirects back with token
(async function handleMagicLinkCallback() {
  try {
    // Check if URL contains magic link callback (hash with access_token or code parameter)
    const hashParams = new URLSearchParams(window.location.hash.slice(1))
    const queryParams = new URLSearchParams(window.location.search)

    const hasAccessToken = hashParams.has('access_token')
    const hasCode = queryParams.has('code')

    if (hasAccessToken || hasCode) {
      console.log('Magic link detected, processing session...')

      // Exchange token for session
      const { data, error } = await window.supabaseClient.auth.getSession()

      if (error) {
        console.error('Error getting session:', error)
        return
      }

      if (data.session) {
        console.log('Session confirmed, redirecting to dashboard...')
        // Redirect to dashboard
        window.location.href = 'https://cathcoach4u.github.io/external-Coach4u-app/dashboard.html'
      }
    }
  } catch (err) {
    console.error('Error handling magic link callback:', err)
  }
})()

// ─── Sign In Function ──────────────────────────────────────────────────
/**
 * Sign in with magic link
 * @param {string} email - User's email address
 */
window.signIn = async function(email) {
  try {
    const { error } = await window.supabaseClient.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: 'https://cathcoach4u.github.io/external-Coach4u-app/dashboard.html'
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

    window.location.href = 'https://cathcoach4u.github.io/external-Coach4u-app/index.html'
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
      window.location.href = 'https://cathcoach4u.github.io/external-Coach4u-app/index.html'
    }

    return user
  } catch (err) {
    console.error('Error checking auth:', err)
    window.location.href = 'https://cathcoach4u.github.io/external-Coach4u-app/index.html'
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
  // If user is on index.html and has a confirmed session with valid user, redirect to dashboard
  const pathname = window.location.pathname
  const isIndexPage = pathname.endsWith('/index.html') || pathname.endsWith('/external-Coach4u-app/') || pathname === '/'
  const hasConfirmedSession = session && session.user && session.user.id

  if (isIndexPage && hasConfirmedSession) {
    // Wait 500ms for page to render before redirecting
    setTimeout(() => {
      window.location.href = 'https://cathcoach4u.github.io/external-Coach4u-app/dashboard.html'
    }, 500)
  }
})