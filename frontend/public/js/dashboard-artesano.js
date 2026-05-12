// dashboard-artesano.js
if (!Auth.requireRole('artesano')) throw new Error('Not artisan');

const user = Auth.getUser();
let selectedFiles = [];
let artisanProfile = null;

document.getElementById('welcome-msg').textContent = `Hola, ${user.full_name}`;

function showSection(name) {
  ['mis-productos', 'nuevo-producto', 'mi-perfil', 'mis-ventas'].forEach(s => {
    document.getElementById(`section-${s}`).classList.add('hidden');
  });
  document.getElementById(`section-${name}`).classList.remove('hidden');
  if (name === 'mi-perfil') loadProfile();
  if (name === 'mis-productos') loadMyProducts();
  if (name === 'mis-ventas') loadMySales();
}

async function loadMySales() {
  const list = document.getElementById('sales-list');
  list.innerHTML = '<tr><td colspan="6" style="text-align:center;"><div class="spinner"></div></td></tr>';
  try {
    const sales = await apiFetch('/orders/artisan/sales');
    if (sales.length === 0) {
      list.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--color-muted);padding:2rem;">No tienes ventas aún.</td></tr>';
      return;
    }
    list.innerHTML = sales.map(s => `
      <tr>
        <td style="font-size:0.85rem;">${new Date(s.order.created_at).toLocaleDateString()}</td>
        <td>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <img src="${s.product.images[0]?.url || ''}" style="width:30px;height:30px;object-fit:cover;border-radius:4px;"/>
            <span style="font-weight:500;">${s.product.name}</span>
          </div>
        </td>
        <td style="font-size:0.85rem;">${s.order.user.full_name}</td>
        <td style="text-align:center;">${s.quantity}</td>
        <td style="font-weight:600;color:var(--color-primary);">${formatPrice(s.subtotal)}</td>
        <td><span class="badge ${s.order.status === 'paid' ? 'badge-verified' : 'badge-pending'}">${s.order.status}</span></td>
      </tr>
    `).join('');
  } catch (e) {
    list.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--color-danger);">${e.message}</td></tr>`;
  }
}

// Load categories and regions
(async function initSelects() {
  try {
    const [cats, regs] = await Promise.all([apiFetch('/categories'), apiFetch('/regions')]);
    const catSel = document.getElementById('p-category');
    const regSel = document.getElementById('p-region');
    catSel.innerHTML = '<option value="">Selecciona categoría</option>' + cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    regSel.innerHTML = '<option value="">Selecciona región</option>' + regs.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
  } catch (e) { console.error(e); }
})();

// Load profile and check verified status
(async function initProfile() {
  try {
    artisanProfile = await apiFetch('/artisans/me');
    if (artisanProfile?.verification_status !== 'verified') {
      document.getElementById('not-verified-alert').classList.remove('hidden');
    }
    document.getElementById('status-msg').textContent = `Estado: ${artisanProfile?.verification_status || 'desconocido'}`;
  } catch (e) { console.error(e); }
})();

async function loadMyProducts() {
  const grid = document.getElementById('my-products-grid');
  grid.innerHTML = '<div class="spinner"></div>';
  try {
    const products = await apiFetch('/products/artisan/mis-productos');
    if (!products || products.length === 0) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><div class="emoji">📦</div><h3>Sin productos aún</h3><p>Publica tu primer producto.</p></div>';
      return;
    }
    grid.innerHTML = products.map(p => `
      <div class="card product-card">
        ${p.images && p.images[0] ? `<img class="product-img" src="${p.images[0].url}" alt="${p.name}" loading="lazy"/>` : '<div class="product-img-placeholder">🏺</div>'}
        <div class="card-body">
          <div class="product-name">${p.name}</div>
          <div class="product-price">${formatPrice(p.price)}</div>
          <div class="product-meta">
            <span>Stock: ${p.stock}</span>
            <span class="badge badge-verified">✅ Publicado</span>
          </div>
          <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
            <a href="producto.html?slug=${p.slug}" class="btn btn-ghost btn-sm">Ver</a>
            <button onclick="editProduct('${p.slug}')" class="btn btn-outline btn-sm">Editar</button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="emoji">⚠️</div><h3>${e.message}</h3></div>`;
  }
}

async function loadProfile() {
  try {
    const p = await apiFetch('/artisans/me');
    document.getElementById('profile-history').value = p.cultural_history || '';
    if (p.avatar_url) {
      document.getElementById('avatar-preview').innerHTML = `<img src="${p.avatar_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;"/>`;
    }
    if (p.gallery && p.gallery.length > 0) {
      document.getElementById('gallery-previews').innerHTML = p.gallery.map(img => `<img src="${img.url}" style="width:100px;height:100px;object-fit:cover;border-radius:8px;"/>`).join('');
    }
  } catch (e) { showToast(e.message, 'error'); }
}

window.enableProfileEdit = function() {
  document.getElementById('profile-history').disabled = false;
  document.getElementById('avatar-edit-controls').classList.remove('hidden');
  document.getElementById('gallery-edit-controls').classList.remove('hidden');
  document.getElementById('profile-save-controls').classList.remove('hidden');
  document.getElementById('btn-edit-profile').classList.add('hidden');
};

window.disableProfileEdit = function() {
  document.getElementById('profile-history').disabled = true;
  document.getElementById('avatar-edit-controls').classList.add('hidden');
  document.getElementById('gallery-edit-controls').classList.add('hidden');
  document.getElementById('profile-save-controls').classList.add('hidden');
  document.getElementById('btn-edit-profile').classList.remove('hidden');
};

window.saveProfile = async function() {
  const btn = document.querySelector('#profile-save-controls .btn-primary');
  btn.disabled = true; btn.textContent = 'Guardando...';
  try {
    const cultural_history = document.getElementById('profile-history').value;
    await apiFetch('/artisans/me', {
      method: 'POST',
      body: JSON.stringify({ cultural_history })
    });
    showToast('✅ Perfil actualizado exitosamente');
    disableProfileEdit();
  } catch (e) { showToast(e.message, 'error'); }
  btn.disabled = false; btn.textContent = '✅ Guardar perfil';
};

window.uploadAvatar = async function() {
  const fileInput = document.getElementById('avatar-input');
  if (!fileInput.files.length) return showToast('Selecciona una imagen primero', 'warning');
  try {
    showToast('Subiendo foto...', 'info');
    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    const res = await fetch('http://localhost:3000/api/v1/artisans/me/avatar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${Auth.getToken()}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al subir foto');
    document.getElementById('avatar-preview').innerHTML = `<img src="${data.avatar_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;"/>`;
    showToast('✅ Foto de perfil actualizada');
  } catch(e) { showToast(e.message, 'error'); }
};

window.uploadGallery = async function() {
  const fileInput = document.getElementById('gallery-input');
  if (!fileInput.files.length) return showToast('Selecciona al menos una imagen', 'warning');
  try {
    showToast('Subiendo galería...', 'info');
    const formData = new FormData();
    for (let f of fileInput.files) formData.append('images', f);
    const res = await fetch('http://localhost:3000/api/v1/artisans/me/gallery', {
      method: 'POST',
      headers: { Authorization: `Bearer ${Auth.getToken()}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error al subir galería');
    showToast('✅ Galería actualizada');
    loadProfile();
  } catch(e) { showToast(e.message, 'error'); }
};

function badgeStatus(s) {
  const map = { pending: 'badge-pending', verified: 'badge-verified', rejected: 'badge-rejected', suspended: 'badge-suspended' };
  const labels = { pending: '⏳ Pendiente', verified: '✅ Verificado', rejected: '❌ Rechazado', suspended: '⛔ Suspendido' };
  return `<span class="badge ${map[s] || ''}">${labels[s] || s || '—'}</span>`;
}

// Image handling
function handleFiles(files) {
  for (const file of files) {
    if (selectedFiles.length >= 10) break;
    selectedFiles.push(file);
  }
  renderPreviews();
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById('img-uploader').classList.remove('dragover');
  handleFiles(e.dataTransfer.files);
}

function renderPreviews() {
  const container = document.getElementById('img-previews');
  container.innerHTML = selectedFiles.map((f, i) => `
    <div class="image-preview-item">
      <img src="${URL.createObjectURL(f)}" alt="preview"/>
      <button class="remove-img" onclick="removeImg(${i})">×</button>
    </div>
  `).join('');
}

function removeImg(index) {
  selectedFiles.splice(index, 1);
  renderPreviews();
}

function previewProduct() {
  const box = document.getElementById('preview-box');
  const name = document.getElementById('p-name').value || 'Sin nombre';
  const price = document.getElementById('p-price').value || 0;
  const origin = document.getElementById('p-origin').value || 'No especificado';
  const technique = document.getElementById('p-technique').value || 'No especificado';
  const significance = document.getElementById('p-significance').value || 'No especificado';
  box.classList.remove('hidden');
  box.innerHTML = `
    <h3 style="font-family:'Crimson Pro',serif;font-size:1.3rem;margin-bottom:0.5rem;">Vista previa: ${name}</h3>
    <div style="font-size:1.4rem;font-weight:700;color:var(--color-primary);margin-bottom:0.75rem;">${formatPrice(parseFloat(price))}</div>
    <div style="font-size:0.85rem;margin-bottom:0.3rem;"><strong>Origen:</strong> ${origin}</div>
    <div style="font-size:0.85rem;margin-bottom:0.3rem;"><strong>Técnica:</strong> ${technique}</div>
    <div style="font-size:0.85rem;"><strong>Significado:</strong> ${significance}</div>
    ${selectedFiles.length > 0 ? `<div style="margin-top:0.75rem;font-size:0.8rem;color:var(--color-muted);">${selectedFiles.length} imagen(es) seleccionada(s)</div>` : ''}
  `;
  box.scrollIntoView({ behavior: 'smooth' });
}

let editingProductId = null;

// Submit product
document.getElementById('product-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  if (artisanProfile?.verification_status !== 'verified') {
    showToast('Solo artesanos verificados pueden publicar productos', 'error'); return;
  }
  
  if (!editingProductId && selectedFiles.length === 0) {
    showToast('Debes subir al menos 1 imagen obligatoria', 'error'); return;
  }

  const btn = document.getElementById('btn-publish');
  btn.disabled = true; btn.textContent = editingProductId ? 'Guardando...' : 'Publicando...';
  
  try {
    const payload = {
      name: document.getElementById('p-name').value,
      price: parseFloat(document.getElementById('p-price').value),
      stock: parseInt(document.getElementById('p-stock').value),
      category_id: document.getElementById('p-category').value,
      region_id: document.getElementById('p-region').value,
      cultural_origin: document.getElementById('p-origin').value,
      technique: document.getElementById('p-technique').value,
      significance: document.getElementById('p-significance').value,
    };

    let product;
    if (editingProductId) {
      product = await apiFetch(`/products/${editingProductId}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } else {
      product = await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }

    // Upload new images
    if (selectedFiles.length > 0) {
      const formData = new FormData();
      selectedFiles.forEach(f => formData.append('images', f));
      const token = Auth.getToken();
      await fetch(`http://localhost:3000/api/v1/products/${product.id}/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
    }

    showToast(editingProductId ? '✅ Producto actualizado exitosamente' : '✅ Producto publicado exitosamente');
    cancelEdit();
    showSection('mis-productos');
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false; btn.textContent = editingProductId ? '✅ Guardar cambios' : '✅ Publicar producto';
  }
});

window.editProduct = async function(slug) {
  showToast('Cargando producto...', 'info');
  try {
    const p = await apiFetch(`/products/${slug}`);
    editingProductId = p.id;
    
    document.getElementById('p-name').value = p.name;
    document.getElementById('p-price').value = p.price;
    document.getElementById('p-stock').value = p.stock;
    
    // Attempt to select category and region
    setTimeout(() => {
      document.getElementById('p-category').value = p.category?.id || '';
      document.getElementById('p-region').value = p.region?.id || '';
    }, 500); // give time for selects to populate if just loaded

    document.getElementById('p-origin').value = p.cultural_origin;
    document.getElementById('p-technique').value = p.technique;
    document.getElementById('p-significance').value = p.significance;

    selectedFiles = [];
    document.getElementById('img-previews').innerHTML = p.images?.map(img => `
      <div class="image-preview-item">
        <img src="${img.url}" alt="saved-image"/>
      </div>
    `).join('') || '';

    document.getElementById('btn-publish').textContent = '✅ Guardar cambios';
    document.querySelector('#section-nuevo-producto h2').innerHTML = 'Editar producto <button type="button" class="btn btn-ghost btn-sm" onclick="cancelEdit()" style="float:right;">Cancelar edición</button>';
    
    showSection('nuevo-producto');
  } catch(e) {
    showToast('Error cargando producto para editar', 'error');
  }
};

window.cancelEdit = function() {
  editingProductId = null;
  selectedFiles = [];
  document.getElementById('product-form').reset();
  document.getElementById('img-previews').innerHTML = '';
  document.getElementById('preview-box').classList.add('hidden');
  document.getElementById('btn-publish').textContent = '✅ Publicar producto';
  document.querySelector('#section-nuevo-producto h2').textContent = 'Publicar nuevo producto';
  document.getElementById('btn-publish').disabled = false;
};

// Init
loadMyProducts();
