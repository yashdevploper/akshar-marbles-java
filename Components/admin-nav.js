(function () {
  function getCurrentPage() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('admin-inventory.html')) return 'inventory';
    if (path.includes('admin-pricing-discounts.html')) return 'pricing';
    if (path.includes('admin-customers.html')) return 'customers';
    if (path.includes('admin-logistics.html')) return 'logistics';
    return 'dashboard';
  }

  function getBreadcrumbConfig(page) {
    switch (page) {
      case 'inventory':
        return [
          { label: 'Dashboard', href: 'admin-dashboard.html' },
          { label: 'Catalogue', href: 'admin-inventory.html' },
          { label: 'Inventory Management', href: null }
        ];
      case 'pricing':
        return [
          { label: 'Dashboard', href: 'admin-dashboard.html' },
          { label: 'Catalogue', href: 'admin-pricing-discounts.html' },
          { label: 'Pricing & Discounts', href: null }
        ];
      case 'customers':
        return [
          { label: 'Dashboard', href: 'admin-dashboard.html' },
          { label: 'Operations', href: 'admin-customers.html' },
          { label: 'Customer Management', href: null }
        ];
      case 'logistics':
        return [
          { label: 'Dashboard', href: 'admin-dashboard.html' },
          { label: 'Operations', href: 'admin-logistics.html' },
          { label: 'Logistics & Delivery', href: null }
        ];
      default:
        return null;
    }
  }

  function enforceAuth() {
    // Check if AksharAuth is available
    if (window.AksharAuth && typeof window.AksharAuth.guardAdminPage === 'function') {
      window.AksharAuth.guardAdminPage();
    } else {
      // Fallback check
      try {
        const data = localStorage.getItem('akshar_auth_user');
        const user = data ? JSON.parse(data) : null;
        if (!user || user.role !== 'admin') {
          const current = window.location.pathname.split('/').pop() || 'admin-dashboard.html';
          window.location.replace(`admin-login.html?redirect=${encodeURIComponent(current)}`);
        }
      } catch (e) {
        // Continue if local storage is restricted
      }
    }
  }

  function navIcon(name) {
    const icons = {
      brand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m4.5 7.5 7.5 4 7.5-4M12 11.5V21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
      dashboard: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="13.5" y="3.5" width="7" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="3.5" y="13.5" width="7" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="13.5" y="13.5" width="7" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
      inventory: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 7 8-4 8 4-8 4-8-4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m4 12 8 4 8-4M4 17l8 4 8-4M12 11v5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
      pricing: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 13.5 13.5 20.5a2 2 0 0 1-2.8 0L3.5 13.3V4.5h8.8l7.2 7.2a1.8 1.8 0 0 1 1 1.8Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="7.5" cy="8.5" r="1.2" fill="currentColor"/></svg>',
      customers: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM16 4.2a3.5 3.5 0 0 1 0 6.6M16.5 15a3.5 3.5 0 0 1 3.5 3.5V20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
      logistics: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5h11v10H3zM14 10h3.5l3.5 3.5v3H14z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="7" cy="18.5" r="1.8" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="18" cy="18.5" r="1.8" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
      reports: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19.5V4.5M4 19.5h17M8 16v-3M12 16V8M16 16v-6M20 16v-9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      storefront: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8M19 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      more: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/></svg>',
      logout: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-3M10 12h10M17 8l3 4-3 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    };
    return icons[name] || '';
  }

  function setupAdminSidebar() {
    const aside = document.querySelector('aside');
    if (!aside) return;

    aside.innerHTML = `
      <div class="brand"><span class="brand-logo-icon">${navIcon('brand')}</span><span class="brand-copy">Akshar Marbles<small>ADMIN CONSOLE</small></span></div>
      <div class="admin-nav-links">
      <p>OVERVIEW</p>
      <a href="admin-dashboard.html"><span class="admin-nav-icon">${navIcon('dashboard')}</span><span>Dashboard</span></a>
      <p>CATALOGUE</p>
      <a href="admin-inventory.html"><span class="admin-nav-icon">${navIcon('inventory')}</span><span>Inventory</span></a>
      <a href="admin-pricing-discounts.html"><span class="admin-nav-icon">${navIcon('pricing')}</span><span>Pricing &amp; Discounts</span></a>
      <p>OPERATIONS</p>
      <a href="admin-customers.html"><span class="admin-nav-icon">${navIcon('customers')}</span><span>Customers</span></a>
      <a href="admin-logistics.html"><span class="admin-nav-icon">${navIcon('logistics')}</span><span>Logistics</span></a>
      <a href="admin-dashboard.html#reports"><span class="admin-nav-icon">${navIcon('reports')}</span><span>Reports</span></a>
      </div>
      <div class="admin-storefront-section">
        <a href="home.html" target="_blank" class="admin-storefront-link" title="Open client storefront in new tab">
          <span class="admin-nav-icon">${navIcon('storefront')}</span><span>View Storefront</span>
        </a>
      </div>
      <div class="profile interactive-profile" title="Account Menu">
        <img src="assets/avatar-rajan.svg" alt="Rajan Mehta" style="width:34px;height:34px;border-radius:50%;object-fit:cover;">
        <span><b>Rajan Mehta</b><small>Super Admin</small></span>
        <span class="more-dots">${navIcon('more')}</span>
      </div>
    `;

    const page = getCurrentPage();

    // 1. Update link active states
    const links = aside.querySelectorAll('a');
    links.forEach((a) => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      a.classList.remove('on');

      if (page === 'dashboard' && href === 'admin-dashboard.html') {
        a.classList.add('on');
      } else if (page === 'inventory' && href.includes('admin-inventory.html')) {
        a.classList.add('on');
      } else if (page === 'pricing' && href.includes('admin-pricing-discounts.html')) {
        a.classList.add('on');
      } else if (page === 'customers' && href.includes('admin-customers.html')) {
        a.classList.add('on');
      } else if (page === 'logistics' && href.includes('admin-logistics.html')) {
        a.classList.add('on');
      }

      // If Reports link is '#', point to dashboard reports section
      if (href === '#' && a.textContent.includes('Reports')) {
        a.setAttribute('href', 'admin-dashboard.html#reports');
      }
    });

    // 2. Make Profile Interactive with Logout Dropdown
    const profile = aside.querySelector('.profile');
    if (profile && !profile.querySelector('.admin-profile-dropdown')) {
      profile.classList.add('interactive-profile');
      profile.setAttribute('title', 'Click to open account menu');
      profile.style.cursor = 'pointer';

      // Dropdown markup
      const dropdown = document.createElement('div');
      dropdown.className = 'admin-profile-dropdown';
      dropdown.id = 'admin-profile-dropdown';
      dropdown.innerHTML = `
        <div class="dropdown-header">
          <b>Rajan Mehta</b>
          <small>Super Administrator</small>
        </div>
        <a href="home.html" target="_blank"><span class="admin-nav-icon">${navIcon('storefront')}</span><span>View Storefront</span></a>
        <div class="dropdown-divider"></div>
        <button type="button" id="admin-logout-btn" class="dropdown-logout-btn">
          <span class="admin-nav-icon">${navIcon('logout')}</span><span>Sign Out</span>
        </button>
      `;
      profile.appendChild(dropdown);

      profile.addEventListener('click', function (e) {
        if (e.target.closest('#admin-logout-btn')) return;
        dropdown.classList.toggle('open');
      });

      document.addEventListener('click', function (e) {
        if (!profile.contains(e.target)) {
          dropdown.classList.remove('open');
        }
      });

      const logoutBtn = dropdown.querySelector('#admin-logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
          e.preventDefault();
          if (window.AksharAuth) {
            window.AksharAuth.logout('admin-login.html');
          } else {
            localStorage.removeItem('akshar_auth_user');
            window.location.href = 'admin-login.html';
          }
        });
      }
    }
  }

  function setupAdminHeader() {
    const header = document.querySelector('.admin-header, main header');
    if (!header) return;

    // Check if mobile hamburger button exists
    if (!header.querySelector('.admin-mobile-toggle')) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'admin-mobile-toggle';
      toggle.id = 'admin-mobile-toggle';
      toggle.setAttribute('aria-label', 'Toggle admin sidebar navigation');
      toggle.innerHTML = '<span></span><span></span><span></span>';

      // Prepend to header
      header.insertBefore(toggle, header.firstChild);

      // Create backdrop
      let backdrop = document.getElementById('admin-sidebar-backdrop');
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'admin-sidebar-backdrop';
        backdrop.className = 'admin-sidebar-backdrop';
        document.body.appendChild(backdrop);
      }

      function toggleSidebar() {
        const isOpen = document.body.classList.toggle('admin-sidebar-open');
        toggle.classList.toggle('open', isOpen);
      }

      function closeSidebar() {
        document.body.classList.remove('admin-sidebar-open');
        toggle.classList.remove('open');
      }

      toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        toggleSidebar();
      });

      backdrop.addEventListener('click', closeSidebar);

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          closeSidebar();
        }
      });
    }
  }

  function setupBreadcrumbs() {
    const page = getCurrentPage();
    const config = getBreadcrumbConfig(page);
    if (!config) return;

    const main = document.querySelector('main.admin-main, main');
    const header = document.querySelector('.admin-header, main header');
    if (!main || !header) return;

    if (!main.querySelector('.admin-breadcrumbs')) {
      const nav = document.createElement('nav');
      nav.className = 'admin-breadcrumbs';
      nav.setAttribute('aria-label', 'Breadcrumb navigation');

      let html = '';
      config.forEach((crumb, idx) => {
        if (idx > 0) {
          html += ' <span class="crumb-separator">›</span> ';
        }
        if (crumb.href) {
          html += `<a href="${crumb.href}">${crumb.label}</a>`;
        } else {
          html += `<span class="active-crumb">${crumb.label}</span>`;
        }
      });

      nav.innerHTML = html;
      header.insertAdjacentElement('afterend', nav);
    }
  }

  function initAdminNav() {
    enforceAuth();
    setupAdminSidebar();
    setupAdminHeader();
    setupBreadcrumbs();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminNav);
  } else {
    initAdminNav();
  }
})();
