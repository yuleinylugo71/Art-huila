// registro.js
let selectedType = null;

function selectType(type) {
  selectedType = type;
  document.querySelectorAll('.type-card').forEach(c => {
    c.style.border = '2px solid var(--color-border)';
    c.style.transform = 'none';
  });
  const card = document.getElementById(`type-${type}`);
  card.style.border = '2px solid var(--color-primary)';
  card.style.transform = 'scale(1.02)';

  document.getElementById('form-comprador').classList.add('hidden');
  document.getElementById('form-artesano').classList.add('hidden');
  document.getElementById(`form-${type}`).classList.remove('hidden');
}

// Load categories and regions for artisan form
(async function loadSelects() {
  try {
    const [cats, regs] = await Promise.all([
      apiFetch('/categories'),
      apiFetch('/regions'),
    ]);
    const catSel = document.getElementById('a-categoria');
    const regSel = document.getElementById('a-region');
    catSel.innerHTML = '<option value="">Selecciona una categoría</option>' +
      cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    regSel.innerHTML = '<option value="">Selecciona tu municipio</option>' +
      regs.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
  } catch (e) {
    console.error('Error loading selects', e);
  }
})();

// Buyer registration
document.getElementById('form-comprador').addEventListener('submit', async function(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-comprador');
  btn.disabled = true; btn.textContent = 'Registrando...';
  try {
    await apiFetch('/auth/register/comprador', {
      method: 'POST',
      body: JSON.stringify({
        full_name: document.getElementById('c-name').value,
        email: document.getElementById('c-email').value,
        password: document.getElementById('c-pass').value,
        role: 'comprador',
      }),
    });
    window.location.href = '/verificar-email.html';
  } catch (err) {
    const el = document.getElementById('error-msg');
    el.textContent = err.message; el.classList.remove('hidden');
    btn.disabled = false; btn.textContent = 'Crear cuenta de comprador';
  }
});

// Artisan registration
document.getElementById('form-artesano').addEventListener('submit', async function(e) {
  e.preventDefault();
  if (!document.getElementById('a-declaracion').checked) {
    const el = document.getElementById('error-msg');
    el.textContent = 'Debes aceptar la declaración de veracidad'; el.classList.remove('hidden');
    return;
  }
  const btn = document.getElementById('btn-artesano');
  btn.disabled = true; btn.textContent = 'Registrando...';
  try {
    await apiFetch('/auth/register/artesano', {
      method: 'POST',
      body: JSON.stringify({
        full_name: document.getElementById('a-name').value,
        email: document.getElementById('a-email').value,
        password: document.getElementById('a-pass').value,
        role: 'artesano',
        id_number: document.getElementById('a-cedula').value,
        cultural_history: document.getElementById('a-historia').value,
        category_id: document.getElementById('a-categoria').value,
        region_id: document.getElementById('a-region').value,
      }),
    });
    window.location.href = '/verificar-email.html';
  } catch (err) {
    const el = document.getElementById('error-msg');
    el.textContent = err.message; el.classList.remove('hidden');
    btn.disabled = false; btn.textContent = 'Registrarme como artesano';
  }
});
