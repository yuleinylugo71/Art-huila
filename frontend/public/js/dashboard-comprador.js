if (!Auth.getToken()) window.location.href = '/login.html';

const user = Auth.getUser();
document.getElementById('user-name').textContent = user.full_name;
document.getElementById('user-email').textContent = user.email;

document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
    loadProfileData();
    updateNavCart();
});

function loadProfileData() {
    const user = Auth.getUser();
    document.getElementById('edit-full-name').value = user.full_name;
    document.getElementById('edit-email').value = user.email;
}

document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Guardando...';

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
        showToast('<i class="fa-solid fa-check"></i> Perfil actualizado correctamente', 'success');
        document.getElementById('edit-password').value = '';
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
});

async function loadOrders() {
    const container = document.getElementById('orders-container');
    try {
        const orders = await apiFetch('/orders');
        if (orders.length === 0) {
            container.innerHTML = '<div class="empty-state"><h3>No has realizado pedidos aún.</h3><p>Explora nuestro catálogo y apoya a los artesanos locales.</p><a href="/catalogo.html" class="btn btn-primary mt-2">Ver catálogo</a></div>';
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <div style="font-weight: bold; font-size:1.05rem; color:var(--color-text);">Pedido #${order.id.substring(0, 8)}</div>
                        <div style="font-size: 0.85rem; color: var(--color-muted); margin-top: 0.15rem;">${new Date(order.created_at).toLocaleDateString('es-CO', { dateStyle: 'medium' })}</div>
                    </div>
                    <div style="text-align: right;">
                        <span class="badge ${getStatusBadge(order.status)}">${translateStatus(order.status)}</span>
                        <div style="font-weight: bold; color: var(--color-primary); margin-top: 0.35rem; font-size: 1.1rem;">$${Number(order.total_amount).toLocaleString('es-CO')}</div>
                    </div>
                </div>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <img src="${getImageUrl(item.product?.images?.[0]?.url)}" alt="${item.product?.name || 'Producto eliminado'}" />
                            <div style="flex: 1;">
                                <div style="font-weight: 600; font-size:0.95rem;">${item.product?.name || 'Producto eliminado'}</div>
                                <div style="font-size: 0.85rem; color: var(--color-muted); margin-top:0.15rem;">Cantidad: ${item.quantity} | Precio: $${Number(item.unit_price || 0).toLocaleString('es-CO')}</div>
                            </div>
                            ${order.status === 'delivered' && item.product ? `
                                <a href="/producto.html?slug=${item.product.slug}#reviews-section" class="btn btn-ghost btn-sm" style="color:var(--color-primary); border: 1px solid var(--color-primary); border-radius:4px;"><i class="fa-solid fa-star"></i> Calificar</a>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="order-footer" style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--color-border); padding-top:0.85rem; margin-top:0.85rem;">
                    <span style="font-size:0.85rem; color:var(--color-muted); font-weight:500;">${order.items.reduce((sum, i) => sum + i.quantity, 0)} artículo(s)</span>
                    <a href="/pedido-detalle.html?id=${order.id}" class="btn btn-outline btn-sm" style="padding:0.4rem 0.8rem; font-size:0.8rem; display:inline-flex; align-items:center; gap:0.35rem; font-weight:600; border-color:var(--color-primary); color:var(--color-primary);"><i class="fa-solid fa-eye"></i> Ver detalle</a>
                </div>
            </div>
        `).join('');
    } catch (e) {
        container.innerHTML = `<div class="error-msg">Error al cargar pedidos: ${e.message}</div>`;
    }
}

function getImageUrl(url) {
    if (!url) return '/img/placeholder.jpg';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `http://localhost:3000${url.startsWith('/') ? '' : '/'}${url}`;
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
        'pending': 'Pendiente',
        'paid': 'Pagado',
        'preparing': 'En preparación',
        'shipped': 'Despachado',
        'delivered': 'Entregado',
        'cancelled': 'Cancelado'
    };
    return map[status] || status;
}

window.showTab = function(tabName) {
    document.getElementById('tab-orders').style.display = tabName === 'orders' ? 'block' : 'none';
    document.getElementById('tab-profile').style.display = tabName === 'profile' ? 'block' : 'none';
    
    // Update active class in menu
    const links = document.querySelectorAll('.sidebar-menu a');
    links.forEach(l => l.classList.remove('active'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    } else {
        // Find link by tabName if no event
        const selector = tabName === 'orders' ? 'Mis Pedidos' : 'Perfil';
        links.forEach(l => { if(l.textContent.includes(selector)) l.classList.add('active'); });
    }
}

function updateNavCart() {
    const cart = Cart.get();
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    const badge = document.getElementById('nav-cart-count');
    if (badge) badge.textContent = `Carrito (${count})`;
}
