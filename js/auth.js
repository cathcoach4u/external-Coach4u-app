function getSiteRoot() {
  const scripts = document.getElementsByTagName('script');
  for (const s of scripts) {
    if (s.src && s.src.includes('/js/auth.js')) {
      return s.src.replace('/js/auth.js', '');
    }
  }
  const p = window.location.pathname;
  const match = p.match(/^(.*\/Coach4uapp-strategy)/i);
  return window.location.origin + (match ? match[1] : '');
}

window.signIn = async function (email, password) {
  const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
  if (error) return { error };

  const { data: { user } } = await window.supabaseClient.auth.getUser();
  const { data: profile } = await window.supabaseClient
    .from('users')
    .select('membership_status')
    .eq('id', user.id)
    .single();

  if (profile?.membership_status !== 'active') {
    await window.supabaseClient.auth.signOut();
    return { error: { message: 'Your account is not active. Please contact support.' } };
  }

  window.location.href = getSiteRoot() + '/business/';
  return {};
}

window.signOut = async function () {
  await window.supabaseClient.auth.signOut();
  window.location.href = getSiteRoot() + '/login.html';
}

window.requireAuth = async function () {
  const { data: { user } } = await window.supabaseClient.auth.getUser();
  if (!user) {
    window.location.href = getSiteRoot() + '/login.html';
    return null;
  }

  const { data: profile } = await window.supabaseClient
    .from('users')
    .select('membership_status')
    .eq('id', user.id)
    .single();

  if (profile?.membership_status !== 'active') {
    window.location.href = getSiteRoot() + '/inactive.html';
    return null;
  }

  document.body.style.opacity = '1';
  return user;
}

window.getUser = async function () {
  const { data: { user } } = await window.supabaseClient.auth.getUser();
  return user || null;
}
