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

function initPage() {
    loadOrders();
    loadProfileData();
    updateNavCart();
}

function loadProfileData() {
    const user = Auth.getUser();
    document.getElementById('info-full-name').textContent = user.full_name;
    document.getElementById('info-email').textContent = user.email;
    document.getElementById('edit-full-name').value = user.full_name;
    document.getElementById('edit-email').value = user.email;
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

    const body = { full_name };
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
        renderBuyerOrdersPage();
    } catch (e) {
        container.innerHTML = `<div class="error-msg">${i18next.t('buyer.errorLoadingOrders')}${e.message}</div>`;
    }
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
                <div style="text-align: right;">
                    <span class="badge ${getStatusBadge(order.status)}">${translateStatus(order.status)}</span>
                    <div style="font-weight: bold; color: var(--color-primary); margin-top: 0.35rem; font-size: 1.1rem;">$${Number(order.total_amount).toLocaleString('es-CO')}</div>
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

window.showTab = function(tabName) {
    document.getElementById('tab-orders').style.display = tabName === 'orders' ? 'block' : 'none';
    document.getElementById('tab-profile').style.display = tabName === 'profile' ? 'block' : 'none';
    
    // Update active class in menu
    const links = document.querySelectorAll('.sidebar-menu a');
    links.forEach(l => l.classList.remove('active'));
    if (tabName === 'orders') {
        document.getElementById('menu-link-orders')?.classList.add('active');
    } else {
        document.getElementById('menu-link-profile')?.classList.add('active');
    }
}

function updateNavCart() {
    const cart = Cart.get();
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    const badge = document.getElementById('nav-cart-count');
    if (badge) {
        badge.textContent = `Carrito (${count})`;
    }
    // Also try to update the translated static cart in navbar if available
    const navCartSpan = document.querySelector('[data-i18n="cart.navbarCart"]');
    if (navCartSpan) {
        navCartSpan.textContent = count > 0 ? i18next.t('cart.navbarCartWithTotal', { count }) : i18next.t('cart.navbarCart');
    }
}
