if (!Auth.getToken()) window.location.href = '/login.html';

const user = Auth.getUser();
document.getElementById('user-name').textContent = user.full_name;
document.getElementById('user-email').textContent = user.email;

let allBuyerOrders = [];
let currentBuyerOrdersPage = 1;
const BUYER_ORDERS_PER_PAGE = 3;

if (window.i18nReadyProcessed) {
    initPage();
} else {
    document.addEventListener('i18nReady', initPage);
}

document.addEventListener('languageChanged', () => {
    loadOrders();
    updateNavCart();
});

async function initPage() {
    loadOrders();
    try {
        const freshUser = await apiFetch('/users/me');
        if (freshUser) {
            localStorage.setItem('art_huila_user', JSON.stringify(freshUser));
        }
    } catch (e) {
        console.error('Error updating profile cache:', e);
    }
    loadProfileData();
    updateNavCart();
}

function loadProfileData() {
    const user = Auth.getUser();
    document.getElementById('info-full-name').textContent = user.full_name || '—';
    document.getElementById('info-email').textContent = user.email || '—';
    document.getElementById('info-phone').textContent = user.phone || '—';
    document.getElementById('info-address').textContent = user.address || '—';
    document.getElementById('info-city').textContent = user.city || '—';
    document.getElementById('info-department').textContent = user.department || '—';

    document.getElementById('edit-full-name').value = user.full_name || '';
    document.getElementById('edit-email').value = user.email || '';
    document.getElementById('edit-phone').value = user.phone || '';
    document.getElementById('edit-address').value = user.address || '';
    document.getElementById('edit-city').value = user.city || '';
    document.getElementById('edit-department').value = user.department || '';
}

window.toggleProfileEdit = function(isEdit) {
    if (isEdit) {
        document.getElementById('profile-view-mode').classList.add('hidden');
        document.getElementById('profile-form').classList.remove('hidden');
    } else {
        document.getElementById('profile-view-mode').classList.remove('hidden');
        document.getElementById('profile-form').classList.add('hidden');
        loadProfileData(); // Reset input fields
    }
};

document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = i18next.t('common.saving');

    const full_name = document.getElementById('edit-full-name').value;
    const password = document.getElementById('edit-password').value;
    const phone = document.getElementById('edit-phone').value;
    const address = document.getElementById('edit-address').value;
    const city = document.getElementById('edit-city').value;
    const department = document.getElementById('edit-department').value;

    const body = { full_name, phone, address, city, department };
    if (password) body.password = password;

    try {
        const updatedUser = await apiFetch('/users/me', {
            method: 'PATCH',
            body: JSON.stringify(body)
        });
        
        // Update local storage and UI
        localStorage.setItem('art_huila_user', JSON.stringify(updatedUser));
        document.getElementById('user-name').textContent = updatedUser.full_name;
        showToast(i18next.t('buyer.toastProfileUpdated'), 'success');
        document.getElementById('edit-password').value = '';
        
        loadProfileData(); // Update all view fields
        toggleProfileEdit(false); // Return to view mode
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});

async function loadOrders() {
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
    const favCount = typeof Wishlist !== 'undefined' ? Wishlist.get().length : 0;

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
          <div style="flex: 1; min-width: 100px; background: white; border: 1.2px solid #ebdcd0; border-radius: 16px; padding: 0.85rem; text-align: center; box-shadow: var(--shadow-xs);">
            <div style="font-size: 1.25rem; font-weight: 800; color: #261f1b; font-family: var(--font-display);">${favCount}</div>
            <div style="font-size: 0.62rem; font-weight: 700; color: var(--color-muted); text-transform: uppercase; margin-top: 0.15rem; letter-spacing: 0.03em;">Favoritos</div>
          </div>
        </div>
    `;
}

function renderBuyerOrdersPage() {
    const container = document.getElementById('orders-container');
    if (allBuyerOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>${i18next.t('buyer.noOrdersTitle')}</h3>
                <p>${i18next.t('buyer.noOrdersDesc')}</p>
                <a href="/catalogo.html" class="btn btn-primary mt-2">${i18next.t('nav.viewCatalog')}</a>
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
                            <div style="font-size: 0.85rem; color: var(--color-muted); margin-top:0.15rem;">${i18next.t('buyer.quantityLabel')}${item.quantity} | ${i18next.t('buyer.priceLabel')}$${Number(item.unit_price || 0).toLocaleString('es-CO')}</div>
                        </div>
                        ${order.status === 'delivered' && item.product ? `
                            <a href="/producto.html?slug=${item.product.slug}#reviews-section" class="btn btn-ghost btn-sm" style="color:var(--color-primary); border: 1px solid var(--color-primary); border-radius:4px;">${i18next.t('buyer.rateBtn')}</a>
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
                <span style="font-size:0.85rem; color:var(--color-muted); font-weight:500;">${order.items.reduce((sum, i) => sum + i.quantity, 0)}${i18next.t('buyer.itemsCountSuffix')}</span>
                <a href="/pedido-detalle.html?id=${order.id}" class="btn btn-outline btn-sm" style="padding:0.4rem 0.8rem; font-size:0.8rem; display:inline-flex; align-items:center; gap:0.35rem; font-weight:600; border-color:var(--color-primary); color:var(--color-primary);">${i18next.t('buyer.viewDetailBtn')}</a>
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
    const map = {
        'pending': i18next.t('order.statusPending'),
        'paid': i18next.t('order.statusPaid'),
        'preparing': i18next.t('order.statusPreparing'),
        'shipped': i18next.t('order.statusShipped'),
        'delivered': i18next.t('order.statusDelivered'),
        'cancelled': i18next.t('order.statusCancelled', { defaultValue: 'Cancelado' })
    };
    return map[status] || status;
}

function getPaymentStatusBadge(status) {
    const map = {
        'pending': 'badge-pending',
        'approved': 'badge-delivered',
        'rejected': 'badge-cancelled',
        'failed': 'badge-cancelled',
        'cancelled': 'badge-cancelled'
    };
    return map[status] || '';
}


window.showTab = function(tabName) {
    document.getElementById('tab-orders').style.display = tabName === 'orders' ? 'block' : 'none';
    document.getElementById('tab-profile').style.display = tabName === 'profile' ? 'block' : 'none';
    document.getElementById('tab-apply').style.display = tabName === 'apply' ? 'block' : 'none';
    
    // Update active class in menu
    const links = document.querySelectorAll('.sidebar-menu a');
    links.forEach(l => l.classList.remove('active'));
    if (tabName === 'orders') {
        document.getElementById('menu-link-orders')?.classList.add('active');
    } else if (tabName === 'profile') {
        document.getElementById('menu-link-profile')?.classList.add('active');
    } else if (tabName === 'apply') {
        document.getElementById('menu-link-apply')?.classList.add('active');
        loadApplyTab();
    }
};

let isCategoriesLoaded = false;
let isRegionsLoaded = false;

async function loadApplyTab() {
    const statusContainer = document.getElementById('apply-status-container');
    const formContainer = document.getElementById('apply-form-container');
    
    statusContainer.style.display = 'none';
    statusContainer.innerHTML = '';
    formContainer.style.display = 'block';

    try {
        const profile = await apiFetch('/artisans/me');
        if (profile) {
            const status = profile.verification_status || profile.status;
            const isEs = i18next.language === 'es';

            if (status === 'pending') {
                formContainer.style.display = 'none';
                statusContainer.style.display = 'block';
                statusContainer.innerHTML = isEs ? `
                    <div class="info-msg" style="background:#fffbeb; border:1.5px solid #fcd34d; border-radius:12px; padding:1.5rem; color:#b45309; display:flex; align-items:center; gap:1rem;">
                        <i class="fa-solid fa-clock-rotate-left" style="font-size:2rem;"></i>
                        <div>
                            <h4 style="margin:0 0 0.25rem 0; font-weight:700;">Solicitud Pendiente de Revisión</h4>
                            <p style="margin:0; font-size:0.9rem;">Tu solicitud para ser artesano se encuentra en estado <strong>Pendiente</strong>. Estamos revisando tus documentos e historia cultural. Te enviaremos un correo cuando sea aprobada.</p>
                        </div>
                    </div>
                ` : `
                    <div class="info-msg" style="background:#fffbeb; border:1.5px solid #fcd34d; border-radius:12px; padding:1.5rem; color:#b45309; display:flex; align-items:center; gap:1rem;">
                        <i class="fa-solid fa-clock-rotate-left" style="font-size:2rem;"></i>
                        <div>
                            <h4 style="margin:0 0 0.25rem 0; font-weight:700;">Application Pending Review</h4>
                            <p style="margin:0; font-size:0.9rem;">Your application to become an artisan is currently <strong>Pending</strong>. We are reviewing your documents and cultural history. We will send you an email once approved.</p>
                        </div>
                    </div>
                `;
                return;
            } else if (status === 'verified' || status === 'active') {
                formContainer.style.display = 'none';
                statusContainer.style.display = 'block';
                statusContainer.innerHTML = isEs ? `
                    <div class="success-msg" style="background:#f0fdf4; border:1.5px solid #86efac; border-radius:12px; padding:1.5rem; color:#15803d; display:flex; align-items:center; gap:1rem; flex-direction:column; align-items:flex-start;">
                        <div style="display:flex; align-items:center; gap:1rem;">
                            <i class="fa-solid fa-circle-check" style="font-size:2rem;"></i>
                            <div>
                                <h4 style="margin:0 0 0.25rem 0; font-weight:700;">¡Solicitud Aprobada!</h4>
                                <p style="margin:0; font-size:0.9rem;">Tu cuenta ha sido promovida a <strong>Artesano</strong>. Por favor cierra sesión e inicia sesión de nuevo para acceder a tu panel de control de artesano.</p>
                            </div>
                        </div>
                        <button onclick="Auth.logout()" class="btn btn-primary" style="margin-top:0.75rem;"><i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesión</button>
                    </div>
                ` : `
                    <div class="success-msg" style="background:#f0fdf4; border:1.5px solid #86efac; border-radius:12px; padding:1.5rem; color:#15803d; display:flex; align-items:center; gap:1rem; flex-direction:column; align-items:flex-start;">
                        <div style="display:flex; align-items:center; gap:1rem;">
                            <i class="fa-solid fa-circle-check" style="font-size:2rem;"></i>
                            <div>
                                <h4 style="margin:0 0 0.25rem 0; font-weight:700;">Application Approved!</h4>
                                <p style="margin:0; font-size:0.9rem;">Your account has been upgraded to <strong>Artisan</strong>. Please log out and log in again to access your artisan dashboard.</p>
                            </div>
                        </div>
                        <button onclick="Auth.logout()" class="btn btn-primary" style="margin-top:0.75rem;"><i class="fa-solid fa-right-from-bracket"></i> Log Out</button>
                    </div>
                `;
                return;
            } else if (status === 'suspended' || status === 'rejected') {
                statusContainer.style.display = 'block';
                const reason = profile.rejection_reason || (isEs ? 'No especificada' : 'Not specified');
                statusContainer.innerHTML = isEs ? `
                    <div class="error-msg" style="background:#fef2f2; border:1.5px solid #fca5a5; border-radius:12px; padding:1.5rem; color:#b91c1c; display:flex; align-items:center; gap:1rem;">
                        <i class="fa-solid fa-circle-xmark" style="font-size:2rem;"></i>
                        <div>
                            <h4 style="margin:0 0 0.25rem 0; font-weight:700;">Solicitud Rechazada / Suspendida</h4>
                            <p style="margin:0; font-size:0.9rem;">Tu solicitud anterior fue rechazada/suspendida. <strong>Razón:</strong> ${reason}. Puedes actualizar y volver a enviar el formulario a continuación.</p>
                        </div>
                    </div>
                ` : `
                    <div class="error-msg" style="background:#fef2f2; border:1.5px solid #fca5a5; border-radius:12px; padding:1.5rem; color:#b91c1c; display:flex; align-items:center; gap:1rem;">
                        <i class="fa-solid fa-circle-xmark" style="font-size:2rem;"></i>
                        <div>
                            <h4 style="margin:0 0 0.25rem 0; font-weight:700;">Application Rejected / Suspended</h4>
                            <p style="margin:0; font-size:0.9rem;">Your previous application was rejected/suspended. <strong>Reason:</strong> ${reason}. You can update and resubmit the form below.</p>
                        </div>
                    </div>
                `;
                
                if (profile.id_number) document.getElementById('apply-id-number').value = profile.id_number;
                if (profile.cultural_history) document.getElementById('apply-cultural-history').value = profile.cultural_history;
            }
        }
    } catch (err) {
        console.error('Error fetching artisan profile:', err);
    }

    await loadCategoriesAndRegions();
}

async function loadCategoriesAndRegions() {
    const categorySelect = document.getElementById('apply-category');
    const regionSelect = document.getElementById('apply-region');

    try {
        if (!isCategoriesLoaded) {
            const categories = await apiFetch('/categories');
            categorySelect.innerHTML = `<option value="" disabled selected>${i18next.t('buyer.selectCategory', { defaultValue: 'Seleccione una categoría' })}</option>`;
            categories.forEach(cat => {
                const nameTranslated = window.translateCategory ? window.translateCategory(cat.name) : cat.name;
                const opt = document.createElement('option');
                opt.value = cat.id;
                opt.textContent = nameTranslated;
                categorySelect.appendChild(opt);
            });
            isCategoriesLoaded = true;
        }

        if (!isRegionsLoaded) {
            const regions = await apiFetch('/regions');
            regionSelect.innerHTML = `<option value="" disabled selected>${i18next.t('buyer.selectRegion', { defaultValue: 'Seleccione su región' })}</option>`;
            regions.forEach(reg => {
                const opt = document.createElement('option');
                opt.value = reg.id;
                opt.textContent = reg.name;
                regionSelect.appendChild(opt);
            });
            isRegionsLoaded = true;
        }
    } catch (err) {
        console.error('Error loading dropdown lists:', err);
    }
}

document.getElementById('apply-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-apply');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = i18next.t('common.sending', { defaultValue: 'Enviando...' });

    const idNumber = document.getElementById('apply-id-number').value;
    const categoryId = document.getElementById('apply-category').value;
    const regionId = document.getElementById('apply-region').value;
    const culturalHistory = document.getElementById('apply-cultural-history').value;
    const truthfulness = document.getElementById('apply-truthfulness').checked;

    const fileFront = document.getElementById('apply-doc-front').files[0];
    const fileBack = document.getElementById('apply-doc-back').files[0];
    const galleryInput = document.getElementById('apply-gallery');

    const formData = new FormData();
    formData.append('id_number', idNumber);
    formData.append('category_id', categoryId);
    formData.append('region_id', regionId);
    formData.append('cultural_history', culturalHistory);
    formData.append('truthfulness_declaration', truthfulness);

    if (fileFront) formData.append('id_document_front', fileFront);
    if (fileBack) formData.append('id_document_back', fileBack);
    
    if (galleryInput.files.length > 0) {
        for (let i = 0; i < galleryInput.files.length; i++) {
            formData.append('gallery', galleryInput.files[i]);
        }
    }

    try {
        await apiFetch('/artisans/apply', {
            method: 'POST',
            body: formData
        });

        showToast(
            i18next.language === 'es' 
                ? 'Solicitud enviada correctamente. Se cerrará la sesión en 5 segundos para actualizar sus permisos.' 
                : 'Application submitted successfully. Logging out in 5 seconds to update your permissions.', 
            'success'
        );

        setTimeout(() => {
            Auth.logout();
        }, 5000);
    } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
});

function updateNavCart() {
    if (typeof Cart !== 'undefined' && Cart.updateNav) {
        Cart.updateNav();
    }
}
