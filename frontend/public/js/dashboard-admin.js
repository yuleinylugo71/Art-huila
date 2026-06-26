// dashboard-admin.js — Dashboard Admin completo y funcional
'use strict';

if (!Auth.requireRole('admin')) throw new Error('Acceso denegado');

// ─── Estado global ─────────────────────────────────────────────────────────
const user = Auth.getUser();

function setWelcome() {
  const welcome = i18next.t('admin.controlPanelWelcome', { name: user.full_name });
  document.getElementById('admin-welcome').textContent = welcome;
  document.getElementById('sidebar-admin-name').textContent = user.full_name;
  document.getElementById('admin-avatar-letter').textContent = (user.full_name || 'A')[0].toUpperCase();
}

let allProducts   = [];
let allOrders     = [];
let allReviews    = [];
let charts        = {};

// Global list states for client-side pagination
let globalArtisans   = [];
let globalAuditLogs  = [];
let filteredProducts = [];
let filteredOrders   = [];

let currentCatalogPage  = 1;
let currentArtisansPage = 1;
let currentOrdersPage   = 1;
let currentAuditPage    = 1;
const ITEMS_PER_PAGE    = 5;

// Pagination Helper Engine
function paginateList(items, page, limit) {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  return items.slice(startIndex, endIndex);
}

function renderPaginationControls(containerId, totalItems, currentPage, limit, onPageChangeName) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (totalItems <= limit) {
    container.innerHTML = '';
    return;
  }

  const totalPages = Math.ceil(totalItems / limit);
  const pageLabel = i18next.t('admin.paginationPage', { page: currentPage, total: totalPages });
  const prevLabel = i18next.t('admin.paginationPrev');
  const nextLabel = i18next.t('admin.paginationNext');

  container.innerHTML = `
    <div class="pagination-info">
      ${pageLabel} (${totalItems} ${i18next.t('common.loading').includes('...') ? '' : ''})
    </div>
    <div class="pagination-buttons">
      <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="${onPageChangeName}(${currentPage - 1})">
        <i class="fa-solid fa-chevron-left"></i> ${prevLabel}
      </button>
      <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="${onPageChangeName}(${currentPage + 1})">
        ${nextLabel} <i class="fa-solid fa-chevron-right"></i>
      </button>
    </div>
  `;
}

window.changeCatalogPage = function(page) {
  currentCatalogPage = page;
  renderCatalogPage();
};

window.changeArtisansPage = function(page) {
  currentArtisansPage = page;
  renderArtisansPage();
};

window.changeOrdersPage = function(page) {
  currentOrdersPage = page;
  renderOrdersPage();
};

window.changeAuditPage = function(page) {
  currentAuditPage = page;
  renderAuditPage();
};

// Pending modal callbacks
let _pendingModalAction = null;
let _pendingTrackingOrderId = null;

// ─── NAVEGACIÓN ───────────────────────────────────────────────────────────
const SECTIONS = ['overview', 'artesanos', 'catalogo', 'pedidos', 'resenas', 'estadisticas', 'auditoria'];

window.showSection = function(name) {
  SECTIONS.forEach(s => {
    document.getElementById(`section-${s}`)?.classList.add('hidden');
    document.getElementById(`nav-${s}`)?.classList.remove('active');
  });
  document.getElementById(`section-${name}`)?.classList.remove('hidden');
  document.getElementById(`nav-${name}`)?.classList.add('active');

  const titleKeys = {
    overview:     'admin.menuOverviewLabel',
    artesanos:    'admin.artisanValidation',
    catalogo:     'admin.productControl',
    pedidos:      'admin.orderManagement',
    resenas:      'admin.reportedReviewsHeading',
    estadisticas: 'admin.statsAndAnalytics',
    auditoria:    'admin.auditLogHeading',
  };
  document.getElementById('section-title').textContent = i18next.t(titleKeys[name] || name);

  if (name === 'artesanos')    loadArtisans();
  if (name === 'catalogo')     loadAllProducts();
  if (name === 'pedidos')      loadOrders();
  if (name === 'resenas')      loadReportedReviews();
  if (name === 'estadisticas') loadStats();
  if (name === 'auditoria')    loadAudit();

  if (window.innerWidth <= 768) {
    document.querySelector('.dashboard-layout')?.classList.remove('sidebar-expanded');
  }
};

// ─── STATS GLOBALES ────────────────────────────────────────────────────────
async function loadGlobalStats() {
  try {
    const s = await apiFetch('/admin/stats/summary');

    document.getElementById('stat-pending').textContent = s.artisans.pending;
    document.getElementById('stat-total-sales').textContent = formatPrice(s.orders.totalRevenue);
    document.getElementById('stat-orders-today').textContent = s.orders.today;
    document.getElementById('stat-reported-reviews').textContent = s.reviews.reported;

    // Actualizar badges del sidebar
    if (s.artisans.pending > 0) {
      const b = document.getElementById('badge-artesanos');
      b.textContent = s.artisans.pending;
      b.style.display = 'inline-flex';
    }
    if (s.reviews.reported > 0) {
      const b = document.getElementById('badge-resenas');
      b.textContent = s.reviews.reported;
      b.style.display = 'inline-flex';
    }
  } catch (e) {
    console.error('Error stats:', e);
  }
}

// ─── ARTESANOS ────────────────────────────────────────────────────────────
async function loadArtisans() {
  const status = document.getElementById('status-filter').value;
  const tbody = document.getElementById('artisans-table');
  tbody.innerHTML = '<tr><td colspan="5" class="table-loading"><div class="spinner"></div> Cargando...</td></tr>';

  try {
    const qs = status ? `?status=${status}` : '';
    globalArtisans = await apiFetch('/admin/artisans' + qs);
    currentArtisansPage = 1;
    renderArtisansPage();
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-error"><i class="fa-solid fa-triangle-exclamation"></i> Error: ${e.message}</td></tr>`;
  }
}

function renderArtisansPage() {
  const tbody = document.getElementById('artisans-table');
  if (globalArtisans.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="table-empty"><i class="fa-solid fa-users-slash"></i><br>No hay artesanos en este estado</td></tr>';
    document.getElementById('artisans-pagination').innerHTML = '';
    return;
  }

  const paginated = paginateList(globalArtisans, currentArtisansPage, ITEMS_PER_PAGE);

  tbody.innerHTML = paginated.map(a => `
    <tr>
      <td>
        <div class="td-name" onclick="viewArtisan('${a.id}')">${a.user?.full_name || '—'}</div>
        <div class="td-sub">${a.user?.email || ''}</div>
      </td>
      <td><span class="td-location"><i class="fa-solid fa-location-dot"></i> ${a.region?.name || '—'}</span></td>
      <td>${badgeStatus(a.verification_status)}</td>
      <td class="td-sub">${new Date(a.created_at).toLocaleDateString('es-CO')}</td>
      <td>
        <div class="btn-group">
          <button class="btn btn-ghost btn-xs" onclick="viewArtisan('${a.id}')"><i class="fa-solid fa-eye"></i></button>
          ${a.verification_status !== 'verified'
            ? `<button class="btn btn-success btn-xs" onclick="approveArtisan('${a.id}')"><i class="fa-solid fa-check"></i> Aprobar</button>`
            : ''}
          ${a.verification_status === 'pending'
            ? `<button class="btn btn-danger btn-xs" onclick="openReasonModal('Rechazar artesano','Se notificará al artesano por email.',() => rejectArtisan('${a.id}'))"><i class="fa-solid fa-xmark"></i> Rechazar</button>`
            : ''}
          ${a.verification_status === 'verified'
            ? `<button class="btn btn-warning btn-xs" onclick="openReasonModal('Suspender artesano','El artesano perderá visibilidad en el catálogo.',() => suspendArtisan('${a.id}'))"><i class="fa-solid fa-ban"></i> Suspender</button>`
            : ''}
        </div>
      </td>
    </tr>
  `).join('');

  renderPaginationControls('artisans-pagination', globalArtisans.length, currentArtisansPage, ITEMS_PER_PAGE, 'changeArtisansPage');

  // Mobile cards view
  const mobileList = document.getElementById('artisans-cards-mobile');
  if (mobileList) {
    if (paginated.length === 0) {
      mobileList.innerHTML = '<div class="table-empty" style="padding:2rem;text-align:center;">No hay artesanos en este estado</div>';
    } else {
      mobileList.innerHTML = paginated.map(a => `
        <div class="mobile-card-item">
          <div class="mc-row">
            <div>
              <div class="td-name" onclick="viewArtisan('${a.id}')">${a.user?.full_name || '—'}</div>
              <div class="td-sub">${a.user?.email || ''}</div>
            </div>
            ${badgeStatus(a.verification_status)}
          </div>
          <div class="mc-row">
            <span class="mc-label">Región</span>
            <span class="mc-value td-location"><i class="fa-solid fa-location-dot"></i> ${a.region?.name || '—'}</span>
          </div>
          <div class="mc-row">
            <span class="mc-label">Fecha Registro</span>
            <span class="mc-value td-sub">${new Date(a.created_at).toLocaleDateString('es-CO')}</span>
          </div>
          <div class="mc-actions">
            <button class="btn btn-ghost btn-sm" onclick="viewArtisan('${a.id}')" style="flex:0;"><i class="fa-solid fa-eye"></i></button>
            ${a.verification_status !== 'verified' ? `<button class="btn btn-success btn-sm" onclick="approveArtisan('${a.id}')"><i class="fa-solid fa-check"></i> Aprobar</button>` : ''}
            ${a.verification_status === 'pending' ? `<button class="btn btn-danger btn-sm" onclick="openReasonModal('Rechazar artesano','Se notificará al artesano por email.',() => rejectArtisan('${a.id}'))"><i class="fa-solid fa-xmark"></i> Rechazar</button>` : ''}
            ${a.verification_status === 'verified' ? `<button class="btn btn-warning btn-sm" onclick="openReasonModal('Suspender artesano','El artesano perderá visibilidad en el catálogo.',() => suspendArtisan('${a.id}'))"><i class="fa-solid fa-ban"></i> Suspender</button>` : ''}
          </div>
        </div>
      `).join('');
    }
  }
}

window.viewArtisan = function(id) {
  const a = globalArtisans.find(x => x.id === id);
  if (!a) return;

  const galleryHtml = a.gallery?.length
    ? `<div class="gallery-grid">${a.gallery.map(img => `<img src="${img.url}" class="gallery-thumb" onclick="window.open('${img.url}')" title="Ampliar"/>`).join('')}</div>`
    : `<span class="td-sub">${i18next.t('admin.artisanDetailNoGallery')}</span>`;

  const docs = [
    a.id_document_front_url && `<a href="${a.id_document_front_url}" target="_blank" class="btn btn-outline btn-sm"><i class="fa-solid fa-file-lines"></i> ${i18next.t('admin.artisanDetailDocFront')}</a>`,
    a.id_document_back_url  && `<a href="${a.id_document_back_url}" target="_blank" class="btn btn-outline btn-sm"><i class="fa-solid fa-file-lines"></i> ${i18next.t('admin.artisanDetailDocBack')}</a>`,
  ].filter(Boolean);

  document.getElementById('artisan-modal-content').innerHTML = `
    <div class="artisan-detail-header">
      <div>
        <div class="artisan-detail-name">${a.user?.full_name}</div>
        <div class="td-sub">${a.user?.email}</div>
        <div style="margin-top:0.5rem;display:flex;gap:0.5rem;flex-wrap:wrap;">
          <span class="td-location"><i class="fa-solid fa-location-dot"></i> ${a.region?.name || '—'}</span>
        </div>
      </div>
      <div style="text-align:right;">
        ${badgeStatus(a.verification_status)}
        <div class="td-sub" style="margin-top:0.5rem;">${i18next.t('admin.artisanDetailRegistered')} ${new Date(a.created_at).toLocaleDateString()}</div>
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title"><i class="fa-solid fa-scroll"></i> ${i18next.t('admin.artisanDetailHistory')}</div>
      <div class="detail-text">${a.cultural_history || i18next.t('admin.artisanDetailNoHistory')}</div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title"><i class="fa-solid fa-id-card"></i> ${i18next.t('admin.artisanDetailDocs')}</div>
      <div class="btn-group">${docs.length ? docs.join('') : `<span class="td-sub">${i18next.t('admin.artisanDetailNoDocs')}</span>`}</div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title"><i class="fa-solid fa-images"></i> ${i18next.t('admin.artisanDetailGallery')}</div>
      ${galleryHtml}
    </div>
  `;

  let actionBtns = '';
  if (a.verification_status !== 'verified') {
    actionBtns += `<button class="btn btn-success" onclick="closeArtisanModal(); approveArtisan('${a.id}')"><i class="fa-solid fa-check"></i> ${i18next.t('admin.approveArtisanBtn')}</button>`;
  }
  if (a.verification_status === 'pending') {
    actionBtns += `<button class="btn btn-danger" onclick="closeArtisanModal(); openReasonModal('${i18next.t('admin.rejectArtisanHeading')}','${i18next.t('admin.rejectArtisanConfirm')}',() => rejectArtisan('${a.id}'))">${i18next.t('admin.rejectBtn')}</button>`;
  }
  if (a.verification_status === 'verified') {
    actionBtns += `<button class="btn btn-warning" onclick="closeArtisanModal(); openReasonModal('${i18next.t('admin.suspendBtn')}','${i18next.t('admin.suspendArtisanConfirm')}',() => suspendArtisan('${a.id}'))">${i18next.t('admin.suspendBtn')}</button>`;
  }
  document.getElementById('artisan-modal-actions').innerHTML = actionBtns;
  document.getElementById('artisan-modal').classList.remove('hidden');
};

window.closeArtisanModal = function() {
  document.getElementById('artisan-modal').classList.add('hidden');
};

async function approveArtisan(id) {
  try {
    await apiFetch(`/admin/artisans/${id}/approve`, { method: 'PATCH' });
    showToast(i18next.t('admin.toastArtisanApproved'), 'success');
    loadArtisans();
    loadGlobalStats();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function rejectArtisan(id) {
  const reason = document.getElementById('modal-reason-text').value.trim();
  if (!reason) { showToast(i18next.t('admin.modalActionReason'), 'warning'); return; }
  try {
    await apiFetch(`/admin/artisans/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) });
    showToast(i18next.t('admin.toastArtisanRejected'), 'warning');
    closeReasonModal();
    loadArtisans();
    loadGlobalStats();
  } catch (e) {
    showToast(e.message, 'error');
  }
async function suspendArtisan(id) {
  const reason = document.getElementById('modal-reason-text').value.trim();
  if (!reason) { showToast(i18next.t('admin.modalActionReason'), 'warning'); return; }
  try {
    await apiFetch(`/admin/artisans/${id}/suspend`, { method: 'PATCH', body: JSON.stringify({ reason }) });
    showToast(i18next.t('admin.toastArtisanSuspendedEmail'), 'warning');
    closeReasonModal();
    loadArtisans();
    loadGlobalStats();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// ─── MODAL DE MOTIVO ─────────────────────────────────────────────────────
window.openReasonModal = function(title, desc, onConfirm) {
  document.getElementById('reason-modal-title').textContent = title;
  document.getElementById('reason-modal-desc').textContent = desc;
  document.getElementById('modal-reason-text').value = '';
  _pendingModalAction = onConfirm;
  document.getElementById('reason-modal-confirm-btn').onclick = () => {
    if (_pendingModalAction) _pendingModalAction();
  };
  document.getElementById('reason-modal').classList.remove('hidden');
};

window.closeReasonModal = function() {
  document.getElementById('reason-modal').classList.add('hidden');
  _pendingModalAction = null;
};

// ─── CATÁLOGO ─────────────────────────────────────────────────────────────
async function loadAllProducts() {
  const tbody = document.getElementById('products-table');
  tbody.innerHTML = '<tr><td colspan="7" class="table-loading"><div class="spinner"></div> Cargando...</td></tr>';
  try {
    allProducts = await apiFetch('/admin/products');
    
    // Rellenar combobox de artesanos con valores únicos
    const datalist = document.getElementById('artisan-options');
    if (datalist) {
      const uniqueArtisans = [...new Set(allProducts
        .map(p => p.artisan?.user?.full_name)
        .filter(Boolean)
      )].sort();
      datalist.innerHTML = uniqueArtisans.map(name => `<option value="${name}"></option>`).join('');
    }

    currentCatalogPage = 1;
    renderProducts(allProducts);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-error">Error: ${e.message}</td></tr>`;
  }
}

function renderProducts(list) {
  filteredProducts = list;
  renderCatalogPage();
}

function renderCatalogPage() {
  const tbody = document.getElementById('products-table');
  if (!filteredProducts.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No hay productos</td></tr>';
    document.getElementById('catalog-pagination').innerHTML = '';
    return;
  }

  const paginated = paginateList(filteredProducts, currentCatalogPage, ITEMS_PER_PAGE);

  tbody.innerHTML = paginated.map(p => `
    <tr class="${p.status === 'hidden' ? 'row-dimmed' : ''}">
      <td>
        <div class="td-name">${p.name}</div>
        <div class="td-sub">${p.category?.name || '—'}</div>
      </td>
      <td><div class="td-sub">${p.artisan?.user?.full_name || '—'}</div></td>
      <td><span class="badge badge-category">${p.category?.name || '—'}</span></td>
      <td><span class="stock-badge ${p.stock <= 0 ? 'stock-out' : p.stock <= 5 ? 'stock-low' : ''}">${p.stock}</span></td>
      <td class="td-price">${formatPrice(p.price)}</td>
      <td>${p.status === 'hidden'
        ? '<span class="badge badge-hidden"><i class="fa-solid fa-eye-slash"></i> Oculto</span>'
        : '<span class="badge badge-visible"><i class="fa-solid fa-eye"></i> Visible</span>'}</td>
      <td>
        <div class="btn-group">
          <button class="btn btn-outline btn-xs" title="${p.status === 'hidden' ? 'Mostrar' : 'Ocultar'}" onclick="toggleProductVisibility('${p.id}', '${p.status}')">
            <i class="fa-solid ${p.status === 'hidden' ? 'fa-eye' : 'fa-eye-slash'}"></i>
          </button>
          <button class="btn btn-danger btn-xs" onclick="openReasonModal('Eliminar producto','Esta acción notificará al artesano y no se puede deshacer.',() => deleteProduct('${p.id}'))">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  renderPaginationControls('catalog-pagination', filteredProducts.length, currentCatalogPage, ITEMS_PER_PAGE, 'changeCatalogPage');

  // Mobile cards view
  const mobileList = document.getElementById('products-cards-mobile');
  if (mobileList) {
    if (paginated.length === 0) {
      mobileList.innerHTML = '<div class="table-empty" style="padding:2rem;text-align:center;">No hay productos</div>';
    } else {
      mobileList.innerHTML = paginated.map(p => `
        <div class="mobile-card-item ${p.status === 'hidden' ? 'row-dimmed' : ''}">
          <div class="mc-row">
            <div>
              <div class="td-name">${p.name}</div>
              <div class="td-sub">${p.artisan?.user?.full_name || '—'}</div>
            </div>
            ${p.status === 'hidden'
              ? '<span class="badge badge-hidden"><i class="fa-solid fa-eye-slash"></i> Oculto</span>'
              : '<span class="badge badge-visible"><i class="fa-solid fa-eye"></i> Visible</span>'}
          </div>
          <div class="mc-row">
            <span class="mc-label">Categoría</span>
            <span class="badge badge-category">${p.category?.name || '—'}</span>
          </div>
          <div class="mc-row">
            <span class="mc-label">Stock</span>
            <span class="stock-badge ${p.stock <= 0 ? 'stock-out' : p.stock <= 5 ? 'stock-low' : ''}">${p.stock}</span>
          </div>
          <div class="mc-row">
            <span class="mc-label">Precio</span>
            <span class="td-price">${formatPrice(p.price)}</span>
          </div>
          <div class="mc-actions">
            <button class="btn btn-outline btn-sm" title="${p.status === 'hidden' ? 'Mostrar' : 'Ocultar'}" onclick="toggleProductVisibility('${p.id}', '${p.status}')">
              <i class="fa-solid ${p.status === 'hidden' ? 'fa-eye' : 'fa-eye-slash'}"></i> ${p.status === 'hidden' ? 'Mostrar' : 'Ocultar'}
            </button>
            <button class="btn btn-danger btn-sm" onclick="openReasonModal('Eliminar producto','Esta acción notificará al artesano y no se puede deshacer.',() => deleteProduct('${p.id}'))"><i class="fa-solid fa-trash"></i> Eliminar</button>
          </div>
        </div>
      `).join('');
    }
  }
}

window.filterProducts = function() {
  const query = document.getElementById('search-product').value.toLowerCase();
  const status = document.getElementById('product-status-filter').value;
  const artisanQuery = document.getElementById('filter-artisan-input').value.toLowerCase();

  let filtered = allProducts;

  if (query) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(query)
    );
  }

  if (artisanQuery) {
    filtered = filtered.filter(p =>
      (p.artisan?.user?.full_name || '').toLowerCase().includes(artisanQuery)
    );
  }

  if (status === 'visible') filtered = filtered.filter(p => p.status !== 'hidden');
  if (status === 'hidden')  filtered = filtered.filter(p => p.status === 'hidden');

  currentCatalogPage = 1;
  renderProducts(filtered);
};

async function toggleProductVisibility(id, currentStatus) {
  try {
    await apiFetch(`/admin/products/${id}/hide`, { method: 'PATCH' });
    const isNowHidden = currentStatus !== 'hidden';
    showToast(
      isNowHidden
        ? '<i class="fa-solid fa-eye-slash"></i> Producto ocultado del catálogo'
        : '<i class="fa-solid fa-eye"></i> Producto visible en el catálogo',
      isNowHidden ? 'warning' : 'success'
    );
    loadAllProducts();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function deleteProduct(id) {
  const reason = document.getElementById('modal-reason-text').value.trim();
  try {
    await apiFetch(`/admin/products/${id}`, { method: 'DELETE' });
    showToast('<i class="fa-solid fa-trash"></i> Producto eliminado', 'success');
    closeReasonModal();
    loadAllProducts();
    loadGlobalStats();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// ─── PEDIDOS ─────────────────────────────────────────────────────────────
async function loadOrders() {
  const tbody = document.getElementById('orders-table');
  tbody.innerHTML = '<tr><td colspan="7" class="table-loading"><div class="spinner"></div> Cargando...</td></tr>';
  try {
    allOrders = await apiFetch('/admin/orders');
    currentOrdersPage = 1;
    renderOrders(allOrders);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-error">Error: ${e.message}</td></tr>`;
  }
}

function renderOrders(list) {
  filteredOrders = list;
  renderOrdersPage();
}

function renderOrdersPage() {
  const tbody = document.getElementById('orders-table');
  if (!filteredOrders.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="table-empty">No hay pedidos</td></tr>';
    document.getElementById('orders-pagination').innerHTML = '';
    return;
  }

  const paginated = paginateList(filteredOrders, currentOrdersPage, ITEMS_PER_PAGE);

  tbody.innerHTML = paginated.map(o => `
    <tr>
      <td><code class="order-id">#${o.id.substring(0,8)}</code></td>
      <td>
        <div class="td-name">${o.user?.full_name || '—'}</div>
        <div class="td-sub">${o.user?.email || ''}</div>
      </td>
      <td class="td-sub">${new Date(o.created_at).toLocaleDateString('es-CO')}</td>
      <td class="td-price">${formatPrice(o.total_amount)}</td>
      <td>${badgeOrderStatus(o.status)}</td>
      <td>
        ${o.tracking_number
          ? `<div class="td-name" style="font-size:0.8rem;">${o.shipping_company || ''}</div>
             <code class="td-sub">${o.tracking_number}</code>`
          : `<span class="td-sub">${i18next.t('admin.noTrackingGuide')}</span>`}
      </td>
      <td>
        <div class="btn-group">
          <button class="btn btn-outline btn-xs" onclick="viewOrder('${o.id}')"><i class="fa-solid fa-eye"></i></button>
          ${o.status !== 'delivered' && o.status !== 'cancelled'
            ? `<button class="btn btn-primary btn-xs" onclick="openTrackingModal('${o.id}')"><i class="fa-solid fa-truck"></i></button>`
            : ''}
          ${o.status !== 'cancelled' && o.status !== 'delivered'
            ? `<button class="btn btn-danger btn-xs" onclick="cancelOrder('${o.id}')"><i class="fa-solid fa-ban"></i></button>`
            : ''}
          ${o.status === 'shipped'
            ? `<button class="btn btn-success btn-xs" onclick="markDelivered('${o.id}')"><i class="fa-solid fa-check"></i></button>`
            : ''}
        </div>
      </td>
    </tr>
  `).join('');
  // Mobile cards view
  const mobileList = document.getElementById('orders-cards-mobile');
  if (mobileList) {
    if (paginated.length === 0) {
      mobileList.innerHTML = '<div class="table-empty" style="padding:2rem;text-align:center;">No hay pedidos</div>';
    } else {
      mobileList.innerHTML = paginated.map(o => `
        <div class="mobile-card-item">
          <div class="mc-row">
            <div>
              <div class="td-name">${o.user?.full_name || '—'}</div>
              <div class="td-sub">${o.user?.email || ''}</div>
            </div>
            ${badgeOrderStatus(o.status)}
          </div>
          <div class="mc-row">
            <span class="mc-label">${i18next.t('admin.thId')}</span>
            <code class="order-id">#${o.id.substring(0,8)}</code>
          </div>
          <div class="mc-row">
            <span class="mc-label">${i18next.t('admin.thDate')}</span>
            <span class="td-sub">${new Date(o.created_at).toLocaleDateString()}</span>
          </div>
          <div class="mc-row">
            <span class="mc-label">${i18next.t('admin.thTotal')}</span>
            <span class="td-price">${formatPrice(o.total_amount)}</span>
          </div>
          ${o.tracking_number ? `<div class="mc-row"><span class="mc-label">${i18next.t('admin.orderDetailTracking')}</span><code style="font-size:0.75rem;">${o.shipping_company || ''} · ${o.tracking_number}</code></div>` : ''}
          <div class="mc-actions">
            <button class="btn btn-outline btn-sm" onclick="viewOrder('${o.id}')"><i class="fa-solid fa-eye"></i> ${i18next.t('common.view')}</button>
            ${o.status !== 'delivered' && o.status !== 'cancelled' ? `<button class="btn btn-primary btn-sm" onclick="openTrackingModal('${o.id}')"><i class="fa-solid fa-truck"></i> ${i18next.t('admin.orderDetailTracking')}</button>` : ''}
            ${o.status !== 'cancelled' && o.status !== 'delivered' ? `<button class="btn btn-danger btn-sm" onclick="cancelOrder('${o.id}')"><i class="fa-solid fa-ban"></i></button>` : ''}
            ${o.status === 'shipped' ? `<button class="btn btn-success btn-sm" onclick="markDelivered('${o.id}')"><i class="fa-solid fa-check"></i> ${i18next.t('order.statusDelivered')}</button>` : ''}
          </div>
        </div>
      `).join('');
    }
  }
}

window.filterOrders = function() {
  const status    = document.getElementById('order-status-filter').value;
  const dateStart = document.getElementById('order-date-start').value;
  const dateEnd   = document.getElementById('order-date-end').value;

  let filtered = allOrders;
  if (status)    filtered = filtered.filter(o => o.status === status);
  if (dateStart) filtered = filtered.filter(o => new Date(o.created_at) >= new Date(dateStart));
  if (dateEnd)   filtered = filtered.filter(o => new Date(o.created_at) <= new Date(dateEnd + 'T23:59:59'));
  renderOrders(filtered);
};

window.clearOrderFilters = function() {
  document.getElementById('order-status-filter').value = '';
  document.getElementById('order-date-start').value = '';
  document.getElementById('order-date-end').value = '';
  renderOrders(allOrders);
};

window.viewOrder = function(id) {
  const o = allOrders.find(x => x.id === id);
  if (!o) return;

  const itemsHtml = (o.items || []).map(item => `
    <div class="order-item-row">
      <div>
        <div class="td-name">${item.product?.name || 'Producto'}</div>
        <div class="td-sub">${item.product?.artisan?.user?.full_name || ''} · x${item.quantity}</div>
      </div>
      <div class="td-price">${formatPrice(item.subtotal || 0)}</div>
    </div>
  `).join('');

  document.getElementById('order-modal-content').innerHTML = `
    <div class="order-detail-header">
      <div>
        <div class="td-name" style="font-size:1.1rem;">${i18next.t('order.idLabel', { id: o.id.substring(0,8) })}</div>
        <div class="td-sub">${new Date(o.created_at).toLocaleString()}</div>
      </div>
      <div>${badgeOrderStatus(o.status)}</div>
    </div>

    <div class="order-detail-grid">
      <div class="detail-section">
        <div class="detail-section-title"><i class="fa-solid fa-user"></i> ${i18next.t('admin.orderDetailClient')}</div>
        <div class="td-name">${o.user?.full_name || '—'}</div>
        <div class="td-sub">${o.user?.email || ''}</div>
      </div>
      <div class="detail-section">
        <div class="detail-section-title"><i class="fa-solid fa-location-dot"></i> ${i18next.t('admin.orderDetailShipping')}</div>
        <div class="td-name">${o.shipping_address?.city || '—'}</div>
        <div class="td-sub">${o.shipping_address?.address || ''}</div>
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title"><i class="fa-solid fa-boxes-stacked"></i> ${i18next.t('admin.orderDetailProducts')}</div>
      <div class="order-items-list">${itemsHtml || `<span class="td-sub">${i18next.t('admin.noItems')}</span>`}</div>
    </div>

    <div class="order-totals">
      <div class="total-row"><span>${i18next.t('admin.orderDetailSubtotal')}</span><span>${formatPrice(Number(o.total_amount) - Number(o.shipping_cost || 0))}</span></div>
      <div class="total-row"><span>${i18next.t('admin.orderDetailShippingCost')} (${o.shipping_company || '—'})</span><span>${formatPrice(o.shipping_cost || 0)}</span></div>
      <div class="total-row total-final"><span>${i18next.t('admin.orderDetailTotal')}</span><span>${formatPrice(o.total_amount)}</span></div>
    </div>

    ${o.tracking_number ? `
    <div class="detail-section" style="margin-top:1rem;">
      <div class="detail-section-title"><i class="fa-solid fa-truck"></i> ${i18next.t('admin.orderDetailTracking')}</div>
      <div class="tracking-info">
        <span class="td-name">${o.shipping_company}</span>
        <code>${o.tracking_number}</code>
      </div>
    </div>` : ''}
  `;

  document.getElementById('order-modal-actions').innerHTML = `
    ${o.status !== 'cancelled' && o.status !== 'delivered'
      ? `<button class="btn btn-primary" onclick="closeOrderModal(); openTrackingModal('${o.id}')"><i class="fa-solid fa-truck"></i> ${i18next.t('admin.updateTrackingTitle')}</button>`
      : ''}
    ${o.status === 'shipped'
      ? `<button class="btn btn-success" onclick="closeOrderModal(); markDelivered('${o.id}')"><i class="fa-solid fa-check"></i> ${i18next.t('admin.markDeliveredOption')}</button>`
      : ''}
    ${o.status !== 'cancelled' && o.status !== 'delivered'
      ? `<button class="btn btn-danger" onclick="closeOrderModal(); cancelOrder('${o.id}')"><i class="fa-solid fa-ban"></i> ${i18next.t('admin.cancelOrderOption')}</button>`
      : ''}
  `;

  document.getElementById('order-modal').classList.remove('hidden');
};

window.closeOrderModal = function() {
  document.getElementById('order-modal').classList.add('hidden');
};

async function cancelOrder(id) {
  if (!confirm('¿Confirmas la cancelación de este pedido? Se devolverá el stock.')) return;
  try {
    await apiFetch(`/orders/${id}/status`, { method: 'POST', body: JSON.stringify({ status: 'cancelled' }) });
    showToast(i18next.t('admin.toastOrderCancelled'), 'warning');
    loadOrders();
    loadGlobalStats();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function markDelivered(id) {
  try {
    await apiFetch(`/orders/${id}/status`, { method: 'POST', body: JSON.stringify({ status: 'delivered' }) });
    showToast(i18next.t('admin.toastMarkedDelivered'), 'success');
    loadOrders();
    loadGlobalStats();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// ─── TRACKING MODAL ───────────────────────────────────────────────────────
window.openTrackingModal = function(orderId) {
  _pendingTrackingOrderId = orderId;
  const order = allOrders.find(o => o.id === orderId);
  document.getElementById('tracking-number-input').value  = order?.tracking_number || '';
  document.getElementById('tracking-carrier-input').value = order?.shipping_company || '';
  document.getElementById('tracking-modal').classList.remove('hidden');
};

window.closeTrackingModal = function() {
  document.getElementById('tracking-modal').classList.add('hidden');
  _pendingTrackingOrderId = null;
};

window.confirmUpdateTracking = async function() {
  const trackingNumber  = document.getElementById('tracking-number-input').value.trim();
  const shippingCompany = document.getElementById('tracking-carrier-input').value.trim();
  if (!trackingNumber || !shippingCompany) {
    showToast(i18next.t('admin.trackingNumberLabel'), 'warning');
    return;
  }
  try {
    await apiFetch(`/orders/${_pendingTrackingOrderId}/tracking`, {
      method: 'PATCH',
      body: JSON.stringify({ tracking_number: trackingNumber, shipping_company: shippingCompany }),
    });
    showToast(i18next.t('admin.toastTrackingUpdated'), 'success');
    closeTrackingModal();
    loadOrders();
  } catch (e) {
    showToast(e.message, 'error');
  }
};

// ─── RESEÑAS ─────────────────────────────────────────────────────────────
async function loadReportedReviews() {
  const container = document.getElementById('reviews-list');
  container.innerHTML = '<div class="table-loading"><div class="spinner"></div> Cargando...</div>';
  try {
    allReviews = await apiFetch('/admin/reviews/reported');
    sortReviews();
  } catch (e) {
    container.innerHTML = `<div class="table-error">Error: ${e.message}</div>`;
  }
}

window.sortReviews = function() {
  const sort = document.getElementById('review-sort').value;
  const sorted = [...allReviews].sort((a, b) => {
    if (sort === 'reported') return (b.report_count || 1) - (a.report_count || 1);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  renderReviews(sorted);
};

function renderReviews(list) {
  const container = document.getElementById('reviews-list');
  if (!list.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-flag-checkered fa-3x" style="color:#22c55e;margin-bottom:1rem;"></i>
        <h3>${i18next.t('admin.noReportedReviews')}</h3>
        <p>${i18next.t('admin.noReportedDesc')}</p>
      </div>`;
    return;
  }

  container.innerHTML = list.map(r => `
    <div class="review-card">
      <div class="review-card-header">
        <div>
          <div class="review-product"><i class="fa-solid fa-box"></i> ${r.product?.name || i18next.t('admin.otherCategory')}</div>
          <div class="review-author">${i18next.t('admin.reviewBy')} <strong>${r.user?.full_name || 'Usuario'}</strong> · ${renderStars(r.rating)}</div>
        </div>
        <div class="review-meta">
          ${r.report_count > 1 ? `<span class="badge badge-red">${i18next.t('admin.badgeReports', { count: r.report_count })}</span>` : `<span class="badge badge-red">${i18next.t('admin.badgeReported')}</span>`}
          <span class="td-sub">${new Date(r.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      <div class="review-comment">"${r.comment}"</div>
      <div class="review-reason"><i class="fa-solid fa-triangle-exclamation"></i> ${i18next.t('admin.thReason')}: <strong>${r.report_reason || i18next.t('admin.notSpecified')}</strong></div>
      <div class="review-actions">
        <button class="btn btn-success btn-sm" onclick="keepReview('${r.id}')">
          <i class="fa-solid fa-check"></i> ${i18next.t('admin.dismissReportBtn')}
        </button>
        <button class="btn btn-danger btn-sm" onclick="openReasonModal('${i18next.t('admin.deleteReviewHeading')}','',() => deleteReview('${r.id}'))">
          <i class="fa-solid fa-trash"></i> ${i18next.t('admin.deleteReviewBtn')}
        </button>
      </div>
    </div>
  `).join('');
}

function renderStars(rating) {
  return Array.from({ length: 5 }, (_, i) =>
    `<i class="fa-${i < rating ? 'solid' : 'regular'} fa-star" style="color:#f59e0b;font-size:0.8rem;"></i>`
  ).join('');
}

async function keepReview(id) {
  try {
    await apiFetch(`/admin/reviews/${id}/keep`, { method: 'PATCH' });
    showToast(i18next.t('admin.toastReportDismissed'), 'success');
    loadReportedReviews();
    loadGlobalStats();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function deleteReview(id) {
  const reason = document.getElementById('modal-reason-text').value.trim();
  try {
    await apiFetch(`/admin/reviews/${id}`, { method: 'DELETE', body: JSON.stringify({ reason }) });
    showToast(i18next.t('admin.toastReviewDeleted'), 'success');
    closeReasonModal();
    loadReportedReviews();
    loadGlobalStats();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

// ─── ESTADÍSTICAS ─────────────────────────────────────────────────────────
async function loadStats(start, end) {
  try {
    const qs = start && end ? `?start=${start}&end=${end}` : '';
    const orders = await apiFetch('/admin/orders' + qs);

    // KPIs
    const revenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total_amount), 0);
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const deliveryRate = orders.length ? ((delivered / orders.length) * 100).toFixed(1) : '0.0';
    const avgTicket = orders.length ? revenue / orders.length : 0;

    document.getElementById('kpi-total-orders').textContent = orders.length;
    document.getElementById('kpi-revenue').textContent = formatPrice(revenue);
    document.getElementById('kpi-delivery-rate').textContent = deliveryRate + '%';
    document.getElementById('kpi-avg-ticket').textContent = formatPrice(avgTicket);

    // Chart: Categorías
    const cats = {};
    orders.forEach(o => o.items?.forEach(i => {
      const c = i.product?.category?.name || 'Otro';
      cats[c] = (cats[c] || 0) + Number(i.subtotal || 0);
    }));
    buildChart('chart-categories', 'doughnut', Object.keys(cats), [{
      data: Object.values(cats),
      backgroundColor: ['#8b5a2b','#d97706','#059669','#2563eb','#7c3aed','#db2777','#ef4444'],
    }], { plugins: { legend: { position: 'bottom' } } });

    // Chart: Pedidos por día
    const days = {};
    orders.forEach(o => {
      const d = new Date(o.created_at).toLocaleDateString('es-CO');
      days[d] = (days[d] || 0) + 1;
    });
    const dayKeys = Object.keys(days).slice(-14);
    buildChart('chart-orders', 'line', dayKeys, [{
      label: 'Pedidos',
      data: dayKeys.map(k => days[k]),
      borderColor: '#d97706',
      backgroundColor: 'rgba(217,119,6,0.12)',
      fill: true,
      tension: 0.4,
    }]);

    // Chart: Por estado
    const statusMap = { pending:'Pendiente',paid:'Pagado',preparing:'Preparando',shipped:'Despachado',delivered:'Entregado',cancelled:'Cancelado' };
    const statusCount = {};
    orders.forEach(o => { statusCount[o.status] = (statusCount[o.status] || 0) + 1; });
    buildChart('chart-status', 'bar', Object.keys(statusCount).map(k => statusMap[k]||k), [{
      data: Object.values(statusCount),
      backgroundColor: ['#f59e0b','#22c55e','#f97316','#3b82f6','#10b981','#ef4444'],
      borderRadius: 8,
    }], { plugins: { legend: { display: false } } });

    // Chart: Artesanos por estado
    const artisanStats = await apiFetch('/admin/stats/summary');
    buildChart('chart-artisans', 'doughnut',
      ['Verificados','Pendientes','Suspendidos'],
      [{ data: [artisanStats.artisans.verified, artisanStats.artisans.pending, artisanStats.artisans.suspended],
         backgroundColor: ['#22c55e','#f59e0b','#ef4444'] }],
      { plugins: { legend: { position: 'bottom' } } });

  } catch (e) {
    console.error('Error cargando estadísticas:', e);
    showToast('Error al cargar estadísticas', 'error');
  }
}

function buildChart(id, type, labels, datasets, options = {}) {
  if (charts[id]) charts[id].destroy();
  const ctx = document.getElementById(id);
  if (!ctx) return;
  charts[id] = new Chart(ctx, { type, data: { labels, datasets }, options: { responsive: true, ...options } });
}

window.applyStatsFilter = function() {
  const start = document.getElementById('stats-date-start').value;
  const end   = document.getElementById('stats-date-end').value;
  loadStats(start, end);
};

window.exportReport = function(format) {
  if (format === 'excel') {
    const rows = allOrders.map(o => ({
      'ID': o.id.substring(0,8),
      'Cliente': o.user?.full_name || '',
      'Email': o.user?.email || '',
      'Fecha': new Date(o.created_at).toLocaleDateString('es-CO'),
      'Total': Number(o.total_amount),
      'Estado': o.status,
      'Ciudad': o.shipping_address?.city || '',
      'Transportadora': o.shipping_company || '',
      'Guía': o.tracking_number || '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pedidos');
    XLSX.writeFile(wb, `reporte-arthuila-${new Date().toISOString().slice(0,10)}.xlsx`);
    showToast('<i class="fa-solid fa-file-excel"></i> Reporte Excel descargado', 'success');
  }
};

// ─── AUDITORÍA ────────────────────────────────────────────────────────────
async function loadAudit() {
  const tbody = document.getElementById('audit-table');
  tbody.innerHTML = '<tr><td colspan="5" class="table-loading"><div class="spinner"></div> Cargando...</td></tr>';
  try {
    const logs = await apiFetch('/admin/audit');
    globalAuditLogs = logs;
    currentAuditPage = 1;
    renderAuditPage();
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="5" class="table-error">Error: ${e.message}</td></tr>`;
  }
}

function renderAuditPage() {
  const tbody = document.getElementById('audit-table');
  if (!globalAuditLogs.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="table-empty">Sin registros de auditoría</td></tr>';
    document.getElementById('audit-pagination').innerHTML = '';
    return;
  }

  const paginated = paginateList(globalAuditLogs, currentAuditPage, ITEMS_PER_PAGE);

  tbody.innerHTML = paginated.map(l => `
    <tr>
      <td class="td-sub">${new Date(l.created_at).toLocaleString('es-CO')}</td>
      <td><div class="td-name">${l.admin?.full_name || 'Admin'}</div></td>
      <td>${badgeAuditAction(l.action)}</td>
      <td class="td-sub"><code style="font-size:0.75rem;">${(l.target_id || '').substring(0,12)}</code></td>
      <td class="td-sub">${l.details || '—'}</td>
    </tr>
  `).join('');

  renderPaginationControls('audit-pagination', globalAuditLogs.length, currentAuditPage, ITEMS_PER_PAGE, 'changeAuditPage');

  // Mobile cards view
  const mobileList = document.getElementById('audit-cards-mobile');
  if (mobileList) {
    if (paginated.length === 0) {
      mobileList.innerHTML = '<div class="table-empty" style="padding:2rem;text-align:center;">Sin registros de auditoría</div>';
    } else {
      mobileList.innerHTML = paginated.map(l => `
        <div class="mobile-card-item">
          <div class="mc-row">
            <div>
              <div class="td-name">${l.admin?.full_name || 'Admin'}</div>
              <div class="td-sub">${new Date(l.created_at).toLocaleString('es-CO')}</div>
            </div>
            ${badgeAuditAction(l.action)}
          </div>
          <div class="mc-row">
            <span class="mc-label">Referencia</span>
            <code style="font-size:0.75rem;">${(l.target_id || '').substring(0,12)}</code>
          </div>
          ${l.details ? `<div class="mc-row"><span class="mc-label">Detalles</span><span class="td-sub">${l.details}</span></div>` : ''}
        </div>
      `).join('');
    }
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────
function badgeStatus(status) {
  const map = {
    pending:   { cls: 'badge-pending',   label: '⏳ Pendiente' },
    verified:  { cls: 'badge-verified',  label: '✅ Verificado' },
    rejected:  { cls: 'badge-rejected',  label: '❌ Rechazado' },
    suspended: { cls: 'badge-suspended', label: '🔴 Suspendido' },
  };
  const d = map[status] || { cls: '', label: status };
  return `<span class="badge ${d.cls}">${d.label}</span>`;
}

function badgeOrderStatus(status) {
  const map = {
    pending:   { cls: 'order-pending',   label: '⏳ Pendiente' },
    paid:      { cls: 'order-paid',      label: '💳 Pagado' },
    preparing: { cls: 'order-preparing', label: '📦 Preparando' },
    shipped:   { cls: 'order-shipped',   label: '🚚 Despachado' },
    delivered: { cls: 'order-delivered', label: '✅ Entregado' },
    cancelled: { cls: 'order-cancelled', label: '❌ Cancelado' },
  };
  const d = map[status] || { cls: '', label: status };
  return `<span class="badge ${d.cls}">${d.label}</span>`;
}

function badgeAuditAction(action) {
  const colors = {
    APPROVE_ARTISAN:  '#22c55e',
    REJECT_ARTISAN:   '#ef4444',
    SUSPEND_ARTISAN:  '#f59e0b',
    DELETE_REVIEW:    '#6366f1',
    HIDE_PRODUCT:     '#f97316',
    DELETE_PRODUCT:   '#dc2626',
  };
  const color = colors[action] || '#64748b';
  return `<span style="background:${color}1a;color:${color};padding:0.25rem 0.6rem;border-radius:6px;font-size:0.75rem;font-weight:700;">${action}</span>`;
}

// ─── INIT ─────────────────────────────────────────────────────────────────
loadGlobalStats();
showSection('overview');

// Toggler para colapsar/expandir menú lateral
function initSidebar() {
  const layout = document.querySelector('.dashboard-layout');
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  if (btnToggleSidebar && layout) {
    btnToggleSidebar.addEventListener('click', () => {
      layout.classList.toggle('sidebar-expanded');
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSidebar);
} else {
  initSidebar();
}

// Cerrar modales al hacer clic fuera
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', function(e) {
    if (e.target === this) {
      this.classList.add('hidden');
    }
  });
});
