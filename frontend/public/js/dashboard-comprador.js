document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireRole('comprador')) return;
  loadUserProfile();
  loadOrders();
});

function loadUserProfile() {
  const user = Auth.getUser();
  if (user) {
    document.getElementById('user-name').textContent = user.full_name;
    document.getElementById('user-email').textContent = user.email;
  }
}

async function loadOrders() {
  const container = document.getElementById('orders-container');
  try {
    const orders = await apiFetch('/orders');
    
    if (orders.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="emoji">📦</div><h3>No has realizado pedidos</h3><p>Explora el catálogo y apoya a nuestros artesanos.</p><a href="/catalogo.html" class="btn btn-primary mt-2">Ver Catálogo</a></div>';
      return;
    }

    container.innerHTML = orders.map(order => `
      <div class="order-card">
        <div class="order-header">
          <div>
            <div style="font-weight: 600; margin-bottom: 0.2rem;">Pedido #${order.id.slice(0,8)}</div>
            <div style="font-size: 0.85rem; color: var(--color-muted);">${new Date(order.created_at).toLocaleDateString('es-CO')}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 1.2rem; font-weight: bold; color: var(--color-primary);">$${Number(order.total_amount).toLocaleString('es-CO')}</div>
            <div>${getStatusBadge(order.status)}</div>
          </div>
        </div>
        <div class="order-items">
          ${order.items.map(item => `
            <div class="order-item">
              <img src="${normalizeImage(item.product?.images?.[0]?.url)}" alt="${item.product?.name || 'Producto'}">
              <div>
                <div style="font-weight: 600;">${item.product?.name || 'Producto eliminado'}</div>
                <div style="font-size: 0.85rem; color: var(--color-muted);">Artesano: ${item.product?.artisan?.user?.full_name || 'N/A'}</div>
                <div style="font-size: 0.85rem; margin-top: 0.2rem;">${item.quantity} x $${Number(item.unit_price).toLocaleString('es-CO')}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `).join('');

  } catch (error) {
    container.innerHTML = `<div class="alert alert-error">Error al cargar pedidos: ${error.message}</div>`;
  }
}

function getStatusBadge(status) {
  const map = {
    'pending': '<span class="badge badge-pending">Pendiente</span>',
    'paid': '<span class="badge badge-verified">Pagado</span>',
    'shipped': '<span class="badge badge-primary">Enviado</span>',
    'delivered': '<span class="badge" style="background:#2ecc71;color:white;">Entregado</span>',
    'cancelled': '<span class="badge" style="background:#e74c3c;color:white;">Cancelado</span>',
  };
  return map[status] || `<span class="badge">${status}</span>`;
}

function normalizeImage(url) {
  if (!url) return '/img/placeholder.jpg';
  if (url.startsWith('http')) return url;
  return API_URL + (url.startsWith('/') ? '' : '/') + url;
}

window.showTab = function(tabName) {
  document.getElementById('tab-orders').style.display = tabName === 'orders' ? 'block' : 'none';
  document.getElementById('tab-profile').style.display = tabName === 'profile' ? 'block' : 'none';
  
  document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
  event.target.classList.add('active');
};
