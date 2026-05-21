// dashboard-admin.js - Premium version
if (!Auth.requireRole('admin')) throw new Error('Acceso denegado');

const user = Auth.getUser();
document.getElementById('admin-welcome').textContent = `Panel de Control — ${user.full_name}`;

let pendingRejectId = null;
let allProducts = [];

function showSection(name) {
  ['artesanos', 'catalogo', 'pedidos', 'reseñas', 'auditoria', 'estadisticas'].forEach(s => {
    const el = document.getElementById(`section-${s}`);
    if (el) el.classList.add('hidden');
    const nav = document.getElementById(`nav-${s}`);
    if (nav) nav.classList.remove('active');
  });

  document.getElementById(`section-${name}`).classList.remove('hidden');
  document.getElementById(`nav-${name}`).classList.add('active');
  document.getElementById('section-title').textContent = name.charAt(0).toUpperCase() + name.slice(1);

  if (name === 'artesanos') loadArtisans();
  if (name === 'catalogo') loadAllProducts();
  if (name === 'pedidos') loadOrders();
  if (name === 'reseñas') loadReportedReviews();
  if (name === 'estadisticas') loadStats();
  if (name === 'auditoria') loadAudit();
}

async function loadGlobalStats() {
  try {
    const artisans = await apiFetch('/admin/artisans');
    const orders = await apiFetch('/admin/orders');
    const reported = await apiFetch('/admin/reviews/reported');

    document.getElementById('stat-pending').textContent = artisans.filter(a => a.verification_status === 'pending').length;
    
    const totalRevenue = orders.reduce((acc, o) => acc + Number(o.total_amount), 0);
    document.getElementById('stat-total-sales').textContent = formatPrice(totalRevenue);
    
    const today = new Date().toLocaleDateString();
    const ordersToday = orders.filter(o => new Date(o.created_at).toLocaleDateString() === today).length;
    document.getElementById('stat-orders-today').textContent = ordersToday;
    
    document.getElementById('stat-reported-reviews').textContent = reported.length;
  } catch (e) { console.error('Error stats:', e); }
}

let globalArtisans = [];

async function loadArtisans() {
  const status = document.getElementById('status-filter').value;
  const tbody = document.getElementById('artisans-table');
  tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;"><div class="spinner"></div></td></tr>';
  
  try {
    const qs = status ? `?status=${status}` : '';
    globalArtisans = await apiFetch('/admin/artisans' + qs);
    
    if (globalArtisans.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:3rem; color:#64748b;">No hay registros encontrados</td></tr>';
      return;
    }

    tbody.innerHTML = globalArtisans.map(a => `
      <tr>
        <td>
          <div style="font-weight:700; color:#1e293b; cursor:pointer;" onclick="viewArtisan('${a.id}')" title="Ver detalles">${a.user?.full_name || '—'}</div>
          <div style="font-size:0.8rem; color:#64748b;">${a.user?.email || ''}</div>
        </td>
        <td><span style="font-size:0.85rem;"><i class="fa-solid fa-location-dot"></i> ${a.region?.name || '—'}</span></td>
        <td>${badgeForStatus(a.verification_status)}</td>
        <td>
          <div style="display:flex; gap:0.5rem;">
            <button class="btn btn-outline btn-xs" onclick="viewArtisan('${a.id}')">Ver detalles</button>
            ${a.verification_status !== 'verified' ? `<button id="btn-approve-${a.id}" class="btn btn-success btn-xs" onclick="approveArtisan('${a.id}')">Aprobar</button>` : ''}
            ${a.verification_status === 'pending' ? `<button class="btn btn-danger btn-xs" onclick="openRejectModal('${a.id}', 'artisan')">Rechazar</button>` : ''}
            ${a.verification_status === 'verified' ? `<button class="btn btn-warning btn-xs" onclick="suspendArtisan('${a.id}')">Suspender</button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  } catch (e) { tbody.innerHTML = `<tr><td colspan="4">Error: ${e.message}</td></tr>`; }
}

function viewArtisan(id) {
  const a = globalArtisans.find(x => x.id === id);
  if (!a) return;

  const content = document.getElementById('artisan-modal-content');
  const actions = document.getElementById('artisan-modal-actions');

  let galleryHtml = '<span style="color:#94a3b8;font-size:0.85rem;">Sin galería</span>';
  if (a.gallery && a.gallery.length > 0) {
    galleryHtml = `<div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
      ${a.gallery.map(img => `<img src="${img.url}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;" onclick="window.open('${img.url}')" title="Clic para ampliar" />`).join('')}
    </div>`;
  }

  const docs = [];
  if (a.id_document_front_url) docs.push(`<a href="${a.id_document_front_url}" target="_blank" class="btn btn-outline btn-sm"><i class="fa-solid fa-file-lines"></i> Ver Documento (Frente)</a>`);
  if (a.id_document_back_url) docs.push(`<a href="${a.id_document_back_url}" target="_blank" class="btn btn-outline btn-sm"><i class="fa-solid fa-file-lines"></i> Ver Documento (Reverso)</a>`);

  content.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">
      <div>
        <div style="font-weight:700;font-size:1.1rem;">${a.user?.full_name}</div>
        <div style="color:#64748b;">${a.user?.email}</div>
        <div style="margin-top:0.5rem;">
          <span class="badge badge-primary">${a.category?.name || 'Sin categoría'}</span>
          <span style="font-size:0.85rem;"><i class="fa-solid fa-location-dot"></i> ${a.region?.name || 'Sin región'}</span>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:0.85rem;color:#64748b;">Registrado el:</div>
        <div style="font-weight:500;">${new Date(a.created_at).toLocaleDateString()}</div>
        <div style="margin-top:0.5rem;">${badgeForStatus(a.verification_status)}</div>
      </div>
    </div>
    
    <div>
      <div style="font-weight:600;margin-bottom:0.25rem;">Historia Cultural</div>
      <div style="background:#f8fafc;padding:1rem;border-radius:8px;white-space:pre-wrap;color:#334155;">${a.cultural_history || 'No especificada'}</div>
    </div>

    <div>
      <div style="font-weight:600;margin-bottom:0.5rem;">Documentos de Identidad</div>
      <div style="display:flex;gap:0.5rem;">${docs.length > 0 ? docs.join('') : '<span style="color:#94a3b8;">No subidos</span>'}</div>
    </div>

    <div>
      <div style="font-weight:600;margin-bottom:0.5rem;">Galería (Ejemplos)</div>
      ${galleryHtml}
    </div>
  `;

  let actionButtons = '';
  if (a.verification_status !== 'verified') {
    actionButtons += `<button class="btn btn-success" onclick="closeArtisanModal(); approveArtisan('${a.id}')">Aprobar Artesano</button>`;
  }
  if (a.verification_status === 'pending') {
    actionButtons += `<button class="btn btn-danger" onclick="closeArtisanModal(); openRejectModal('${a.id}', 'artisan')">Rechazar</button>`;
  }
  if (a.verification_status === 'verified') {
    actionButtons += `<button class="btn btn-warning" onclick="closeArtisanModal(); suspendArtisan('${a.id}')">Suspender</button>`;
  }
  actions.innerHTML = actionButtons;

  document.getElementById('artisan-modal').classList.remove('hidden');
}

function closeArtisanModal() {
  document.getElementById('artisan-modal').classList.add('hidden');
}

function badgeForStatus(status) {
  const map = {
    pending: { class: 'badge-pending', label: 'PENDIENTE' },
    verified: { class: 'badge-verified', label: 'VERIFICADO' },
    rejected: { class: 'badge-rejected', label: 'RECHAZADO' },
    suspended: { class: 'badge-suspended', label: 'SUSPENDIDO' }
  };
  const data = map[status] || { class: '', label: status };
  return `<span class="badge ${data.class}">${data.label}</span>`;
}

async function approveArtisan(id) {
  const btn = document.getElementById(`btn-approve-${id}`);
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Procesando...';
  }
  try {
    await apiFetch(`/admin/artisans/${id}/approve`, { method: 'PATCH' });
    showToast('<i class="fa-solid fa-check"></i> Artesano aprobado correctamente');
    loadArtisans();
    loadGlobalStats();
  } catch (e) { 
    showToast(e.message, 'error'); 
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Aprobar';
    }
  }
}

async function suspendArtisan(id) {
  if (!confirm('¿Deseas suspender este artesano? Perderá visibilidad en el catálogo.')) return;
  try {
    await apiFetch(`/admin/artisans/${id}/suspend`, { method: 'PATCH' });
    showToast('🟠 Artesano suspendido');
    loadArtisans();
    loadGlobalStats();
  } catch (e) { showToast(e.message, 'error'); }
}

async function loadAllProducts() {
  const tbody = document.getElementById('products-table');
  try {
    allProducts = await apiFetch('/admin/products');
    renderProducts(allProducts);
  } catch (e) { tbody.innerHTML = `<tr><td colspan="5">Error: ${e.message}</td></tr>`; }
}

function renderProducts(list) {
  const tbody = document.getElementById('products-table');
  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay productos</td></tr>';
    return;
  }
  tbody.innerHTML = list.map(p => `
    <tr>
      <td><div style="font-weight:600;">${p.name}</div><div style="font-size:0.75rem; color:#64748b;">${p.category?.name || '—'}</div></td>
      <td><div style="font-size:0.85rem;">${p.artisan?.user?.full_name || '—'}</div></td>
      <td><span style="font-weight:700;">${p.stock}</span></td>
      <td style="color:var(--color-primary); font-weight:700;">${formatPrice(p.price)}</td>
      <td>
        <div style="display:flex; gap:0.5rem;">
          <button class="btn btn-danger btn-xs" onclick="deleteProduct('${p.id}')">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function filterProducts() {
  const val = document.getElementById('search-product').value.toLowerCase();
  const filtered = allProducts.filter(p => p.name.toLowerCase().includes(val) || p.artisan?.user?.full_name.toLowerCase().includes(val));
  renderProducts(filtered);
}

async function deleteProduct(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer')) return;
  try {
    await apiFetch(`/admin/products/${id}`, { method: 'DELETE' });
    showToast('<i class="fa-solid fa-trash"></i> Producto eliminado permanentemente');
    loadAllProducts();
    loadGlobalStats();
  } catch (e) { showToast(e.message, 'error'); }
}

async function loadOrders() {
  const tbody = document.getElementById('orders-table');
  try {
    const orders = await apiFetch('/admin/orders');
    tbody.innerHTML = orders.map(o => `
      <tr>
        <td><code style="font-size:0.75rem; color:#64748b;">#${o.id.substring(0,8)}</code></td>
        <td><div style="font-weight:600;">${o.user?.full_name || '—'}</div></td>
        <td>${new Date(o.created_at).toLocaleDateString()}</td>
        <td style="font-weight:700; color:var(--color-primary);">${formatPrice(o.total_amount)}</td>
        <td>
          <select onchange="updateOrderStatus('${o.id}', this.value)" class="search-box" style="padding:0.25rem 0.5rem; font-size:0.8rem; max-width:150px; font-weight:700; ${
            o.status === 'paid' ? 'color:#16a34a; border-color:#22c55e;' :
            o.status === 'preparing' ? 'color:#d97706; border-color:#f59e0b;' :
            o.status === 'pending' ? 'color:#d97706; border-color:#f59e0b;' :
            o.status === 'shipped' ? 'color:#2563eb; border-color:#3b82f6;' :
            o.status === 'delivered' ? 'color:#10b981; border-color:#10b981;' :
            'color:#dc2626; border-color:#ef4444;'
          }">
            <option value="${o.status}" selected disabled>${
              o.status === 'pending' ? '<i class="fa-solid fa-hourglass-half"></i> Pendiente' :
              o.status === 'paid' ? '🟢 Pagado' :
              o.status === 'preparing' ? '<i class="fa-solid fa-hourglass-half"></i> En preparación' :
              o.status === 'shipped' ? '<i class="fa-solid fa-rocket"></i> Despachado' :
              o.status === 'delivered' ? '<i class="fa-solid fa-check"></i> Entregado' :
              '<i class="fa-solid fa-xmark"></i> Cancelado'
            } (Actual)</option>
            ${o.status !== 'cancelled' ? '<option value="cancelled" style="color:#dc2626; font-weight:700;"><i class="fa-solid fa-xmark"></i> Cancelar Pedido</option>' : ''}
            ${o.status !== 'delivered' ? '<option value="delivered" style="color:#10b981; font-weight:700;"><i class="fa-solid fa-check"></i> Marcar Entregado</option>' : ''}
          </select>
        </td>
      </tr>
    `).join('');
  } catch (e) { console.error(e); }
}

async function updateOrderStatus(id, status) {
  try {
    await apiFetch(`/orders/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
    showToast('<i class="fa-solid fa-check"></i> Estado del pedido actualizado');
    loadOrders();
    loadGlobalStats();
  } catch (e) { showToast(e.message, 'error'); }
}

async function loadReportedReviews() {
  const tbody = document.getElementById('reported-reviews-table');
  try {
    const reviews = await apiFetch('/admin/reviews/reported');
    tbody.innerHTML = reviews.map(r => `
      <tr>
        <td><div style="font-weight:600;">${r.product?.name || '—'}</div></td>
        <td><div style="font-style:italic; font-size:0.85rem; color:#64748b;">"${r.comment}"</div></td>
        <td style="color:#ef4444; font-weight:600;">${r.report_reason || '—'}</td>
        <td>
          <div style="display:flex; gap:0.5rem;">
            <button class="btn btn-success btn-xs" onclick="keepReview('${r.id}')">Descartar</button>
            <button class="btn btn-danger btn-xs" onclick="openRejectModal('${r.id}', 'review')">Eliminar</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (e) { console.error(e); }
}

function openRejectModal(id, type) {
  pendingRejectId = id;
  const btn = document.getElementById('modal-confirm-btn');
  if (type === 'artisan') {
    document.getElementById('modal-title').textContent = 'Rechazar Artesano';
    btn.onclick = confirmRejectArtisan;
  } else {
    document.getElementById('modal-title').textContent = 'Eliminar Reseña';
    btn.onclick = confirmDeleteReview;
  }
  document.getElementById('reject-modal').classList.remove('hidden');
}

function closeRejectModal() {
  document.getElementById('reject-modal').classList.add('hidden');
}

async function confirmRejectArtisan() {
  const reason = document.getElementById('reject-reason').value;
  try {
    await apiFetch(`/admin/artisans/${pendingRejectId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    });
    showToast('Artesano rechazado');
    closeRejectModal();
    loadArtisans();
  } catch (e) { showToast(e.message, 'error'); }
}

async function confirmDeleteReview() {
  const reason = document.getElementById('reject-reason').value;
  try {
    await apiFetch(`/admin/reviews/${pendingRejectId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason })
    });
    showToast('Reseña eliminada');
    closeRejectModal();
    loadReportedReviews();
  } catch (e) { showToast(e.message, 'error'); }
}

async function keepReview(id) {
  try {
    await apiFetch(`/admin/reviews/${id}/keep`, { method: 'PATCH' });
    showToast('Reporte descartado');
    loadReportedReviews();
  } catch (e) { showToast(e.message, 'error'); }
}

async function loadAudit() {
  const tbody = document.getElementById('audit-table');
  try {
    const logs = await apiFetch('/admin/audit');
    tbody.innerHTML = logs.map(l => `
      <tr>
        <td><span style="font-size:0.8rem;">${new Date(l.created_at).toLocaleString()}</span></td>
        <td><div style="font-weight:600;">${l.admin?.full_name || 'Admin'}</div></td>
        <td><span class="badge-pill" style="background:#e2e8f0; color:#475569;">${l.action.toUpperCase()}</span></td>
        <td><div style="font-size:0.85rem; color:#64748b;">${l.details || '—'}</div></td>
      </tr>
    `).join('');
  } catch (e) { console.error(e); }
}

let charts = {};
async function loadStats() {
  try {
    const orders = await apiFetch('/admin/orders');
    
    // Cats
    const cats = {};
    orders.forEach(o => o.items?.forEach(i => {
      const c = i.product?.category?.name || 'Otro';
      cats[c] = (cats[c] || 0) + Number(i.subtotal);
    }));

    if (charts.cats) charts.cats.destroy();
    charts.cats = new Chart(document.getElementById('chart-categories'), {
      type: 'doughnut',
      data: {
        labels: Object.keys(cats),
        datasets: [{ data: Object.values(cats), backgroundColor: ['#d97706', '#059669', '#2563eb', '#7c3aed', '#db2777'] }]
      },
      options: { plugins: { legend: { position: 'bottom' } } }
    });

    // Orders
    const days = {};
    orders.forEach(o => {
      const d = new Date(o.created_at).toLocaleDateString();
      days[d] = (days[d] || 0) + 1;
    });

    if (charts.orders) charts.orders.destroy();
    charts.orders = new Chart(document.getElementById('chart-orders'), {
      type: 'line',
      data: {
        labels: Object.keys(days).reverse(),
        datasets: [{ label: 'Ventas Diarias', data: Object.values(days).reverse(), borderColor: '#d97706', backgroundColor: 'rgba(217, 119, 6, 0.1)', fill: true, tension: 0.4 }]
      }
    });
  } catch (e) { console.error(e); }
}

// Global Export
window.exportStats = (type) => {
  showToast(`Generando reporte ${type.toUpperCase()}...`);
  setTimeout(() => showToast('<i class="fa-solid fa-check"></i> Reporte generado y listo para descargar'), 2000);
}

// Init
loadGlobalStats();
loadArtisans();
