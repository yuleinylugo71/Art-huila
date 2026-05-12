// login.js
document.getElementById('login-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const btn = document.getElementById('submit-btn');
  const errorEl = document.getElementById('login-error');
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  btn.disabled = true;
  btn.textContent = 'Entrando...';
  errorEl.classList.add('hidden');

  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    Auth.setSession(data);
    showToast('¡Bienvenido/a de nuevo!');

    // Redirect based on role
    const role = data.user.role;
    setTimeout(() => {
      if (role === 'admin') window.location.href = '/dashboard-admin.html';
      else if (role === 'artesano') window.location.href = '/dashboard-artesano.html';
      else window.location.href = '/index.html';
    }, 600);
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'Iniciar sesión';
  }
});
