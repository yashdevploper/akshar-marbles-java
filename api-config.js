/**
 * Centralized API Configuration & Fetch Wrapper for Akshar Marbles
 */
(function (global) {
  'use strict';

  // Determine base URL: works on root context '/' or any sub-path context
  const getContextPath = () => {
    // In root context, context path is ""
    return '';
  };

  const API_CONFIG = {
    BASE_URL: getContextPath() + '/api',
    TIMEOUT_MS: 15000,
    ENDPOINTS: {
      HEALTH: '/health',
      CATEGORIES: '/categories',
      PRODUCTS: '/products',
      PRODUCT_DETAIL: (idOrCode) => `/products/${encodeURIComponent(idOrCode)}`,
      AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout',
        ME: '/auth/me'
      },
      ADMIN_AUTH: {
        LOGIN: '/admin/auth/login',
        LOGOUT: '/admin/auth/logout',
        ME: '/admin/auth/me'
      },
      CART: '/cart',
      CART_ITEMS: '/cart/items',
      CART_ITEM: (id) => `/cart/items/${encodeURIComponent(id)}`,
      WISHLIST: '/wishlist',
      WISHLIST_PRODUCT: (productId) => `/wishlist/${encodeURIComponent(productId)}`,
      ADDRESSES: '/addresses',
      ORDERS: '/orders',
      ORDER_DETAIL: (id) => `/orders/${encodeURIComponent(id)}`,
      ADMIN: {
        DASHBOARD: '/admin/dashboard',
        INVENTORY: '/admin/inventory',
        PRICING: (id) => `/admin/pricing/${encodeURIComponent(id)}`,
        DISCOUNTS: '/admin/discounts',
        CUSTOMERS: '/admin/customers',
        SHIPMENTS: '/admin/shipments'
      }
    }
  };

  /**
   * Universal fetch wrapper with standard error extraction, JSON parsing,
   * credential passing (cookies), and CSRF header support.
   */
  async function apiFetch(endpoint, options = {}) {
    const url = endpoint.startsWith('http') || endpoint.startsWith('/') 
      ? (endpoint.startsWith('/api') ? endpoint : API_CONFIG.BASE_URL + endpoint.replace(/^\/?api/, ''))
      : `${API_CONFIG.BASE_URL}/${endpoint.replace(/^\//, '')}`;

    const headers = {
      'Accept': 'application/json',
      ...(options.headers || {})
    };

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    // Attach CSRF token if stored
    const csrfToken = sessionStorage.getItem('akshar_csrf_token') || localStorage.getItem('akshar_csrf_token');
    if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes((options.method || 'GET').toUpperCase())) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const fetchConfig = {
      ...options,
      headers,
      credentials: options.credentials || 'same-origin'
    };

    try {
      const response = await fetch(url, fetchConfig);

      // Handle empty responses (e.g. 204 No Content)
      if (response.status === 204) {
        return { success: true };
      }

      let payload = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        payload = await response.json();
      } else {
        const text = await response.text();
        try {
          payload = JSON.parse(text);
        } catch (_) {
          payload = { message: text };
        }
      }

      if (!response.ok) {
        const err = new Error(
          (payload && payload.error && payload.error.message) ||
          (payload && payload.message) ||
          `Request failed with status ${response.status}`
        );
        err.status = response.status;
        err.code = (payload && payload.error && payload.error.code) || 'API_ERROR';
        err.fields = (payload && payload.error && payload.error.fields) || null;
        err.payload = payload;
        throw err;
      }

      // Check if server returned standard envelope { success, data, message }
      if (payload && typeof payload === 'object' && Object.prototype.hasOwnProperty.call(payload, 'data')) {
        return payload.data;
      }

      return payload;
    } catch (error) {
      if (!error.status) {
        error.code = 'NETWORK_ERROR';
      }
      throw error;
    }
  }

  // Catalogue API helpers
  const CatalogueAPI = {
    async getCategories() {
      return await apiFetch(API_CONFIG.ENDPOINTS.CATEGORIES);
    },
    async getProducts(params = {}) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          query.set(key, val);
        }
      });
      const qs = query.toString();
      const endpoint = qs ? `${API_CONFIG.ENDPOINTS.PRODUCTS}?${qs}` : API_CONFIG.ENDPOINTS.PRODUCTS;
      return await apiFetch(endpoint);
    },
    async getAllActiveProducts() {
      return await apiFetch(`${API_CONFIG.ENDPOINTS.PRODUCTS}/all`);
    },
    async getProduct(idOrCode) {
      return await apiFetch(API_CONFIG.ENDPOINTS.PRODUCT_DETAIL(idOrCode));
    }
  };

  global.API_CONFIG = API_CONFIG;
  global.apiFetch = apiFetch;
  global.CatalogueAPI = CatalogueAPI;

})(window);
