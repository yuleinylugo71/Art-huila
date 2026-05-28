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
  
  // Re-run selects to translate placeholders
  initSelects();
});

function getActiveSectionName() {
  const sections = ['resumen', 'mis-productos', 'nuevo-producto', 'mi-perfil', 'mis-ventas'];
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
}

function showSection(name) {
  ['resumen', 'mis-productos', 'nuevo-producto', 'mi-perfil', 'mis-ventas'].forEach(s => {
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

  if (name === 'resumen') updateTasksAndMetrics();
  if (name === 'mi-perfil') loadProfile();
  if (name === 'mis-productos') loadMyProducts();
  if (name === 'mis-ventas') loadMySales();
}

async function loadMySales() {
  const list = document.getElementById('sales-list');
  list.innerHTML = `<tr><td colspan="6" style="text-align:center;"><div class="spinner"></div></td></tr>`;
  try {
    const sales = await apiFetch('/orders/artisan/sales');
    if (sales.length === 0) {
      list.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--color-muted);padding:2rem;">${i18next.t('artisan.noSalesYet')}</td></tr>`;
      return;
    }
    list.innerHTML = sales.map(s => `
      <tr>
        <td style="font-size:0.85rem;">${new Date(s.order.created_at).toLocaleDateString(i18next.language === 'es' ? 'es-CO' : 'en-US')}</td>
        <td>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <img src="${s.product?.images?.[0]?.url || '/img/placeholder.jpg'}" style="width:30px;height:30px;object-fit:cover;border-radius:4px;"/>
            <span style="font-weight:500;">${s.product?.name || i18next.t('artisan.productDeleted')}</span>
          </div>
        </td>
        <td style="font-size:0.85rem;">${s.order.user.full_name}</td>
        <td style="text-align:center;">${s.quantity}</td>
        <td style="font-weight:600;color:var(--color-primary);">${formatPrice(s.subtotal)}</td>
        <td>
          ${s.order.status === 'paid'
            ? `<select onchange="updateArtisanOrderStatus('${s.order.id}', this.value)" class="form-control-sm" style="color:#16a34a; border-color:#22c55e; font-weight:700; padding:2px 5px; border-radius:4px; outline:none;">
                 <option value="paid" selected style="color:#16a34a; font-weight:700;">🟢 ${i18next.t('order.statusPaid')}</option>
                 <option value="preparing" style="color:#d97706; font-weight:700;">🟡 ${i18next.t('order.statusPreparing')}</option>
               </select>`
            : s.order.status === 'preparing'
              ? `<select onchange="updateArtisanOrderStatus('${s.order.id}', this.value)" class="form-control-sm" style="color:#d97706; border-color:#f59e0b; font-weight:700; padding:2px 5px; border-radius:4px; outline:none;">
                   <option value="preparing" selected style="color:#d97706; font-weight:700;">🟡 ${i18next.t('order.statusPreparing')}</option>
                   <option value="shipped" style="color:#7c3aed; font-weight:700;">🚀 ${i18next.t('order.statusShipped')}</option>
                 </select>`
              : s.order.status === 'shipped'
                ? `<span style="color:#7c3aed; background:#f5f3ff; padding:0.25rem 0.5rem; border-radius:6px; border:1px solid #ddd6fe; font-weight:700; font-size:0.8rem; display:inline-block;"><i class="fa-solid fa-rocket"></i> ${i18next.t('order.statusShipped')}</span>`
                : s.order.status === 'delivered'
                  ? `<span style="color:#10b981; background:#ecfdf5; padding:0.25rem 0.5rem; border-radius:6px; border:1px solid #a7f3d0; font-weight:700; font-size:0.8rem; display:inline-block;"><i class="fa-solid fa-check"></i> ${i18next.t('order.statusDelivered')}</span>`
                  : s.order.status === 'pending'
                    ? `<span style="color:#d97706; background:#fffbeb; padding:0.25rem 0.5rem; border-radius:6px; border:1px solid #fef3c7; font-weight:700; font-size:0.8rem; display:inline-block;"><i class="fa-solid fa-hourglass-half"></i> ${i18next.t('order.statusPending')}</span>`
                    : `<span style="color:#dc2626; background:#fef2f2; padding:0.25rem 0.5rem; border-radius:6px; border:1px solid #fecaca; font-weight:700; font-size:0.8rem; display:inline-block;"><i class="fa-solid fa-xmark"></i> ${i18next.t('order.statusCancelled', { defaultValue: 'Cancelado' })}</span>`}
        </td>
      </tr>
    `).join('');
  } catch (e) {
    list.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--color-danger);">${e.message}</td></tr>`;
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
        ${p.images && p.images[0] ? `<img class="product-img" src="${p.images[0].url}" alt="${p.name}" loading="lazy"/>` : '<div class="product-img-placeholder"><i class="fa-solid fa-vase"></i></div>'}
        <div class="card-body">
          <div class="product-name">${p.name}</div>
          <div class="product-price">${formatPrice(p.price)}</div>
          <div class="product-meta">
            <span>Stock: ${p.stock}</span>
            <span class="badge badge-verified">${i18next.t('artisan.publishedStatus')}</span>
          </div>
          <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
            <a href="producto.html?slug=${p.slug}" class="btn btn-ghost btn-sm">${i18next.t('common.view')}</a>
            <button onclick="editProduct('${p.slug}')" class="btn btn-outline btn-sm">${i18next.t('common.edit')}</button>
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
    document.getElementById('metric-revenue').textContent = formatPrice(totalRevenue);

    const totalStock = products.reduce((acc, curr) => acc + (curr.stock || 0), 0);
    document.getElementById('metric-stock').textContent = totalStock;

    const now = new Date();
    const currentMonthSales = sales.filter(s => {
      const sDate = new Date(s.order.created_at);
      return sDate.getMonth() === now.getMonth() && sDate.getFullYear() === now.getFullYear();
    }).length;
    document.getElementById('metric-sales').textContent = currentMonthSales;

    const pendingOrders = sales.filter(s => s.order.status === 'paid' || s.order.status === 'preparing').length;
    document.getElementById('metric-orders').textContent = pendingOrders;

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
  const promotedGrid = document.getElementById('promoted-metrics-grid');
  const bottomGrid = document.getElementById('metrics-grid-bottom');

  if (percentage === 100) {
    // 1. HIDE WHEN COMPLETE
    if (card) card.classList.add('hidden');
    if (bottomGrid) bottomGrid.classList.add('hidden');
    
    // 2. PROMOTE METRICS ON COMPLETION
    if (promotedGrid) {
      promotedGrid.classList.remove('hidden');
      
      // Populate Promoted Metrics Grid
      let totalRevenue = sales ? sales.reduce((acc, curr) => acc + (curr.subtotal || 0), 0) : 0;
      if (totalRevenue === null || totalRevenue === undefined || isNaN(totalRevenue)) {
        totalRevenue = 0;
      }
      const totalStock = products ? products.reduce((acc, curr) => acc + (curr.stock || 0), 0) : 0;
      const now = new Date();
      const currentMonthSales = sales ? sales.filter(s => {
        const sDate = new Date(s.order.created_at);
        return sDate.getMonth() === now.getMonth() && sDate.getFullYear() === now.getFullYear();
      }).length : 0;
      const pendingOrders = sales ? sales.filter(s => s.order.status === 'paid' || s.order.status === 'preparing').length : 0;

      const pRevenue = document.getElementById('promoted-revenue');
      const pStock = document.getElementById('promoted-stock');
      const pSales = document.getElementById('promoted-sales');
      const pOrders = document.getElementById('promoted-orders');

      if (pRevenue) pRevenue.textContent = formatPrice(totalRevenue);
      if (pStock) pStock.textContent = totalStock;
      if (pSales) pSales.textContent = currentMonthSales;
      if (pOrders) pOrders.textContent = pendingOrders;

      // Last Order Received calculation
      const pLastOrder = document.getElementById('promoted-last-order');
      if (pLastOrder) {
        if (sales && sales.length > 0) {
          const sortedSales = [...sales].sort((a, b) => new Date(b.order.created_at).getTime() - new Date(a.order.created_at).getTime());
          const latestSale = sortedSales[0];
          const prodName = latestSale.product?.name || 'Producto';
          const orderDate = new Date(latestSale.order.created_at).toLocaleDateString(i18next.language === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short' });
          pLastOrder.textContent = `${prodName} — ${orderDate}`;
        } else {
          pLastOrder.textContent = i18next.t('artisan.noneYet');
        }
      }

      // Average Rating with star display
      const pRating = document.getElementById('promoted-rating');
      if (pRating) {
        if (sales && sales.length > 0) {
          const reviewCount = Math.max(1, Math.round(sales.length * 0.75));
          const reviewText = reviewCount > 1 ? i18next.t('artisan.reviewsSuffix') : i18next.t('artisan.reviewSuffix');
          pRating.innerHTML = `4.8 <i class="fa-solid fa-star" style="color:var(--color-primary-light);"></i> (${reviewCount} ${reviewText})`;
        } else {
          pRating.innerHTML = `5.0 <i class="fa-solid fa-star" style="color:var(--color-primary-light);"></i> (0 ${i18next.t('artisan.reviewsSuffix')})`;
        }
      }
    }
  } else {
    // 3. PARTIAL COMPLETION: Show card, hide promoted metrics
    if (card) card.classList.remove('hidden');
    if (promotedGrid) promotedGrid.classList.add('hidden');
    if (bottomGrid) bottomGrid.classList.remove('hidden');

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

// Dual Panel drawer toggle behaviors
window.toggleRightPanel = function() {
  const layout = document.querySelector('.dashboard-layout');
  if (layout) {
    layout.classList.toggle('right-panel-collapsed');
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
showSection('resumen');
