// nueva-contrasena.js

const runInitNewPass = () => {
  if (typeof applyTranslations === 'function') applyTranslations();
  initNewPass();
};

if (window.i18nReadyProcessed) {
  runInitNewPass();
} else {
  document.addEventListener('i18nReady', runInitNewPass);
}

document.addEventListener('languageChanged', () => {
  if (typeof applyTranslations === 'function') applyTranslations();
});

function initNewPass() {
  const form = document.getElementById('new-password-form');
  const statusEl = document.getElementById('status-message');
  const btn = document.getElementById('btn-submit');
  
  if (!form) return;

  // 1. Check for token in URL query
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (!token) {
    // Hide form and show warning
    form.style.display = 'none';
    statusEl.innerHTML = `<div style="background:#fee2e2;color:#991b1b;padding:1rem;border-radius:12px;font-size:0.85rem;font-weight:600;border:1px solid #fecaca;text-align:left;"><i class="fa-solid fa-circle-exmark"></i> ${i18next.t('newPassword.errorNoToken')}</div>`;
    return;
  }

  // 2. Toggle password visibility
  const setupToggle = (inputId, iconId) => {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (input && icon) {
      icon.onclick = () => {
        if (input.type === 'password') {
          input.type = 'text';
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        } else {
          input.type = 'password';
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        }
      };
    }
  };

  setupToggle('password', 'toggle-password-1');
  setupToggle('confirm-password', 'toggle-password-2');

  // 3. Form Submission
  form.onsubmit = async function(e) {
    e.preventDefault();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    statusEl.innerHTML = '';

    // Validate matching
    if (password !== confirmPassword) {
      statusEl.innerHTML = `<div style="background:#fee2e2;color:#991b1b;padding:0.75rem 1rem;border-radius:12px;font-size:0.8rem;font-weight:600;border:1px solid #fecaca;text-align:left;"><i class="fa-solid fa-circle-xmark"></i> ${i18next.t('newPassword.errorMismatch')}</div>`;
      return;
    }

    // Validate strength (min 8 chars, 1 uppercase, 1 number)
    const regex = /^(?=.*[A-Z])(?=.*\d).+$/;
    if (password.length < 8 || !regex.test(password)) {
      statusEl.innerHTML = `<div style="background:#fee2e2;color:#991b1b;padding:0.75rem 1rem;border-radius:12px;font-size:0.8rem;font-weight:600;border:1px solid #fecaca;text-align:left;"><i class="fa-solid fa-circle-xmark"></i> ${i18next.t('auth.passwordRequirementsHint')}</div>`;
      return;
    }

    btn.disabled = true;
    const originalBtnText = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${i18next.t('newPassword.updating')}`;

    try {
      const data = await apiFetch('/auth/nueva-contrasena', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });

      statusEl.innerHTML = `<div style="background:#dcfce7;color:#15803d;padding:0.75rem 1rem;border-radius:12px;font-size:0.8rem;font-weight:600;border:1px solid #bbf7d0;text-align:left;"><i class="fa-solid fa-circle-check"></i> ${i18next.t('newPassword.successMsg')}</div>`;
      btn.innerHTML = `<i class="fa-solid fa-check"></i> OK`;
      btn.style.background = '#1a8a4a';

      // Redirect to login after 3 seconds
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 3000);
    } catch (err) {
      statusEl.innerHTML = `<div style="background:#fee2e2;color:#991b1b;padding:0.75rem 1rem;border-radius:12px;font-size:0.8rem;font-weight:600;border:1px solid #fecaca;text-align:left;"><i class="fa-solid fa-circle-xmark"></i> ${err.message || 'Token inválido o expirado'}</div>`;
      btn.disabled = false;
      btn.innerHTML = originalBtnText;
      btn.style.background = '#C84B11';
    }
  };
}
