const MAIT = {
  toast(text) {
    const n = document.getElementById('toast');
    if (!n) { window.alert(text); return; }
    n.textContent = text; n.classList.add('show');
    clearTimeout(MAIT._timer);
    MAIT._timer = setTimeout(() => n.classList.remove('show'), 3000);
  },
  nav() {
    document.querySelectorAll('[data-user-name]').forEach(el => {
      if (!el.textContent.trim()) el.textContent = 'Student';
    });
    document.querySelectorAll('[data-logout]').forEach(el => {
      el.addEventListener('click', (event) => { event.preventDefault(); location.href = '/logout'; });
    });
  }
};
document.addEventListener('DOMContentLoaded', MAIT.nav);
