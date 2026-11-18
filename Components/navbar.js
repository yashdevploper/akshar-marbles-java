/**
 * Unified Client Navigation Bar Component for Akshar Marbles
 * Provides role-aware navigation, active link state, user profile dropdowns, and responsive mobile menu.
 */
(function () {
  /**
   * Determine relative path to the Components folder based on current document location
   */
  function getComponentPath() {
    const scripts = document.getElementsByTagName('script');
    for (let s of scripts) {
      const src = s.getAttribute('src') || '';
      if (src.includes('navbar.js')) {
        return src.replace('navbar.js', 'navbar.html');
      }
    }
    return 'Components/navbar.html';
  }

  /**
   * Adjust relative URLs in the injected HTML according to the component base path
   */
  function adjustRelativePaths(container, basePath) {
    const dir = basePath.substring(0, basePath.lastIndexOf('Components/'));
    if (!dir) return; // Already at root

    // If loaded from a subfolder, adjust links and asset sources
    const links = container.querySelectorAll('a[href], img[src]');
    links.forEach(el => {
      if (el.tagName === 'A') {
        const href = el.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('/') && !href.startsWith(dir)) {
          el.setAttribute('href', dir + href);
        }
      } else if (el.tagName === 'IMG') {
        const src = el.getAttribute('src');
        if (src && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith(dir)) {
          el.setAttribute('src', dir + src);
        }
      }
    });
  }

  /**
   * Load and inject the centralized navbar HTML
   */
  async function loadNavbar() {
    const container = document.getElementById('site-navbar');
    if (!container) {
      // If there's an existing static store-header, initialize it directly
      if (document.querySelector('.store-header')) {
        initNavbar();
      }
      return;
    }

    const componentUrl = getComponentPath();

    try {
      const response = await fetch(componentUrl);
      if (!response.ok) {
        throw new Error(`Failed to load navbar HTML: status ${response.status}`);
      }
      const htmlText = await response.text();
      container.innerHTML = htmlText;
      adjustRelativePaths(container, componentUrl);
    } catch (err) {
      console.warn('Navbar dynamic load error (file:// protocol or network restriction):', err);
      // Graceful fallback: container remains empty or untouched without breaking the page
    }

    // Initialize navbar listeners, active states, auth dropdowns
    initNavbar();
  }
  function detectCurrentPage() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('browse.html')) return 'browse';
    if (path.includes('product.html')) return 'product';
    if (path.includes('orders.html')) return 'orders';
    if (path.includes('cart.html')) return 'cart';
    if (path.includes('login.html')) return 'login';
    if (path.includes('register.html')) return 'register';
    return 'home';
  }

  function getAuthUser() {
    if (window.AksharAuth && typeof window.AksharAuth.getUser === 'function') {
      return window.AksharAuth.getUser();
    }
    try {
      const data = localStorage.getItem('akshar_auth_user');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  function renderAuthAction(user) {
    if (!user) {
      return `
        <a href="login.html" class="btn-header-signin">
          <span>👤</span> Sign In
        </a>
      `;
    }

    if (user.role === 'admin') {
      return `
        <a href="admin-dashboard.html" class="btn-admin-portal-link" title="Open Admin Console">
          <span>⚙</span> Admin Console
        </a>
        <div class="user-menu-wrapper" id="store-user-menu">
          <button type="button" class="user-profile-btn" id="user-menu-toggle" aria-expanded="false" aria-label="Account menu">
            <img src="${user.avatar || 'assets/avatar-rajan.svg'}" alt="${user.name}">
            <span>${user.name ? user.name.split(' ')[0] : 'Admin'}</span>
            <span class="caret">▾</span>
          </button>
          <div class="user-dropdown-menu" id="user-menu-dropdown">
            <div class="user-dropdown-header">
              <b>${user.name || 'Super Admin'}</b>
              <small>Administrator</small>
            </div>
            <a href="admin-dashboard.html">◔ Admin Dashboard</a>
            <a href="admin-inventory.html">▱ Inventory Management</a>
            <a href="admin-logistics.html">▣ Logistics &amp; Orders</a>
            <a href="browse.html">💎 Browse Collection</a>
            <div class="dropdown-divider"></div>
            <button type="button" id="header-logout-btn" class="dropdown-logout-btn">
              🚪 Sign Out
            </button>
          </div>
        </div>
      `;
    }

    // Default Client User
    const firstName = user.name ? user.name.split(' ')[0] : 'Customer';
    return `
      <div class="user-menu-wrapper" id="store-user-menu">
        <button type="button" class="user-profile-btn" id="user-menu-toggle" aria-expanded="false" aria-label="Account menu">
          <img src="${user.avatar || 'assets/avatar-ananya.svg'}" alt="${user.name}">
          <span>${firstName}</span>
          <span class="caret">▾</span>
        </button>
        <div class="user-dropdown-menu" id="user-menu-dropdown">
          <div class="user-dropdown-header">
            <b>${user.name || 'Ananya Sharma'}</b>
            <small>${user.tier || 'VIP Gold Member'}</small>
          </div>
          <a href="orders.html">📦 My Orders (#ORD-7820)</a>
          <a href="cart.html">🛒 Shopping Cart (3 items)</a>
          <a href="browse.html">💎 Browse Collection</a>
          <div class="dropdown-divider"></div>
          <a href="admin-login.html" class="admin-switch-link" style="color:var(--m); font-size:12px;">
            ⚙ Admin Portal
          </a>
          <button type="button" id="header-logout-btn" class="dropdown-logout-btn">
            🚪 Sign Out
          </button>
        </div>
      </div>
    `;
  }

  function getMobileDrawerHTML(activePage, user) {
    const isHome = activePage === 'home';
    const isBrowse = activePage === 'browse' || activePage === 'product';
    const isOrders = activePage === 'orders';
    const isCart = activePage === 'cart';

    let authSection = '';
    if (user) {
      authSection = `
        <div class="user-dropdown-header" style="padding:0 0 10px; margin-bottom:8px;">
          <b>${user.name}</b>
          <small>${user.role === 'admin' ? 'Administrator' : (user.tier || 'Customer')}</small>
        </div>
        ${user.role === 'admin' ? '<a href="admin-dashboard.html" style="font-weight:600; color:var(--g);">⚙ Admin Dashboard</a>' : ''}
        <button type="button" id="mobile-logout-btn" class="dropdown-logout-btn" style="padding:10px 0; border:0; background:transparent; font-size:14px; cursor:pointer; text-align:left;">
          🚪 Sign Out
        </button>
      `;
    } else {
      authSection = `
        <a href="login.html" class="btn-header-signin" style="justify-content:center; width:100%;">
          <span>👤</span> Sign In
        </a>
        <a href="admin-login.html" style="font-size:12px; color:var(--m); text-align:center; padding:6px 0;">
          Administrator Sign In →
        </a>
      `;
    }

    return `
      <div class="mobile-nav-backdrop" id="mobile-nav-backdrop"></div>
      <div class="mobile-nav-drawer" id="mobile-nav-drawer">
        <div class="mobile-drawer-header">
          <a href="home.html" class="store-brand" style="margin:0;">
            <div class="brand-icon" style="width:30px; height:30px; font-size:15px;">◆</div>
            <div class="brand-name" style="font-size:15px;">
              Akshar Marbles
            </div>
          </a>
          <button type="button" class="mobile-drawer-close" id="mobile-drawer-close" aria-label="Close menu">✕</button>
        </div>
        <div class="mobile-drawer-links">
          <a href="home.html" class="${isHome ? 'active' : ''}">🏠 Home</a>
          <a href="browse.html" class="${isBrowse ? 'active' : ''}">💎 Browse Collection</a>
          <a href="orders.html" class="${isOrders ? 'active' : ''}">📦 Track Orders</a>
          <a href="cart.html" class="${isCart ? 'active' : ''}">🛒 Shopping Cart (3)</a>
        </div>
        <div class="mobile-drawer-auth">
          ${authSection}
        </div>
      </div>
    `;
  }

  function initNavbar() {
    const activePage = detectCurrentPage();
    const user = getAuthUser();
    const header = document.querySelector('.store-header');

    if (!header) return;

    // 1. Update navigation links active state
    const navLinks = header.querySelectorAll('.store-nav a');
    navLinks.forEach((link) => {
      const href = (link.getAttribute('href') || '').toLowerCase();
      link.classList.remove('active');
      if (
        (activePage === 'home' && href.includes('home.html')) ||
        ((activePage === 'browse' || activePage === 'product') && href.includes('browse.html')) ||
        (activePage === 'orders' && href.includes('orders.html'))
      ) {
        link.classList.add('active');
      }
    });

    // 2. Update Cart icon button active state
    const cartBtn = header.querySelector('.cart-btn-round');
    if (cartBtn) {
      if (activePage === 'cart') {
        cartBtn.classList.add('active');
      } else {
        cartBtn.classList.remove('active');
      }
    }

    // 3. Update auth actions in header
    const actionsContainer = header.querySelector('.store-header-actions');
    if (actionsContainer) {
      // Find and replace the existing sign in button or user profile button
      const existingAuth = actionsContainer.querySelector('.btn-header-signin, .user-profile-btn, .user-menu-wrapper, .btn-admin-portal-link');
      if (existingAuth) {
        // Remove existing auth elements (if any were duplicated)
        actionsContainer.querySelectorAll('.btn-header-signin, .user-profile-btn, .user-menu-wrapper, .btn-admin-portal-link').forEach(el => el.remove());
      }
      
      // Append the dynamic auth element
      const authWrap = document.createElement('div');
      authWrap.style.display = 'inline-flex';
      authWrap.style.alignItems = 'center';
      authWrap.style.gap = '10px';
      authWrap.innerHTML = renderAuthAction(user);
      actionsContainer.appendChild(authWrap);

      // Add mobile hamburger toggle if not present
      if (!actionsContainer.querySelector('.mobile-nav-toggle')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'mobile-nav-toggle';
        toggleBtn.id = 'mobile-nav-toggle';
        toggleBtn.setAttribute('aria-label', 'Toggle mobile navigation');
        toggleBtn.innerHTML = '<span></span><span></span><span></span>';
        actionsContainer.appendChild(toggleBtn);
      }
    }

    // 4. Inject mobile drawer into document body if not present
    let mobileDrawer = document.getElementById('mobile-nav-drawer');
    if (!mobileDrawer) {
      const drawerContainer = document.createElement('div');
      drawerContainer.innerHTML = getMobileDrawerHTML(activePage, user);
      document.body.appendChild(drawerContainer);
    }

    // 5. Setup Event Listeners
    setupEvents();
  }

  function setupEvents() {
    // Desktop user dropdown toggle
    const userToggle = document.getElementById('user-menu-toggle');
    const userMenuWrapper = document.getElementById('store-user-menu');

    if (userToggle && userMenuWrapper) {
      userToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        const isOpen = userMenuWrapper.classList.toggle('open');
        userToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    }

    // Close user dropdown on click outside
    document.addEventListener('click', function (e) {
      if (userMenuWrapper && !userMenuWrapper.contains(e.target)) {
        userMenuWrapper.classList.remove('open');
        if (userToggle) userToggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Logout handling
    const logoutBtn = document.getElementById('header-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (window.AksharAuth) {
          window.AksharAuth.logout('home.html');
        } else {
          localStorage.removeItem('akshar_auth_user');
          window.location.href = 'home.html';
        }
      });
    }

    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener('click', function (e) {
        e.preventDefault();
        if (window.AksharAuth) {
          window.AksharAuth.logout('home.html');
        } else {
          localStorage.removeItem('akshar_auth_user');
          window.location.href = 'home.html';
        }
      });
    }

    // Mobile drawer toggle
    const mobileToggle = document.getElementById('mobile-nav-toggle');
    const drawer = document.getElementById('mobile-nav-drawer');
    const backdrop = document.getElementById('mobile-nav-backdrop');
    const closeBtn = document.getElementById('mobile-drawer-close');

    function openMobileMenu() {
      if (drawer && backdrop && mobileToggle) {
        drawer.classList.add('open');
        backdrop.classList.add('open');
        mobileToggle.classList.add('open');
        document.body.style.overflow = 'hidden';
      }
    }

    function closeMobileMenu() {
      if (drawer && backdrop && mobileToggle) {
        drawer.classList.remove('open');
        backdrop.classList.remove('open');
        mobileToggle.classList.remove('open');
        document.body.style.overflow = '';
      }
    }

    if (mobileToggle) {
      mobileToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        if (drawer && drawer.classList.contains('open')) {
          closeMobileMenu();
        } else {
          openMobileMenu();
        }
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeMobileMenu);
    if (backdrop) backdrop.addEventListener('click', closeMobileMenu);

    // Close menus on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (userMenuWrapper) {
          userMenuWrapper.classList.remove('open');
          if (userToggle) userToggle.setAttribute('aria-expanded', 'false');
        }
        closeMobileMenu();
      }
    });
  }

  // Auto-init on DOM ready
  async function start() {
    await loadNavbar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  // Re-run if auth state changes
  window.addEventListener('akshar:auth-change', initNavbar);
})();
