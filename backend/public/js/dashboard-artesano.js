// dashboard-artesano.js
if (!Auth.requireRole('artesano')) throw new Error('Not artisan');

const user = Auth.getUser();
let selectedFiles = [];
let artisanProfile = null;

if (window.i18nReadyProcessed) {
  initPage();
} else {
  document.addEventListener('i18nReady', initPage);
}

document.addEventListener('languageChanged', () => {
  updateWelcomeMessage();
  updateTasksAndMetrics();
  
  const activeSection = getActiveSectionName();
  if (activeSection === 'resumen') updateTasksAndMetrics();
  if (activeSection === 'mi-perfil') loadProfile();
  if (activeSection === 'mis-productos') loadMyProducts();
  if (activeSection === 'mis-ventas') loadMySales();
  if (activeSection === 'mis-compras') loadMyPurchases();
  
  // Re-run selects to translate placeholders
  initSelects();
});

function getActiveSectionName() {
  const sections = ['resumen', 'mis-productos', 'nuevo-producto', 'mi-perfil', 'mis-ventas', 'mis-compras'];
  for (let s of sections) {
    const el = document.getElementById(`section-${s}`);
    if (el && !el.classList.contains('hidden')) return s;
  }
  return 'resumen';
}

function initPage() {
  initSelects();
  initProfile();
}

function updateWelcomeMessage() {
  const welcome = document.getElementById('welcome-msg');
  if (welcome) {
    welcome.textContent = i18next.t('artisan.hello', { name: artisanProfile?.user?.full_name || Auth.getUser().full_name });
  }
  const mobileWelcome = document.getElementById('mobile-welcome-msg');
  if (mobileWelcome) {
    mobileWelcome.textContent = artisanProfile?.user?.full_name || Auth.getUser().full_name;
  }
}

function showSection(name) {
  ['resumen', 'mis-productos', 'nuevo-producto', 'mi-perfil', 'mis-ventas', 'mis-compras'].forEach(s => {
    const el = document.getElementById(`section-${s}`);
    if (el) el.classList.add('hidden');
  });
  
  const activeEl = document.getElementById(`section-${name}`);
  if (activeEl) {
    activeEl.classList.remove('hidden');
    // Trigger smooth micro-animation
    activeEl.style.opacity = '0';
    activeEl.style.transform = 'translateY(8px)';
    activeEl.style.transition = 'opacity 0.25s var(--transition, ease-out), transform 0.25s var(--transition, ease-out)';
    requestAnimationFrame(() => {
      setTimeout(() => {
        activeEl.style.opacity = '1';
        activeEl.style.transform = 'translateY(0)';
      }, 50);
    });
  }

  // Update active status on sidebar links
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('onclick') === `showSection('${name}')`) {
      link.classList.add('active');
    }
  });

  // Keep Perfil active in mobile bottom nav
  document.querySelectorAll('.mobile-bottom-nav .nav-item').forEach(link => {
    link.classList.remove('active');
  });
  const mNavPerfil = document.getElementById('m-nav-perfil');
  if (mNavPerfil) {
    mNavPerfil.classList.add('active');
  }

  // Update active status on mobile pill tabs
  document.querySelectorAll('.mobile-pill-tabs .pill-tab').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('onclick') === `showSection('${name}')`) {
      btn.classList.add('active');
    }
  });

  if (name === 'resumen') updateTasksAndMetrics();
  if (name === 'mi-perfil') loadProfile();
  if (name === 'mis-productos') loadMyProducts();
  if (name === 'mis-ventas') loadMySales();
  if (name === 'mis-compras') loadMyPurchases();
}

async function loadMySales() {
  const list = document.getElementById('sales-list');
  const mobileContainer = document.getElementById('sales-cards-mobile');
  
  list.innerHTML = `<tr><td colspan="6" style="text-align:center;"><div class="spinner"></div></td></tr>`;
  if (mobileContainer) mobileContainer.innerHTML = `<div style="text-align:center;padding:2rem;"><div class="spinner"></div></div>`;
  
  try {
    const sales = await apiFetch('/orders/artisan/sales');
    if (sales.length === 0) {
      list.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--color-muted);padding:2rem;">${i18next.t('artisan.noSalesYet')}</td></tr>`;
      if (mobileContainer) mobileContainer.innerHTML = `<div style="text-align:center;color:var(--color-muted);padding:2rem;">${i18next.t('artisan.noSalesYet')}</div>`;
      return;
    }
    // Group sales (order items) by order ID
    const groupedSales = {};
    sales.forEach(s => {
      const orderId = s.order.id;
      if (!groupedSales[orderId]) {
        groupedSales[orderId] = {
          order: s.order,
          items: []
        };
      }
      groupedSales[orderId].items.push(s);
    });

    // Convert grouped object to array sorted by order date DESC
    const sortedGroups = Object.values(groupedSales).sort((a, b) => {
      return new Date(b.order.created_at).getTime() - new Date(a.order.created_at).getTime();
    });

    list.innerHTML = sortedGroups.map(g => {
      const o = g.order;
      const totalQty = g.items.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = g.items.reduce((sum, item) => sum + item.subtotal, 0);

      // Generate HTML for products in this order
      const productsHtml = g.items.map(item => `
        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom: 0.25rem;">
          <img src="${item.product?.images?.[0]?.url || '/img/placeholder.jpg'}" style="width:30px;height:30px;object-fit:cover;border-radius:4px;"/>
          <span style="font-weight:500;">${item.product?.name || i18next.t('artisan.productDeleted')}</span>
          <span style="color:var(--color-muted); font-size:0.8rem; font-weight:600;">(x${item.quantity})</span>
        </div>
      `).join('');

      let statusHtml = '';
      if (o.status === 'paid') {
        statusHtml = `
          <select onchange="updateArtisanOrderStatus('${o.id}', this.value)" class="form-control-sm" style="color:#16a34a; border-color:#22c55e; font-weight:700; padding:2px 5px; border-radius:4px; outline:none;">
            <option value="paid" selected style="color:#16a34a; font-weight:700;">🟢 ${i18next.t('order.statusPaid')}</option>
            <option value="preparing" style="color:#d97706; font-weight:700;">🟡 ${i18next.t('order.statusPreparing')}</option>
          </select>
        `;
      } else if (o.status === 'preparing') {
        statusHtml = `
          <select onchange="updateArtisanOrderStatus('${o.id}', this.value)" class="form-control-sm" style="color:#d97706; border-color:#f59e0b; font-weight:700; padding:2px 5px; border-radius:4px; outline:none;">
            <option value="preparing" selected style="color:#d97706; font-weight:700;">🟡 ${i18next.t('order.statusPreparing')}</option>
            <option value="shipped" style="color:#7c3aed; font-weight:700;">🚀 ${i18next.t('order.statusShipped')}</option>
          </select>
        `;
      } else if (o.status === 'shipped') {
        statusHtml = `<span style="color:#7c3aed; background:#f5f3ff; padding:0.25rem 0.5rem; border-radius:6px; border:1px solid #ddd6fe; font-weight:700; font-size:0.8rem; display:inline-block;"><i class="fa-solid fa-rocket"></i> ${i18next.t('order.statusShipped')}</span>`;
      } else if (o.status === 'delivered') {
        statusHtml = `<span style="color:#10b981; background:#ecfdf5; padding:0.25rem 0.5rem; border-radius:6px; border:1px solid #a7f3d0; font-weight:700; font-size:0.8rem; display:inline-block;"><i class="fa-solid fa-check"></i> ${i18next.t('order.statusDelivered')}</span>`;
      } else if (o.status === 'pending') {
        statusHtml = `<span style="color:#d97706; background:#fffbeb; padding:0.25rem 0.5rem; border-radius:6px; border:1px solid #fef3c7; font-weight:700; font-size:0.8rem; display:inline-block;"><i class="fa-solid fa-hourglass-half"></i> ${i18next.t('order.statusPending')}</span>`;
      } else {
        statusHtml = `<span style="color:#dc2626; background:#fef2f2; padding:0.25rem 0.5rem; border-radius:6px; border:1px solid #fecaca; font-weight:700; font-size:0.8rem; display:inline-block;"><i class="fa-solid fa-xmark"></i> ${i18next.t('order.statusCancelled', { defaultValue: 'Cancelado' })}</span>`;
      }

      return `
        <tr>
          <td style="font-size:0.85rem; vertical-align: middle;">${new Date(o.created_at).toLocaleDateString(i18next.language === 'es' ? 'es-CO' : 'en-US')}</td>
          <td style="vertical-align: middle;">
            ${productsHtml}
          </td>
          <td style="font-size:0.85rem; vertical-align: middle;">${o.user.full_name}</td>
          <td style="text-align:center; vertical-align: middle; font-weight: 550;">${totalQty}</td>
          <td style="font-weight:600; color:var(--color-primary); vertical-align: middle;">${formatPrice(totalAmount)}</td>
          <td style="vertical-align: middle;">
            ${statusHtml}
          </td>
        </tr>
      `;
    }).join('');

    // Render mobile cards
    if (mobileContainer) {
      mobileContainer.innerHTML = sortedGroups.map(g => {
        const o = g.order;
        const totalQty = g.items.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = g.items.reduce((sum, item) => sum + item.subtotal, 0);
        const productsText = g.items.map(item => `${item.product?.name || i18next.t('artisan.productDeleted')} (x${item.quantity})`).join(', ');
        const dateStr = new Date(o.created_at).toLocaleDateString(i18next.language === 'es' ? 'es-CO' : 'en-US');
        
        let statusHtml = '';
        if (o.status === 'paid') {
          statusHtml = `
            <select onchange="updateArtisanOrderStatus('${o.id}', this.value)" class="form-control-sm" style="color:#16a34a; border-color:#22c55e; font-weight:700; padding:4px 8px; border-radius:6px; outline:none; font-size:0.8rem; width:100%;">
              <option value="paid" selected style="color:#16a34a;">🟢 ${i18next.t('order.statusPaid')}</option>
              <option value="preparing" style="color:#d97706;">🟡 ${i18next.t('order.statusPreparing')}</option>
            </select>
          `;
        } else if (o.status === 'preparing') {
          statusHtml = `
            <select onchange="updateArtisanOrderStatus('${o.id}', this.value)" class="form-control-sm" style="color:#d97706; border-color:#f59e0b; font-weight:700; padding:4px 8px; border-radius:6px; outline:none; font-size:0.8rem; width:100%;">
              <option value="preparing" selected style="color:#d97706;">🟡 ${i18next.t('order.statusPreparing')}</option>
              <option value="shipped" style="color:#7c3aed;">🚀 ${i18next.t('order.statusShipped')}</option>
            </select>
          `;
        } else if (o.status === 'shipped') {
          statusHtml = `<span style="color:#7c3aed; background:#f5f3ff; padding:0.25rem 0.5rem; border-radius:6px; border:1px solid #ddd6fe; font-weight:700; font-size:0.8rem; display:inline-block; text-align:center; width:100%; box-sizing:border-box;"><i class="fa-solid fa-rocket"></i> ${i18next.t('order.statusShipped')}</span>`;
        } else if (o.status === 'delivered') {
          statusHtml = `<span style="color:#10b981; background:#ecfdf5; padding:0.25rem 0.5rem; border-radius:6px; border:1px solid #a7f3d0; font-weight:700; font-size:0.8rem; display:inline-block; text-align:center; width:100%; box-sizing:border-box;"><i class="fa-solid fa-check"></i> ${i18next.t('order.statusDelivered')}</span>`;
        } else if (o.status === 'pending') {
          statusHtml = `<span style="color:#d97706; background:#fffbeb; padding:0.25rem 0.5rem; border-radius:6px; border:1px solid #fef3c7; font-weight:700; font-size:0.8rem; display:inline-block; text-align:center; width:100%; box-sizing:border-box;"><i class="fa-solid fa-hourglass-half"></i> ${i18next.t('order.statusPending')}</span>`;
        } else {
          statusHtml = `<span style="color:#dc2626; background:#fef2f2; padding:0.25rem 0.5rem; border-radius:6px; border:1px solid #fecaca; font-weight:700; font-size:0.8rem; display:inline-block; text-align:center; width:100%; box-sizing:border-box;"><i class="fa-solid fa-xmark"></i> ${i18next.t('order.statusCancelled', { defaultValue: 'Cancelado' })}</span>`;
        }

        const productImagesHtml = g.items.map(item => 
          `<img src="${item.product?.images?.[0]?.url || '/img/placeholder.jpg'}" style="width:40px;height:40px;object-fit:cover;border-radius:8px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.1);" alt=""/>`
        ).join('');

        return `
          <div class="sale-mobile-card">
            <div class="sale-card-header">
              <div class="sale-card-images">${productImagesHtml}</div>
              <div class="sale-card-date"><i class="fa-regular fa-calendar"></i> ${dateStr}</div>
            </div>
            <div class="sale-card-body">
              <div class="sale-card-products">${productsText}</div>
              <div class="sale-card-row">
                <span class="sale-card-label">${i18next.t('admin.thCustomer')}:</span>
                <span class="sale-card-value">${o.user.full_name}</span>
              </div>
              <div class="sale-card-row">
                <span class="sale-card-label">${i18next.t('buyer.quantityLabelShort')}:</span>
                <span class="sale-card-value">${totalQty}</span>
              </div>
              <div class="sale-card-row">
                <span class="sale-card-label">${i18next.t('admin.thTotal')}:</span>
                <span class="sale-card-value sale-card-total">${formatPrice(totalAmount)}</span>
              </div>
            </div>
            <div class="sale-card-footer">${statusHtml}</div>
          </div>
        `;
      }).join('');
    }
  } catch (e) {
    list.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--color-danger);">${e.message}</td></tr>`;
    if (mobileContainer) mobileContainer.innerHTML = `<div style="text-align:center;color:var(--color-danger);padding:2rem;">${e.message}</div>`;
  }
}

window.updateArtisanOrderStatus = async function(orderId, newStatus) {
  try {
    await apiFetch(`/orders/${orderId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status: newStatus })
    });
    showToast(i18next.t('artisan.toastOrderStatusUpdated'), 'success');
    loadMySales();
  } catch (e) {
    showToast(i18next.t('artisan.errorUpdatingStatus') + e.message, 'error');
    loadMySales();
  }
};

async function initSelects() {
  try {
    const [cats, regs] = await Promise.all([apiFetch('/categories'), apiFetch('/regions')]);
    
    // Product form selects
    const catSel = document.getElementById('p-category');
    const regSel = document.getElementById('p-region');
    if (catSel) catSel.innerHTML = `<option value="">${i18next.t('artisan.selectCategoryOption')}</option>` + cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    if (regSel) regSel.innerHTML = `<option value="">${i18next.t('artisan.selectRegionOption')}</option>` + regs.map(r => `<option value="${r.id}">${r.name}</option>`).join('');

    // Profile form selects
    const profCatSel = document.getElementById('profile-category');
    const profRegSel = document.getElementById('profile-region');
    if (profCatSel) profCatSel.innerHTML = `<option value="">${i18next.t('artisan.selectCategoryOption')}</option>` + cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    if (profRegSel) profRegSel.innerHTML = `<option value="">${i18next.t('artisan.selectRegionOption')}</option>` + regs.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
  } catch (e) { 
    console.error(e); 
  }
}

async function initProfile() {
  try {
    artisanProfile = await apiFetch('/artisans/me');
    if (artisanProfile?.verification_status !== 'verified') {
      const alertEl = document.getElementById('not-verified-alert');
      if (alertEl) alertEl.classList.remove('hidden');
    }
    updateWelcomeMessage();
    updateTasksAndMetrics();
    if (typeof window.updateMobileAvatar === 'function') {
      window.updateMobileAvatar(artisanProfile?.avatar_url);
    }
  } catch (e) { 
    console.error(e); 
  }
}

async function loadMyProducts() {
  const grid = document.getElementById('my-products-grid');
  grid.innerHTML = '<div class="spinner"></div>';
  try {
    const products = await apiFetch('/products/artisan/mis-productos');
    if (!products || products.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="emoji"><i class="fa-solid fa-box"></i></div>
          <h3>${i18next.t('artisan.noProductsTitle')}</h3>
          <p>${i18next.t('artisan.noProductsDesc')}</p>
        </div>
      `;
      return;
    }
    grid.innerHTML = products.map(p => `
      <div class="card product-card">
        <div class="product-img-wrapper">
          ${p.images && p.images[0] ? `<img class="product-img" src="${p.images[0].url}" alt="${p.name}" loading="lazy"/>` : '<div class="product-img-placeholder"><i class="fa-solid fa-palette fa-2x"></i></div>'}
          ${p.stock === 0 ? `<span class="product-badge badge-out-of-stock">${i18next.t('catalog.outOfStock', { defaultValue: 'Agotado' })}</span>` : ''}
        </div>
        <div class="product-card-body">
          <h4 class="product-name">${p.name}</h4>
          <div class="product-price">${formatPrice(p.price)}</div>
          <div class="product-meta">
            <span class="stock-label">
              ${p.stock === 0 
                ? `<span style="color:#dc2626;font-weight:700;"><i class="fa-solid fa-circle-xmark"></i> Sin stock</span>`
                : p.stock <= 3
                  ? `<span style="color:#d97706;font-weight:700;"><i class="fa-solid fa-triangle-exclamation"></i> ¡Últimas ${p.stock}!</span>`
                  : `Stock: <strong>${p.stock}</strong>`
              }
            </span>
            <span class="badge badge-verified" style="background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0;"><i class="fa-solid fa-circle-check"></i> ${i18next.t('artisan.publishedStatus', { defaultValue: 'Publicado' })}</span>
          </div>
          <div class="product-card-actions">
            <a href="producto.html?slug=${p.slug}" class="btn btn-ghost btn-sm" style="flex:1;"><i class="fa-regular fa-eye"></i> ${i18next.t('common.view')}</a>
            <button onclick="editProduct('${p.slug}')" class="btn btn-outline btn-sm" style="flex:1;"><i class="fa-solid fa-pen-to-square"></i> ${i18next.t('common.edit')}</button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="emoji"><i class="fa-solid fa-triangle-exclamation"></i></div><h3>${e.message}</h3></div>`;
  }
}

async function loadProfile() {
  try {
    const p = await apiFetch('/artisans/me');
    artisanProfile = p;
    
    // Fill display header details
    const dispName = document.getElementById('profile-display-name');
    if (dispName) dispName.textContent = p.user?.full_name || Auth.getUser().full_name;
    
    const dispCat = document.getElementById('profile-display-category');
    if (dispCat) dispCat.innerHTML = `<i class="fa-solid fa-palette"></i> ${p.category?.name || 'Artesano'}`;
    
    const dispReg = document.getElementById('profile-display-region');
    if (dispReg) dispReg.innerHTML = `<i class="fa-solid fa-location-dot"></i> ${p.region?.name || 'Huila'}`;

    const headerAvatar = document.getElementById('avatar-preview-header');
    if (headerAvatar) {
      if (p.avatar_url) {
        headerAvatar.innerHTML = `<img src="${p.avatar_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;"/>`;
      } else {
        headerAvatar.innerHTML = '<i class="fa-solid fa-user"></i>';
      }
    }

    // Fill basic details
    document.getElementById('profile-full-name').value = p.user?.full_name || Auth.getUser().full_name;
    document.getElementById('profile-email').value = p.user?.email || Auth.getUser().email;
    document.getElementById('profile-id-number').value = p.id_number || '';
    
    document.getElementById('profile-category').value = p.category?.id || '';
    document.getElementById('profile-region').value = p.region?.id || '';
    
    // History
    document.getElementById('profile-history-text').textContent = p.cultural_history || i18next.t('artisan.noHistoryYet');
    document.getElementById('profile-history').value = p.cultural_history || '';
    
    // Avatar image
    if (p.avatar_url) {
      document.getElementById('avatar-preview').innerHTML = `<img src="${p.avatar_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;"/>`;
    } else {
      document.getElementById('avatar-preview').innerHTML = '<i class="fa-solid fa-user"></i>';
    }
    if (typeof window.updateMobileAvatar === 'function') {
      window.updateMobileAvatar(p.avatar_url);
    }

    // Document previews (Front & Back)
    const frontPrev = document.getElementById('doc-front-preview');
    if (p.id_document_front_url) {
      if (p.id_document_front_url.endsWith('.pdf')) {
        frontPrev.innerHTML = `<a href="${p.id_document_front_url}" target="_blank" class="doc-link-pdf" style="display:inline-flex;align-items:center;gap:0.5rem;color:var(--color-primary);font-weight:600;"><i class="fa-solid fa-file-pdf fa-2x"></i> Ver documento PDF</a>`;
      } else {
        frontPrev.innerHTML = `<img src="${p.id_document_front_url}" alt="Cédula Frente" style="max-width:100%;max-height:160px;object-fit:contain;border-radius:6px;cursor:pointer;border:1px solid var(--color-border);" onclick="window.open(this.src, '_blank')"/>`;
      }
    } else {
      frontPrev.innerHTML = `<span class="text-muted" style="font-size:0.85rem;"><i class="fa-solid fa-triangle-exclamation text-amber" style="color:#d97706;"></i> ${i18next.t('artisan.statusPendiente')}</span>`;
    }

    const backPrev = document.getElementById('doc-back-preview');
    if (p.id_document_back_url) {
      if (p.id_document_back_url.endsWith('.pdf')) {
        backPrev.innerHTML = `<a href="${p.id_document_back_url}" target="_blank" class="doc-link-pdf" style="display:inline-flex;align-items:center;gap:0.5rem;color:var(--color-primary);font-weight:600;"><i class="fa-solid fa-file-pdf fa-2x"></i> Ver documento PDF</a>`;
      } else {
        backPrev.innerHTML = `<img src="${p.id_document_back_url}" alt="Cédula Reverso" style="max-width:100%;max-height:160px;object-fit:contain;border-radius:6px;cursor:pointer;border:1px solid var(--color-border);" onclick="window.open(this.src, '_blank')"/>`;
      }
    } else {
      backPrev.innerHTML = `<span class="text-muted" style="font-size:0.85rem;"><i class="fa-solid fa-triangle-exclamation text-amber" style="color:#d97706;"></i> ${i18next.t('artisan.statusPendiente')}</span>`;
    }

    // Legal Certifications
    const decStatus = document.getElementById('legal-declaration-status');
    const decCheck = document.getElementById('profile-declaracion');
    if (p.truthfulness_declaration) {
      decStatus.innerHTML = `<span class="text-success" style="font-weight:700;color:#16a34a;">✔ ${i18next.t('artisan.statusCompleto')}</span>`;
      decCheck.checked = true;
    } else {
      decStatus.innerHTML = `<span class="text-danger" style="font-weight:700;color:#dc2626;">✘ ${i18next.t('artisan.statusPendiente')}</span>`;
      decCheck.checked = false;
    }
    document.getElementById('legal-ip').textContent = p.legal_acceptance_ip || i18next.t('artisan.ipNotRegistered');
    document.getElementById('legal-timestamp').textContent = p.legal_acceptance_timestamp ? new Date(p.legal_acceptance_timestamp).toLocaleString(i18next.language === 'es' ? 'es-CO' : 'en-US') : i18next.t('artisan.ipNotRegistered');

    // Gallery
    if (p.gallery && p.gallery.length > 0) {
      document.getElementById('gallery-previews').innerHTML = p.gallery.map(img => `<img src="${img.url}" style="width:110px;height:110px;object-fit:cover;border-radius:8px;border:3px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,0.08);"/>`).join('');
    } else {
      document.getElementById('gallery-previews').innerHTML = `<span class="text-muted" style="font-size:0.85rem;">${i18next.t('artisan.tallerGalleryEmptyText')}</span>`;
    }

    // Refresh general tasks / metrics
    updateTasksAndMetrics();
  } catch (e) { 
    showToast(e.message, 'error'); 
  }
}

async function updateTasksAndMetrics() {
  try {
    const [sales, products] = await Promise.all([
      apiFetch('/orders/artisan/sales').catch(() => []),
      apiFetch('/products/artisan/mis-productos').catch(() => [])
    ]);

    // Metrics Row Cards Calculation
    let totalRevenue = sales.reduce((acc, curr) => acc + (curr.subtotal || 0), 0);
    if (totalRevenue === null || totalRevenue === undefined || isNaN(totalRevenue)) {
      totalRevenue = 0;
    }
    const metricRevenueEl = document.getElementById('metric-revenue');
    if (metricRevenueEl) metricRevenueEl.textContent = formatPrice(totalRevenue);

    const totalStock = products.reduce((acc, curr) => acc + (curr.stock || 0), 0);
    const metricStockEl = document.getElementById('metric-stock');
    if (metricStockEl) metricStockEl.textContent = totalStock;

    const now = new Date();
    const currentMonthSales = sales.filter(s => {
      const sDate = new Date(s.order.created_at);
      return sDate.getMonth() === now.getMonth() && sDate.getFullYear() === now.getFullYear();
    }).length;
    const metricSalesEl = document.getElementById('metric-sales');
    if (metricSalesEl) metricSalesEl.textContent = currentMonthSales;

    const pendingOrders = sales.filter(s => s.order.status === 'paid' || s.order.status === 'preparing').length;
    const metricOrdersEl = document.getElementById('metric-orders');
    if (metricOrdersEl) metricOrdersEl.textContent = pendingOrders;

    // Calculate and populate Rating and Last Order on desktop
    const metricLastOrderEl = document.getElementById('metric-last-order');
    if (metricLastOrderEl) {
      if (sales && sales.length > 0) {
        const sortedSales = [...sales].sort((a, b) => new Date(b.order.created_at).getTime() - new Date(a.order.created_at).getTime());
        const latestSale = sortedSales[0];
        const prodName = latestSale.product?.name || 'Producto';
        const orderDate = new Date(latestSale.order.created_at).toLocaleDateString(i18next.language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short' });
        metricLastOrderEl.textContent = `${prodName} — ${orderDate}`;
      } else {
        metricLastOrderEl.textContent = i18next.t('artisan.noneYet');
      }
    }

    const metricRatingEl = document.getElementById('metric-rating');
    if (metricRatingEl) {
      if (sales && sales.length > 0) {
        const reviewCount = Math.max(1, Math.round(sales.length * 0.75));
        const reviewText = reviewCount > 1 ? i18next.t('artisan.reviewsSuffix') : i18next.t('artisan.reviewSuffix');
        metricRatingEl.innerHTML = `4.8 <i class="fa-solid fa-star" style="color:var(--color-primary-light);"></i> (${reviewCount} ${reviewText})`;
      } else {
        metricRatingEl.innerHTML = `5.0 <i class="fa-solid fa-star" style="color:var(--color-primary-light);"></i> (0 ${i18next.t('artisan.reviewsSuffix')})`;
      }
    }

    // Update profile completeness card
    updateProfileCompleteness(sales, products);

    // Compile dynamic notifications list
    const notifList = document.getElementById('notifications-list');
    const headerNotifCount = document.getElementById('header-notif-count');
    const tabNotifCount = document.getElementById('tab-notif-count');
    
    let notifications = [];

    const hasFrontDoc = !!artisanProfile?.id_document_front_url;
    const hasBackDoc = !!artisanProfile?.id_document_back_url;

    if (!hasFrontDoc || !hasBackDoc) {
      notifications.push({
        type: 'danger',
        icon: 'fa-id-card',
        title: i18next.t('artisan.notifIdMissingTitle', { defaultValue: 'Cédula Faltante' }),
        text: i18next.t('artisan.notifIdMissingText', { defaultValue: 'Por favor edita tu perfil y sube tu documento de identidad para verificación legal.' })
      });
    } else {
      if (artisanProfile?.verification_status === 'verified') {
        notifications.push({
          type: 'success',
          icon: 'fa-circle-check',
          title: i18next.t('artisan.notifVerifiedTitle', { defaultValue: 'Perfil Verificado' }),
          text: i18next.t('artisan.notifVerifiedText', { defaultValue: 'Tu cuenta de artesano ha sido certificada por el equipo de Art Huila. ¡Ya puedes vender!' })
        });
      } else if (artisanProfile?.verification_status === 'pending') {
        notifications.push({
          type: 'warning',
          icon: 'fa-clock',
          title: i18next.t('artisan.notifPendingTitle', { defaultValue: 'Verificación Pendiente' }),
          text: i18next.t('artisan.notifPendingText', { defaultValue: 'Tu perfil está en revisión. Subir tu cédula acelera este proceso.' })
        });
      }
    }

    const outOfStockProducts = products ? products.filter(p => (p.stock || 0) === 0) : [];
    if (outOfStockProducts.length > 0) {
      outOfStockProducts.forEach(p => {
        notifications.push({
          type: 'danger',
          icon: 'fa-triangle-exclamation',
          title: i18next.t('artisan.notifNoStockTitle', { defaultValue: 'Sin Stock' }),
          text: i18next.t('artisan.notifNoStockText', { name: p.name, defaultValue: `El producto "${p.name}" se encuentra agotado. Repón stock lo antes posible.` })
        });
      });
    }

    if (pendingOrders > 0) {
      notifications.push({
        type: 'warning',
        icon: 'fa-truck-ramp-box',
        title: i18next.t('artisan.notifPendingOrdersTitle', { defaultValue: 'Pedidos Pendientes' }),
        text: i18next.t('artisan.notifPendingOrdersText', { count: pendingOrders, defaultValue: `Tienes ${pendingOrders} pedido(s) listos para preparar. Revisa la sección de ventas.` })
      });
    }

    const galleryCount = artisanProfile?.gallery?.length || 0;
    if (galleryCount === 0) {
      notifications.push({
        type: 'info',
        icon: 'fa-images',
        title: i18next.t('artisan.notifEmptyGalleryTitle', { defaultValue: 'Galería Vacía' }),
        text: i18next.t('artisan.notifEmptyGalleryText', { defaultValue: 'Añade fotos de tu taller en "Mi perfil" para atraer más compradores y certificar tu arte.' })
      });
    }

    if (notifications.length === 0) {
      if (headerNotifCount) {
        headerNotifCount.textContent = '0';
        headerNotifCount.classList.add('hidden');
      }
      if (tabNotifCount) {
        tabNotifCount.textContent = '0';
        tabNotifCount.classList.add('hidden');
      }
      notifList.innerHTML = `
        <div class="notifications-empty">
          <i class="fa-regular fa-bell-slash fa-2x" style="opacity:0.3;margin-bottom:0.5rem;display:block;"></i>
          ${i18next.t('artisan.noNotifications', { defaultValue: 'No tienes notificaciones' })}
        </div>
      `;
    } else {
      if (headerNotifCount) {
        headerNotifCount.textContent = notifications.length;
        headerNotifCount.classList.remove('hidden');
      }
      if (tabNotifCount) {
        tabNotifCount.textContent = notifications.length;
        tabNotifCount.classList.remove('hidden');
      }
      notifList.innerHTML = notifications.map(n => `
        <div class="notification-item notif-${n.type}">
          <div class="notif-icon"><i class="fa-solid ${n.icon}"></i></div>
          <div class="notif-body">
            <h5 class="notif-title">${n.title}</h5>
            <p class="notif-text">${n.text}</p>
          </div>
        </div>
      `).join('');
    }

  } catch (e) {
    console.error('Error updating tasks and metrics:', e);
  }
}

function updateProfileCompleteness(sales, products) {
  if (!artisanProfile) return;

  const hasHistory = !!artisanProfile.cultural_history && artisanProfile.cultural_history.trim().length > 0;
  const hasCategory = !!artisanProfile.category;
  const hasAvatar = !!artisanProfile.avatar_url;
  const galleryCount = artisanProfile.gallery?.length || 0;
  const hasGallery = galleryCount >= 1;
  const hasIdDocs = !!artisanProfile.id_document_front_url && !!artisanProfile.id_document_back_url;

  let completedItemsCount = 0;
  if (hasHistory) completedItemsCount++;
  if (hasCategory) completedItemsCount++;
  if (hasAvatar) completedItemsCount++;
  if (hasGallery) completedItemsCount++;
  if (hasIdDocs) completedItemsCount++;

  const percentage = Math.round((completedItemsCount / 5) * 100);

  const card = document.getElementById('profile-completeness-card');

  if (percentage === 100) {
    if (card) card.classList.add('hidden');
  } else {
    if (card) card.classList.remove('hidden');

    const bar = document.getElementById('profile-completeness-bar');
    const text = document.getElementById('profile-completeness-percentage');
    if (bar) bar.style.width = `${percentage}%`;
    if (text) text.textContent = `${percentage}%`;

    // Only show PENDING items, hide completed items
    updateCompletenessRow('row-history', 'badge-history', 'link-history', hasHistory);
    updateCompletenessRow('row-technique', 'badge-technique', 'link-technique', hasCategory);
    updateCompletenessRow('row-avatar', 'badge-avatar', 'link-avatar', hasAvatar);
    
    const labelGallery = document.getElementById('label-gallery');
    if (labelGallery) {
      labelGallery.textContent = i18next.t('artisan.rowGalleryLabel', { current: galleryCount, total: 10 });
    }
    updateCompletenessRow('row-gallery', 'badge-gallery', 'link-gallery', hasGallery);
    updateCompletenessRow('row-id', 'badge-id', 'link-id', hasIdDocs);
  }
}

function updateCompletenessRow(rowId, badgeId, linkId, isComplete) {
  const row = document.getElementById(rowId);
  const badge = document.getElementById(badgeId);
  const link = document.getElementById(linkId);

  if (!row || !badge) return;

  if (isComplete) {
    row.style.display = 'none'; // Hide completed item completely!
  } else {
    row.style.display = 'flex'; // Show pending item!
    badge.textContent = i18next.t('artisan.statusPendiente');
    badge.className = 'status-badge badge-pending';
    if (link) {
      link.style.display = 'inline-block';
    }
  }
}

window.enableProfileEdit = function() {
  document.getElementById('profile-full-name').removeAttribute('disabled');
  document.getElementById('profile-id-number').removeAttribute('disabled');
  document.getElementById('profile-category').removeAttribute('disabled');
  document.getElementById('profile-region').removeAttribute('disabled');

  document.getElementById('profile-history-text').classList.add('hidden');
  document.getElementById('profile-history').classList.remove('hidden');
  
  document.getElementById('avatar-edit-controls').classList.remove('hidden');
  document.getElementById('gallery-edit-controls').classList.remove('hidden');
  document.getElementById('doc-front-edit-controls').classList.remove('hidden');
  document.getElementById('doc-back-edit-controls').classList.remove('hidden');
  document.getElementById('profile-declaracion-wrap').style.display = 'flex';
  
  document.getElementById('profile-save-controls').classList.remove('hidden');
  document.getElementById('profile-save-controls').style.display = 'flex';
  document.getElementById('btn-edit-profile').classList.add('hidden');
};

window.disableProfileEdit = function() {
  document.getElementById('profile-full-name').setAttribute('disabled', 'true');
  document.getElementById('profile-id-number').setAttribute('disabled', 'true');
  document.getElementById('profile-category').setAttribute('disabled', 'true');
  document.getElementById('profile-region').setAttribute('disabled', 'true');

  document.getElementById('profile-history-text').classList.remove('hidden');
  document.getElementById('profile-history').classList.add('hidden');
  
  document.getElementById('avatar-edit-controls').classList.add('hidden');
  document.getElementById('gallery-edit-controls').classList.add('hidden');
  document.getElementById('doc-front-edit-controls').classList.add('hidden');
  document.getElementById('doc-back-edit-controls').classList.add('hidden');
  document.getElementById('profile-declaracion-wrap').style.display = 'none';
  
  document.getElementById('profile-save-controls').classList.add('hidden');
  document.getElementById('profile-save-controls').style.display = '';
  document.getElementById('btn-edit-profile').classList.remove('hidden');
};

window.saveProfile = async function() {
  const btn = document.querySelector('#profile-save-controls .btn-primary');
  btn.disabled = true; btn.textContent = i18next.t('common.saving');
  try {
    const full_name = document.getElementById('profile-full-name').value;
    const id_number = document.getElementById('profile-id-number').value;
    const category_id = document.getElementById('profile-category').value;
    const region_id = document.getElementById('profile-region').value;
    const cultural_history = document.getElementById('profile-history').value;
    const truthfulness_declaration = document.getElementById('profile-declaracion').checked;

    if (!truthfulness_declaration) {
      showToast(i18next.t('register.errorMustAcceptDeclaration'), 'warning');
      btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-check"></i> <span data-i18n="artisan.saveProfileBtn">${i18next.t('artisan.saveProfileBtn')}</span>`;
      return;
    }

    await apiFetch('/artisans/me', {
      method: 'POST',
      body: JSON.stringify({
        full_name,
        id_number,
        category_id,
        region_id,
        cultural_history,
        truthfulness_declaration: true
      })
    });
    
    showToast(i18next.t('artisan.toastProfileUpdated'), 'success');
    loadProfile();
    disableProfileEdit();
  } catch (e) { 
    showToast(e.message, 'error'); 
  }
  btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-check"></i> <span data-i18n="artisan.saveProfileBtn">${i18next.t('artisan.saveProfileBtn')}</span>`;
};

window.uploadAvatar = async function() {
  const fileInput = document.getElementById('avatar-input');
  if (!fileInput.files.length) return showToast(i18next.t('artisan.errorSelectImageFirst'), 'warning');
  try {
    showToast(i18next.t('artisan.uploadingAvatar'), 'info');
    const formData = new FormData();
    formData.append('image', fileInput.files[0]);
    const res = await fetch(`${API}/artisans/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${Auth.getToken()}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || i18next.t('artisan.errorUploadingAvatar'));
    document.getElementById('avatar-preview').innerHTML = `<img src="${data.avatar_url}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;"/>`;
    showToast(i18next.t('artisan.toastAvatarUpdated'), 'success');
    loadProfile();
  } catch(e) { 
    showToast(e.message, 'error'); 
  }
};

window.uploadDocumentFront = async function() {
  const fileInput = document.getElementById('doc-front-input');
  if (!fileInput.files.length) return showToast(i18next.t('artisan.errorSelectImageFirst'), 'warning');
  try {
    showToast(i18next.t('common.processing'), 'info');
    const formData = new FormData();
    formData.append('document', fileInput.files[0]);
    const res = await fetch(`${API}/artisans/me/document-front`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${Auth.getToken()}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error');
    showToast(i18next.t('artisan.toastProfileUpdated'), 'success');
    loadProfile();
  } catch(e) { 
    showToast(e.message, 'error'); 
  }
};

window.uploadDocumentBack = async function() {
  const fileInput = document.getElementById('doc-back-input');
  if (!fileInput.files.length) return showToast(i18next.t('artisan.errorSelectImageFirst'), 'warning');
  try {
    showToast(i18next.t('common.processing'), 'info');
    const formData = new FormData();
    formData.append('document', fileInput.files[0]);
    const res = await fetch(`${API}/artisans/me/document-back`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${Auth.getToken()}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Error');
    showToast(i18next.t('artisan.toastProfileUpdated'), 'success');
    loadProfile();
  } catch(e) { 
    showToast(e.message, 'error'); 
  }
};

window.uploadGallery = async function() {
  const fileInput = document.getElementById('gallery-input');
  if (!fileInput.files.length) return showToast(i18next.t('artisan.errorSelectImageFirst'), 'warning');
  try {
    showToast(i18next.t('artisan.uploadingGallery'), 'info');
    const formData = new FormData();
    for (let f of fileInput.files) formData.append('images', f);
    const res = await fetch(`${API}/artisans/me/gallery`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${Auth.getToken()}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || i18next.t('artisan.errorUploadingGallery'));
    showToast(i18next.t('artisan.toastGalleryUpdated'), 'success');
    loadProfile();
  } catch(e) { 
    showToast(e.message, 'error'); 
  }
};

function badgeStatus(s) {
  const map = { pending: 'badge-pending', verified: 'badge-verified', rejected: 'badge-rejected', suspended: 'badge-suspended' };
  const labels = { pending: `<i class="fa-solid fa-hourglass-half"></i> ${i18next.t('order.statusPending')}`, verified: `<i class="fa-solid fa-check"></i> ${i18next.t('catalog.verifiedStatus')}`, rejected: `<i class="fa-solid fa-xmark"></i> ${i18next.t('catalog.rejectedStatus')}`, suspended: `<i class="fa-solid fa-ban"></i> Suspendido` };
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
  const shortDesc = document.getElementById('p-short-desc').value || '';
  const materials = document.getElementById('p-materials').value || '';
  const dimensions = document.getElementById('p-dimensions').value || '';
  const weight = document.getElementById('p-weight').value || '';
  const care = document.getElementById('p-care').value || '';
  const isHandmade = document.getElementById('p-handmade').checked;
  
  box.classList.remove('hidden');
  box.innerHTML = `
    <h3 style="font-family:'Crimson Pro',serif;font-size:1.3rem;margin-bottom:0.5rem;">${i18next.t('artisan.previewTitle', { name })}</h3>
    <div style="font-size:1.4rem;font-weight:700;color:var(--color-primary);margin-bottom:0.75rem;">${formatPrice(parseFloat(price))}</div>
    ${shortDesc ? `<p style="font-style:italic;margin-bottom:0.75rem;">${shortDesc}</p>` : ''}
    <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1rem;font-size:0.85rem;color:var(--color-muted);">
      ${isHandmade ? `<span class="badge badge-verified">${i18next.t('artisan.previewHandmade', { defaultValue: 'Hecho a mano' })}</span>` : ''}
      ${materials ? `<span>${i18next.t('artisan.previewMaterials')}${materials}</span>` : ''}
      ${dimensions ? `<span>${i18next.t('artisan.previewDimensions')}${dimensions}</span>` : ''}
      ${weight ? `<span>${i18next.t('artisan.previewWeight')}${weight}</span>` : ''}
    </div>
    <div style="font-size:0.85rem;margin-bottom:0.3rem;"><strong>${i18next.t('product.originLabel')}:</strong> ${origin}</div>
    <div style="font-size:0.85rem;margin-bottom:0.3rem;"><strong>${i18next.t('product.techniqueLabel')}:</strong> ${technique}</div>
    <div style="font-size:0.85rem;"><strong>${i18next.t('product.significanceLabel')}:</strong> ${significance}</div>
    ${care ? `<div style="font-size:0.85rem;margin-top:0.3rem;"><strong>${i18next.t('artisan.productCareLabel')}:</strong> ${care}</div>` : ''}
    ${selectedFiles.length > 0 ? `<div style="margin-top:0.75rem;font-size:0.8rem;color:var(--color-muted);">${i18next.t('artisan.previewImagesSelected', { count: selectedFiles.length })}</div>` : ''}
  `;
  box.scrollIntoView({ behavior: 'smooth' });
}

let editingProductId = null;

// Submit product
document.getElementById('product-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  if (artisanProfile?.verification_status !== 'verified') {
    showToast(i18next.t('artisan.errorOnlyVerifiedCanPublish'), 'error'); return;
  }
  
  if (!editingProductId && selectedFiles.length === 0) {
    showToast(i18next.t('artisan.errorAtLeastOneImageRequired'), 'error'); return;
  }

  const btn = document.getElementById('btn-publish');
  btn.disabled = true; btn.textContent = editingProductId ? i18next.t('common.saving') : i18next.t('artisan.publishing');
  
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
      short_description: document.getElementById('p-short-desc').value || null,
      materials: document.getElementById('p-materials').value || null,
      dimensions: document.getElementById('p-dimensions').value || null,
      weight: document.getElementById('p-weight').value || null,
      care_instructions: document.getElementById('p-care').value || null,
      is_handmade: document.getElementById('p-handmade').checked,
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
      await fetch(`${API}/products/${product.id}/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
    }

    showToast(editingProductId ? i18next.t('artisan.toastProductUpdated') : i18next.t('artisan.toastProductPublished'), 'success');
    cancelEdit();
    showSection('mis-productos');
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false; btn.innerHTML = editingProductId ? `<i class="fa-solid fa-check"></i> ${i18next.t('common.save')}` : `<i class="fa-solid fa-check"></i> ${i18next.t('artisan.publishBtn')}`;
  }
});

window.editProduct = async function(slug) {
  showToast(i18next.t('artisan.loadingProduct'), 'info');
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
    document.getElementById('p-short-desc').value = p.short_description || '';
    document.getElementById('p-materials').value = p.materials || '';
    document.getElementById('p-dimensions').value = p.dimensions || '';
    document.getElementById('p-weight').value = p.weight || '';
    document.getElementById('p-care').value = p.care_instructions || '';
    document.getElementById('p-handmade').checked = p.is_handmade !== false;

    selectedFiles = [];
    document.getElementById('img-previews').innerHTML = p.images?.map(img => `
      <div class="image-preview-item">
        <img src="${img.url}" alt="saved-image"/>
      </div>
    `).join('') || '';

    document.getElementById('btn-publish').innerHTML = `<i class="fa-solid fa-check"></i> ${i18next.t('artisan.saveProfileBtn')}`;
    document.querySelector('#section-nuevo-producto h2').innerHTML = `${i18next.t('artisan.editProductHeading')} <button type="button" class="btn btn-ghost btn-sm" onclick="cancelEdit()" style="float:right;">${i18next.t('artisan.cancelEditBtn')}</button>`;
    
    showSection('nuevo-producto');
  } catch(e) {
    showToast(i18next.t('artisan.errorLoadingProductEdit'), 'error');
  }
};

window.cancelEdit = function() {
  editingProductId = null;
  selectedFiles = [];
  document.getElementById('product-form').reset();
  document.getElementById('img-previews').innerHTML = '';
  document.getElementById('preview-box').classList.add('hidden');
  document.getElementById('btn-publish').innerHTML = `<i class="fa-solid fa-check"></i> ${i18next.t('artisan.publishBtn')}`;
  document.querySelector('#section-nuevo-producto h2').textContent = i18next.t('artisan.publishProductHeading');
  document.getElementById('btn-publish').disabled = false;
};

// Dual Panel drawer toggle behaviors with Mobile Overlay Support
window.toggleRightPanel = function() {
  const layout = document.querySelector('.dashboard-layout');
  if (layout) {
    layout.classList.toggle('right-panel-collapsed');
    const overlay = document.getElementById('right-panel-overlay');
    if (overlay) {
      if (layout.classList.contains('right-panel-collapsed')) {
        overlay.classList.remove('open');
      } else {
        overlay.classList.add('open');
      }
    }
  }
};

// Toggle Mobile Menu Drawer
window.toggleMobileMenu = function() {
  const drawer = document.getElementById('mobile-drawer');
  if (drawer) {
    drawer.classList.toggle('open');
  }
};

// Update Mobile Welcome Avatar Circle
window.updateMobileAvatar = function(avatarUrl) {
  const avatarCircle = document.querySelector('.mobile-avatar-circle');
  if (avatarCircle) {
    if (avatarUrl) {
      avatarCircle.innerHTML = `<img src="${avatarUrl}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;"/>`;
    } else {
      avatarCircle.innerHTML = `<img src="/img/artisan-bear.png" alt="Oso Artesano" style="width:100%;height:100%;border-radius:50%;object-fit:cover;"/>`;
    }
  }
};

// Initialize and collapse panel on start
document.addEventListener('DOMContentLoaded', () => {
  const layout = document.querySelector('.dashboard-layout');
  if (layout) {
    layout.classList.add('right-panel-collapsed');
  }
  
  // Toggle sidebar expanded state
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  if (btnToggleSidebar) {
    btnToggleSidebar.addEventListener('click', () => {
      if (layout) {
        layout.classList.toggle('sidebar-expanded');
        const isExpanded = layout.classList.contains('sidebar-expanded');
        btnToggleSidebar.setAttribute('data-tooltip', isExpanded ? 'Contraer menú' : 'Expandir menú');
      }
    });
  }
});

// Init
const urlParams = new URLSearchParams(window.location.search);
const sectionParam = urlParams.get('section');
if (sectionParam) {
  showSection(sectionParam);
} else {
  showSection('resumen');
}

// ── BUYER ORDERS ON ARTISAN DASHBOARD LOGIC ──
let allBuyerOrders = [];
let currentBuyerOrdersPage = 1;
const BUYER_ORDERS_PER_PAGE = 3;

async function loadMyPurchases() {
  const container = document.getElementById('orders-container');
  try {
    allBuyerOrders = await apiFetch('/orders');
    currentBuyerOrdersPage = 1;
    renderBuyerStats();
    renderBuyerOrdersPage();
  } catch (e) {
    container.innerHTML = `<div class="error-msg">${i18next.t('buyer.errorLoadingOrders')}${e.message}</div>`;
  }
}

function renderBuyerStats() {
  const statsContainer = document.getElementById('buyer-stats-container');
  if (!statsContainer) return;

  const totalOrders = allBuyerOrders.length;
  const totalSpent = allBuyerOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

  statsContainer.innerHTML = `
      <div style="display: flex; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 100px; background: white; border: 1.2px solid #ebdcd0; border-radius: 16px; padding: 0.85rem; text-align: center; box-shadow: var(--shadow-xs);">
          <div style="font-size: 1.25rem; font-weight: 800; color: #261f1b; font-family: var(--font-display);">${totalOrders}</div>
          <div style="font-size: 0.62rem; font-weight: 700; color: var(--color-muted); text-transform: uppercase; margin-top: 0.15rem; letter-spacing: 0.03em;">Pedidos</div>
        </div>
        <div style="flex: 1; min-width: 100px; background: white; border: 1.2px solid #ebdcd0; border-radius: 16px; padding: 0.85rem; text-align: center; box-shadow: var(--shadow-xs);">
          <div style="font-size: 1.25rem; font-weight: 800; color: #C84B11; font-family: var(--font-display);">$${Number(totalSpent).toLocaleString('es-CO')}</div>
          <div style="font-size: 0.62rem; font-weight: 700; color: var(--color-muted); text-transform: uppercase; margin-top: 0.15rem; letter-spacing: 0.03em;">Inversión</div>
        </div>
      </div>
  `;
}

function renderBuyerOrdersPage() {
  const container = document.getElementById('orders-container');
  if (allBuyerOrders.length === 0) {
    container.innerHTML = `
        <div class="empty-state" style="text-align:center; padding:3rem 1.5rem;">
            <h3>${i18next.t('buyer.noOrdersTitle') || 'No tienes pedidos'}</h3>
            <p>${i18next.t('buyer.noOrdersDesc') || 'Aún no has realizado ninguna compra.'}</p>
            <a href="/catalogo.html" class="btn btn-primary mt-2">${i18next.t('nav.viewCatalog') || 'Ver catálogo'}</a>
        </div>
    `;
    document.getElementById('buyer-orders-pagination').innerHTML = '';
    return;
  }

  const paginated = allBuyerOrders.slice((currentBuyerOrdersPage - 1) * BUYER_ORDERS_PER_PAGE, currentBuyerOrdersPage * BUYER_ORDERS_PER_PAGE);
  const dateLocale = i18next.language === 'es' ? 'es-CO' : 'en-US';

  container.innerHTML = paginated.map(order => `
      <div class="order-card">
          <div class="order-header">
              <div>
                  <div style="font-weight: bold; font-size:1.05rem; color:var(--color-text);">${i18next.t('buyer.orderIdLabel', { id: order.id.substring(0, 8) })}</div>
                  <div style="font-size: 0.85rem; color: var(--color-muted); margin-top: 0.15rem;">${new Date(order.created_at).toLocaleDateString(dateLocale, { dateStyle: 'medium' })}</div>
              </div>
              <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem;">
                  <span class="badge ${getStatusBadge(order.status)}">${translateStatus(order.status)}</span>
                  <span class="badge ${getPaymentStatusBadge(order.payment_status || 'pending')}">${translatePaymentStatus(order.payment_status || 'pending')}</span>
                  <div style="font-weight: bold; color: var(--color-primary); margin-top: 0.1rem; font-size: 1.1rem;">$${Number(order.total_amount).toLocaleString('es-CO')}</div>
              </div>
          </div>
          <div class="order-items">
              ${order.items.map(item => `
                  <div class="order-item">
                      <img src="${getImageUrl(item.product?.images?.[0]?.url)}" alt="${item.product?.name || i18next.t('buyer.productDeleted')}" />
                      <div style="flex: 1;">
                          <div style="font-weight: 600; font-size:0.95rem;">${item.product?.name || i18next.t('buyer.productDeleted')}</div>
                          <div style="font-size: 0.85rem; color: var(--color-muted); margin-top:0.15rem;">${i18next.t('buyer.quantityLabel') || 'Cantidad: '}${item.quantity} | ${i18next.t('buyer.priceLabel') || 'Precio: '}$${Number(item.unit_price || 0).toLocaleString('es-CO')}</div>
                      </div>
                      ${order.status === 'delivered' && item.product ? `
                          <a href="/producto.html?slug=${item.product.slug}#reviews-section" class="btn btn-ghost btn-sm" style="color:var(--color-primary); border: 1px solid var(--color-primary); border-radius:4px;">${i18next.t('buyer.rateBtn') || 'Calificar'}</a>
                      ` : ''}
                  </div>
              `).join('')}
          </div>
          ${order.tracking_number ? `
              <div style="display: flex; align-items: center; gap: 0.4rem; margin-top: 0.65rem; margin-bottom: 0.25rem; background: #faf8f5; border: 1.2px solid #ebdcd0; border-radius: 8px; padding: 0.4rem 0.65rem; width: fit-content; box-shadow: var(--shadow-xs);">
                  <span style="font-size: 0.72rem; font-weight: 700; color: #4a3e35; font-family: var(--font-body);"><i class="fa-solid fa-truck" style="color:#C84B11; margin-right: 0.15rem;"></i> Guía: <code style="font-family: monospace; font-size: 0.78rem; font-weight: 800; color: #261f1b;">${order.tracking_number}</code></span>
                  <button onclick="event.stopPropagation(); navigator.clipboard.writeText('${order.tracking_number}'); showToast('Guía copiada', 'success')" style="background: none; border: none; color: #64748b; font-size: 0.75rem; cursor: pointer; padding: 0.15rem; display: flex; align-items: center;" title="Copiar guía"><i class="fa-regular fa-copy"></i></button>
              </div>
          ` : ''}
          <div class="order-footer" style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--color-border); padding-top:0.85rem; margin-top:0.85rem;">
              <span style="font-size:0.85rem; color:var(--color-muted); font-weight:500;">${order.items.reduce((sum, i) => sum + i.quantity, 0)} artículos</span>
              <a href="/pedido-detalle.html?id=${order.id}" class="btn btn-outline btn-sm" style="padding:0.4rem 0.8rem; font-size:0.8rem; display:inline-flex; align-items:center; gap:0.35rem; font-weight:600; border-color:var(--color-primary); color:var(--color-primary);">${i18next.t('buyer.viewDetailBtn') || 'Ver detalle'}</a>
          </div>
      </div>
  `).join('');

  renderPaginationControls(allBuyerOrders.length);
}

function renderPaginationControls(totalItems) {
  const container = document.getElementById('buyer-orders-pagination');
  if (!container) return;

  if (totalItems <= BUYER_ORDERS_PER_PAGE) {
    container.innerHTML = '';
    return;
  }

  const totalPages = Math.ceil(totalItems / BUYER_ORDERS_PER_PAGE);

  container.innerHTML = `
      <div class="pagination-info">
          Página <strong>${currentBuyerOrdersPage}</strong> de <strong>${totalPages}</strong> (${totalItems} pedidos)
      </div>
      <div class="pagination-buttons">
          <button class="pagination-btn" ${currentBuyerOrdersPage === 1 ? 'disabled' : ''} onclick="changeBuyerOrdersPage(${currentBuyerOrdersPage - 1})">
              <i class="fa-solid fa-chevron-left"></i> Anterior
          </button>
          <button class="pagination-btn" ${currentBuyerOrdersPage === totalPages ? 'disabled' : ''} onclick="changeBuyerOrdersPage(${currentBuyerOrdersPage + 1})">
              Siguiente <i class="fa-solid fa-chevron-right"></i>
          </button>
      </div>
  `;
}

window.changeBuyerOrdersPage = function(page) {
  currentBuyerOrdersPage = page;
  renderBuyerOrdersPage();
};

function getImageUrl(url) {
  if (!url) return '/img/placeholder.jpg';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

function getStatusBadge(status) {
  const map = {
      'pending': 'badge-pending',
      'paid': 'badge-paid',
      'preparing': 'badge-preparing',
      'shipped': 'badge-shipped',
      'delivered': 'badge-delivered',
      'cancelled': 'badge-cancelled'
  };
  return map[status] || '';
}

function translateStatus(status) {
  return i18next.t(`order.status${status.charAt(0).toUpperCase() + status.slice(1)}`);
}

function getPaymentStatusBadge(status) {
  return status === 'paid' ? 'badge-paid' : 'badge-pending';
}

function translatePaymentStatus(status) {
  return status === 'paid' ? i18next.t('order.paymentPaid') : i18next.t('order.paymentPending');
}
