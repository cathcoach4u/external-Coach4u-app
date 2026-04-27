// Authentication Functions

async function getCurrentUser() {
  const sb = window.getSupabase();
  if (!sb) return null;

  try {
    const { data: { user } } = await sb.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = 'index.html';
    return null;
  }
  return user;
}

async function signInWithMagicLink(email) {
  const sb = window.getSupabase();
  if (!sb) throw new Error('Supabase not initialized');

  const { error } = await sb.auth.signInWithOtp({
    email: email,
    options: {
      emailRedirectTo: window.location.origin + '/dashboard.html'
    }
  });

  if (error) throw error;
}

async function signOut() {
  const sb = window.getSupabase();
  if (!sb) return;

  const { error } = await sb.auth.signOut();
  if (error) {
    console.error('Logout error:', error);
  } else {
    window.location.href = 'index.html';
  }
}

// Make functions available globally
window.getCurrentUser = getCurrentUser;
window.requireAuth = requireAuth;
window.signInWithMagicLink = signInWithMagicLink;
window.signOut = signOut;
