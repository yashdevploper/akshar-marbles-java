/**
 * Authentication & Role-Based Access Control Module for Akshar Marbles
 * Manages user sessions, role enforcement, and post-login redirects.
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AksharAuth = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  const STORAGE_KEY = 'akshar_auth_user';

  function pageUrl(name) {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('/admin/')) {
      if (name === 'index.html') return '../index.html';
      if (name.startsWith('admin-')) return name;
      return `../pages/${name}`;
    }
    if (path.includes('/pages/')) {
      if (name === 'index.html') return '../index.html';
      if (name.startsWith('admin-')) return `../admin/${name}`;
      return name;
    }
    if (name === 'index.html') return 'index.html';
    if (name.startsWith('admin-')) return `admin/${name}`;
    return `pages/${name}`;
  }

  // Standard demo users for the application
  const DEMO_USERS = {
    client: {
      id: 'CUS-00142',
      name: 'Ananya Sharma',
      email: 'ananya@email.com',
      role: 'client',
      avatar: 'assets/avatar-ananya.svg',
      phone: '+91 98765 43210',
      tier: 'VIP Gold'
    },
    admin: {
      id: 'ADM-00001',
      name: 'Rajan Mehta',
      email: 'rajan@aksharmarbles.com',
      role: 'admin',
      avatar: 'assets/avatar-rajan.svg',
      title: 'Super Admin'
    }
  };

  function getUser() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('LocalStorage access error:', e);
      return null;
    }
  }

  function setUser(user) {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      window.dispatchEvent(new CustomEvent('akshar:auth-change', { detail: user }));
    } catch (e) {
      console.warn('LocalStorage write error:', e);
    }
  }

  function login(identifier, role) {
    let user;
    const lower = (identifier || '').toLowerCase();

    // Determine role from input or explicit param
    if (role === 'admin' || lower.includes('admin') || lower === 'rajan@aksharmarbles.com') {
      user = Object.assign({}, DEMO_USERS.admin);
      if (identifier && identifier.includes('@')) {
        user.email = identifier;
      }
    } else {
      user = Object.assign({}, DEMO_USERS.client);
      if (identifier && identifier.includes('@')) {
        user.email = identifier;
      }
    }

    setUser(user);

    // Return the designated post-login landing page
    if (user.role === 'admin') {
      return pageUrl('admin-dashboard.html');
    } else {
      return pageUrl('browse.html');
    }
  }

  function logout(redirectUrl) {
    const user = getUser();
    const wasAdmin = user && user.role === 'admin';
    setUser(null);

    if (redirectUrl) {
      window.location.href = redirectUrl;
    } else if (wasAdmin) {
      window.location.href = pageUrl('admin-login.html');
    } else {
      window.location.href = pageUrl('index.html');
    }
  }

  function getCurrentFileName() {
    const path = window.location.pathname;
    const file = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
    return file.toLowerCase();
  }

  function guardAdminPage() {
    const user = getUser();
    const current = getCurrentFileName();

    // If on admin-login.html and already logged in as admin, redirect to admin dashboard
    if (current === 'admin-login.html') {
      if (user && user.role === 'admin') {
        window.location.replace(pageUrl('admin-dashboard.html'));
      }
      return;
    }

    // Protect all admin management pages
    if (current.startsWith('admin-')) {
      if (!user || user.role !== 'admin') {
        // Redirect to admin login with return path
        const target = encodeURIComponent(current);
        window.location.replace(`${pageUrl('admin-login.html')}?redirect=${target}&reason=unauthorized`);
      }
    }
  }

  function guardClientAuthPage() {
    const user = getUser();
    const current = getCurrentFileName();

    if (current === 'login.html') {
      if (user) {
        if (user.role === 'admin') {
          window.location.replace(pageUrl('admin-dashboard.html'));
        } else {
          window.location.replace(pageUrl('browse.html'));
        }
      }
    }
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    DEMO_USERS: DEMO_USERS,
    getUser: getUser,
    setUser: setUser,
    login: login,
    logout: logout,
    guardAdminPage: guardAdminPage,
    guardClientAuthPage: guardClientAuthPage,
    getCurrentFileName: getCurrentFileName
  };
});

