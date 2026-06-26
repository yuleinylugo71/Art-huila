// recuperar-contrasena.js

const runInitRecover = () => {
  if (typeof applyTranslations === 'function') applyTranslations();
  initRecover();
};

if (window.i18nReadyProcessed) {
  runInitRecover();
} else {
  document.addEventListener('i18nReady', runInitRecover);
}

document.addEventListener('languageChanged', () => {
  if (typeof applyTranslations === 'function') applyTranslations();
});

function initRecover() {
  const form = document.getElementById('recover-form');
  if (!form) return;

  form.onsubmit = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-submit');
    const statusEl = document.getElementById('status-message');
    const email = document.getElementById('email').value;

    btn.disabled = true;
    const originalBtnText = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${i18next.t('recoverPassword.sending')}`;
    statusEl.innerHTML = '';

    try {
      const data = await apiFetch('/auth/recuperar-contrasena', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      statusEl.innerHTML = `<div style="background:#dcfce7;color:#15803d;padding:0.75rem 1rem;border-radius:12px;font-size:0.8rem;font-weight:600;border:1px solid #bbf7d0;text-align:left;"><i class="fa-solid fa-circle-check"></i> ${i18next.t('recoverPassword.successMsg')}</div>`;
      btn.innerHTML = `<i class="fa-solid fa-check"></i> ${i18next.t('common.processing')}`;
      form.reset();
    } catch (err) {
      statusEl.innerHTML = `<div style="background:#fee2e2;color:#991b1b;padding:0.75rem 1rem;border-radius:12px;font-size:0.8rem;font-weight:600;border:1px solid #fecaca;text-align:left;"><i class="fa-solid fa-circle-xmark"></i> ${err.message || 'Error al procesar la solicitud'}</div>`;
      btn.disabled = false;
      btn.innerHTML = originalBtnText;
    }
  };
}
