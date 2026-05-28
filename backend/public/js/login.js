// login.js

const runInitLogin = () => {
  if (typeof applyTranslations === 'function') applyTranslations();
  initLogin();
};

if (window.i18nReadyProcessed) {
  runInitLogin();
} else {
  document.addEventListener('i18nReady', runInitLogin);
}

document.addEventListener('languageChanged', () => {
  if (typeof applyTranslations === 'function') applyTranslations();
});

function initLogin() {
  const form = document.getElementById('login-form');
  if (!form) return;

  // Remove existing event listener if any (by replacing the form cloned node or just setting simple listener)
  // Since we run initLogin only once on i18nReady, we can just attach it safely:
  form.onsubmit = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    const errorEl = document.getElementById('login-error');
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    btn.disabled = true;
    btn.textContent = i18next.t('login.loggingIn');
    errorEl.classList.add('hidden');

    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      Auth.setSession(data);
      showToast(i18next.t('login.toastWelcome'));

      setTimeout(() => {
        const user = data.user;
        if (user && user.role === 'admin') {
          window.location.href = '/dashboard-admin.html';
        } else if (user && user.role === 'artesano') {
          window.location.href = '/dashboard-artesano.html';
        } else {
          window.location.href = '/catalogo.html';
        }
      }, 600);
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
      btn.disabled = false;
      btn.textContent = i18next.t('login.btnText');
    }
  };
}
