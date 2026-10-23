document.addEventListener('DOMContentLoaded', () => {
  const host = document.getElementById('googleSignInButton');
  const status = document.getElementById('googleStatus');
  const clientId = window.MAIT_GOOGLE_CLIENT_ID || '';
  if (!clientId) { if (status) status.textContent = 'Google sign-in is optional. Add GOOGLE_CLIENT_ID to api_keys.txt to enable it.'; return; }
  const boot = () => {
    if (!window.google?.accounts?.id || !host) return false;
    window.google.accounts.id.initialize({ client_id: clientId, callback: async ({ credential }) => {
      if (status) status.textContent = 'Verifying Google account…';
      try {
        const response = await fetch('/google-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential }) });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.message || 'Google sign-in failed.');
        location.href = data.redirect || '/dashboard.html';
      } catch (error) { if (status) status.textContent = error.message || 'Google sign-in failed. Please try again.'; }
    }});
    window.google.accounts.id.renderButton(host, { theme: 'filled_black', size: 'large', shape: 'pill', text: 'continue_with', width: 280 });
    if (status) status.textContent = 'Sign in with Google or use your email and password below.';
    return true;
  };
  let tries = 0; const timer = setInterval(() => { if (boot() || ++tries > 30) clearInterval(timer); }, 200);
});
