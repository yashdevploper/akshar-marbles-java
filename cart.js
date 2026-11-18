(function () {
  const CART_PREFIX = "akshar_cart_";
  const CHECKOUT_KEY = "akshar_checkout";
  const GUEST_SESSION_KEY = "akshar_guest_session";
  const GST_RATE = 0.18;
  const FREE_DELIVERY_THRESHOLD = 25000;

  let PRODUCTS = Object.fromEntries((window.AksharProducts || []).map((product) => [product.id, product]));

  window.addEventListener("akshar:products-loaded", () => {
    PRODUCTS = Object.fromEntries((window.AksharProducts || []).map((product) => [product.id, product]));
  });

  function getUser() {
    return window.AksharAuth && typeof window.AksharAuth.getUser === "function"
      ? window.AksharAuth.getUser()
      : null;
  }

  function getGuestSessionToken() {
    let token = localStorage.getItem(GUEST_SESSION_KEY);
    if (!token) {
      token = (window.crypto && typeof window.crypto.randomUUID === "function")
        ? window.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(GUEST_SESSION_KEY, token);
    }
    return token;
  }

  function getCartIdentifier() {
    const user = getUser();
    const numericCustomerId = Number(user?.id);
    return Number.isInteger(numericCustomerId) && numericCustomerId > 0
      ? { customer_id: numericCustomerId }
      : { session_token: getGuestSessionToken() };
  }

  async function loadDatabaseCart() {
    if (!window.apiFetch) {
      return null;
    }
    const identifier = getCartIdentifier();
    const params = new URLSearchParams(identifier).toString();
    try {
      return await window.apiFetch(`/cart?${params}`);
    } catch (error) {
      console.error("Unable to load cart from database:", error);
      return null;
    }
  }

  async function addDatabaseCartItem(productId, quantity) {
    if (!window.apiFetch) {
      throw new Error("Cart API is unavailable.");
    }
    const body = {
      product_id: Number(productId),
      quantity: Number(quantity),
      ...getCartIdentifier()
    };
    return await window.apiFetch("/cart/items", {
      method: "POST",
      body
    });
  }

  function getStorageKey() {
    const user = getUser();
    return user && user.id ? `${CART_PREFIX}${user.id}` : `${CART_PREFIX}guest`;
  }

  function readCart() {
    try {
      const data = localStorage.getItem(getStorageKey());
      const cart = data ? JSON.parse(data) : [];
      return Array.isArray(cart) ? cart : [];
    } catch (error) {
      console.warn("Cart storage read error:", error);
      return [];
    }
  }

  function writeCart(cart) {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(cart));
      window.dispatchEvent(new CustomEvent("akshar:cart-change"));
    } catch (error) {
      console.warn("Cart storage write error:", error);
    }
  }

  function formatCurrency(value) {
    return `₹${Math.round(value).toLocaleString("en-IN")}`;
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[character]));
  }

  function setCartCount(count) {
    const cartLinks = document.querySelectorAll(".cart-btn-round");
    cartLinks.forEach((link) => {
      link.title = `Cart (${count} ${count === 1 ? "item" : "items"})`;
      link.setAttribute("aria-label", `Cart, ${count} ${count === 1 ? "item" : "items"}`);
    });
  }

  function renderDatabaseCart(cart) {
    const list = document.getElementById("cart-items-list");
    if (!list) {
      return;
    }
    if (!cart.length) {
      list.innerHTML = '<div class="cart-empty-state"><h3>Your cart is empty</h3><p>Add products from our collection to get started.</p></div>';
      setText("summary-subtotal", formatCurrency(0));
      setText("summary-discount", "− ₹0");
      setText("summary-gst", formatCurrency(0));
      setText("summary-delivery", "FREE");
      setText("summary-total", formatCurrency(0));
      setText("cart-page-meta", "0 items · Estimated delivery unavailable");
      return;
    }

    const subtotal = cart.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
    list.innerHTML = cart.map((item) => `
      <article class="cart-item-card" data-cart-id="${escapeHTML(item.id)}">
        <div class="cart-item-main">
          <div class="cart-item-thumb"><img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}"></div>
          <div class="cart-item-details">
            <div class="cart-item-category">Product · ID ${escapeHTML(item.id)}</div>
            <h3 class="cart-item-title">${escapeHTML(item.name)}</h3>
            <div class="cart-qty-stepper-wrap">
              <div class="qty-stepper">
                <span class="qty-display">${item.quantity} sqft</span>
              </div>
            </div>
          </div>
          <div class="cart-item-right">
            <div>
              <div class="cart-item-price-current">${formatCurrency(item.unitPrice * item.quantity)}</div>
            </div>
          </div>
        </div>
      </article>
    `).join("");

    const summaryItems = document.getElementById("summary-items-list");
    if (summaryItems) {
      summaryItems.innerHTML = cart.map((item) =>
        `<div class="summary-row"><span>${escapeHTML(item.name)} (${item.quantity} sqft)</span><b>${formatCurrency(item.unitPrice * item.quantity)}</b></div>`
      ).join("");
    }
    const gst = Math.round(subtotal * GST_RATE);
    setText("cart-page-meta", `${cart.reduce((total, item) => total + item.quantity, 0)} items · Estimated delivery unavailable`);
    setText("summary-subtotal", formatCurrency(subtotal));
    setText("summary-discount", "− ₹0");
    setText("summary-gst", formatCurrency(gst));
    setText("summary-delivery", "FREE");
    setText("summary-total", formatCurrency(subtotal + gst));
  }

  function getProductId(element) {
    const productPageId = new URLSearchParams(window.location.search).get("id");
    if (document.querySelector(".product-detail-grid") && productPageId) {
      return PRODUCTS[productPageId] ? productPageId : null;
    }

    const card = element.closest("[data-id]");
    if (card && PRODUCTS[card.dataset.id]) {
      return card.dataset.id;
    }

    const title = element.closest("article")?.querySelector(".browse-card-title, .product-card-title")?.textContent.trim();
    return Object.values(PRODUCTS).find((product) => product.title === title)?.id || "SKU-0021";
  }

  function addProduct(productId, quantity) {
    const product = PRODUCTS[productId];
    if (!product || product.stock < 1) {
      return;
    }

    const cart = readCart();
    const existing = cart.find((item) => item.id === productId);
    const nextQuantity = Math.min((existing?.quantity || 0) + quantity, product.stock);

    if (existing) {
      existing.quantity = nextQuantity;
    } else {
      cart.push({ id: productId, quantity: Math.min(quantity, product.stock) });
    }
    writeCart(cart);
  }

  function calculateTotals(cart, promo) {
    const subtotal = cart.reduce((total, item) => {
      const product = PRODUCTS[item.id];
      return total + product.price * item.quantity;
    }, 0);
    const itemSavings = cart.reduce((total, item) => {
      const product = PRODUCTS[item.id];
      return total + (product.strikePrice ? product.strikePrice - product.price : 0) * item.quantity;
    }, 0);
    const promoDiscount = promo ? Math.round(subtotal * promo.rate) : 0;
    const taxableTotal = Math.max(0, subtotal - promoDiscount);
    const gst = Math.round(taxableTotal * GST_RATE);
    const delivery = taxableTotal >= FREE_DELIVERY_THRESHOLD ? 0 : 0;

    return {
      subtotal,
      discount: itemSavings + promoDiscount,
      gst,
      delivery,
      total: taxableTotal + gst + delivery
    };
  }

  function getPromo(code, subtotal) {
    const normalized = code.trim().toUpperCase();
    if (normalized === "AKSHAR20") {
      return { code: normalized, rate: 0.2 };
    }
    if (normalized === "MARBLE15") {
      return { code: normalized, rate: 0.15 };
    }
    return null;
  }

  function renderCart() {
    const list = document.getElementById("cart-items-list");
    if (!list) {
      return;
    }

    const cart = readCart().filter((item) => PRODUCTS[item.id]);
    const storedPromoCode = sessionStorage.getItem("akshar_cart_promo") || "";
    const subtotal = cart.reduce((total, item) => total + PRODUCTS[item.id].price * item.quantity, 0);
    const promo = getPromo(storedPromoCode, subtotal);
    if (storedPromoCode && !promo) {
      sessionStorage.removeItem("akshar_cart_promo");
    }
    const totals = calculateTotals(cart, promo);
    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);

    list.innerHTML = cart.length
      ? cart.map(renderCartItem).join("")
      : '<div class="cart-empty-state"><h3>Your cart is empty</h3><p>Add products from our collection to get started.</p></div>';

    const summaryItems = document.getElementById("summary-items-list");
    if (summaryItems) {
      summaryItems.innerHTML = cart.map((item) => {
        const product = PRODUCTS[item.id];
        return `<div class="summary-row"><span>${escapeHTML(product.title)} (${item.quantity} sqft)</span><b>${formatCurrency(product.price * item.quantity)}</b></div>`;
      }).join("");
    }

    setText("cart-page-meta", `${itemCount} ${itemCount === 1 ? "item" : "items"} · Estimated delivery unavailable`);
    setText("summary-subtotal", formatCurrency(totals.subtotal));
    setText("summary-discount", `− ${formatCurrency(totals.discount)}`);
    setText("summary-gst", formatCurrency(totals.gst));
    setText("summary-delivery", totals.delivery ? formatCurrency(totals.delivery) : "FREE");
    setText("summary-total", formatCurrency(totals.total));
    setText("delivery-estimate", "Estimated delivery unavailable");
    setText("delivery-address", getUser()?.address || "Delivery address not saved");

    const promoInput = document.getElementById("promo-code-input");
    if (promoInput && document.activeElement !== promoInput) {
      promoInput.value = promo?.code || "";
      promoInput.setCustomValidity("");
    }

    const checkout = document.getElementById("checkout-button");
    if (checkout) {
      checkout.setAttribute("aria-disabled", String(cart.length === 0));
      checkout.style.pointerEvents = cart.length === 0 ? "none" : "";
      checkout.style.opacity = cart.length === 0 ? "0.55" : "";
    }
  }

  function renderCartItem(item) {
    const product = PRODUCTS[item.id];
    const lineTotal = product.price * item.quantity;
    const savings = product.strikePrice ? (product.strikePrice - product.price) * item.quantity : 0;
    const lowStock = product.stock <= 500;
    return `
      <article class="cart-item-card" data-cart-id="${product.id}">
        <div class="cart-item-main">
          <div class="cart-item-thumb"><img src="${product.image}" alt="${escapeHTML(product.title)}"></div>
          <div class="cart-item-details">
            <div class="cart-item-category">${escapeHTML(product.category)} · ${product.id}</div>
            <h3 class="cart-item-title">${escapeHTML(product.title)}</h3>
            <div class="cart-item-spec">${escapeHTML(product.finish)} Finish · ${escapeHTML(product.dimensions)} · ${escapeHTML(product.origin)}</div>
            <div class="cart-qty-stepper-wrap">
              <div class="qty-stepper">
                <button class="qty-btn" type="button" data-quantity-action="decrease" aria-label="Decrease quantity">−</button>
                <span class="qty-display">${item.quantity} sqft</span>
                <button class="qty-btn" type="button" data-quantity-action="increase" aria-label="Increase quantity">＋</button>
              </div>
              <span class="qty-conversion-note">Available: ${product.stock} sqft</span>
            </div>
          </div>
          <div class="cart-item-right">
            <button class="btn-remove-item" type="button" title="Remove item" data-remove-item>🗑</button>
            <div>
              <div class="cart-item-price-current">${formatCurrency(lineTotal)}</div>
              ${product.strikePrice ? `<div class="cart-item-price-savings"><strike>${formatCurrency(product.strikePrice * item.quantity)}</strike> · <span>Save ${formatCurrency(savings)}</span></div>` : ""}
            </div>
          </div>
        </div>
        <div class="cart-item-notice-banner ${lowStock ? "warning" : "success"}">
          <span>${lowStock ? "⚠️" : "✔"}</span> ${lowStock ? `Low stock — only ${product.stock} sqft remaining. Order soon!` : "In stock · Ships within 2–3 business days"}
        </div>
      </article>
    `;
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  function setupCartPage() {
    const list = document.getElementById("cart-items-list");
    if (!list) {
      return;
    }
    loadDatabaseCart().then((databaseCart) => {
      if (!databaseCart || !Array.isArray(databaseCart.items)) {
        renderCart();
        return;
      }
      const cart = databaseCart.items.map((item) => ({
        id: String(item.product_id),
        quantity: Number(item.quantity),
        name: item.product_name,
        unitPrice: Number(item.unit_price),
        image: item.image_path
      }));
      renderDatabaseCart(cart);
      setCartCount(databaseCart.cartCount || 0);
    });

    list.addEventListener("click", (event) => {
      const card = event.target.closest("[data-cart-id]");
      if (!card) {
        return;
      }

      const product = PRODUCTS[card.dataset.cartId];
      const cart = readCart();
      const item = cart.find((entry) => entry.id === product.id);
      if (!item) {
        return;
      }

      if (event.target.closest("[data-remove-item]")) {
        writeCart(cart.filter((entry) => entry.id !== product.id));
      } else if (event.target.closest('[data-quantity-action="increase"]')) {
        item.quantity = Math.min(item.quantity + 1, product.stock);
        writeCart(cart);
      } else if (event.target.closest('[data-quantity-action="decrease"]')) {
        if (item.quantity <= 1) {
          writeCart(cart.filter((entry) => entry.id !== product.id));
        } else {
          item.quantity -= 1;
          writeCart(cart);
        }
      }
    });

    const applyPromo = () => {
      const input = document.getElementById("promo-code-input");
      const status = document.getElementById("promo-status");
      if (!input) {
        return;
      }
      const cart = readCart();
      const subtotal = cart.reduce((total, item) => total + PRODUCTS[item.id].price * item.quantity, 0);
      const promo = getPromo(input.value, subtotal);
      if (promo) {
        sessionStorage.setItem("akshar_cart_promo", promo.code);
        input.value = promo.code;
        input.setCustomValidity("");
        if (status) {
          status.textContent = `${promo.code} applied successfully.`;
          status.className = "promo-status-text success";
        }
      } else {
        sessionStorage.removeItem("akshar_cart_promo");
        input.setCustomValidity("This promo code is invalid or does not meet its requirements.");
        if (status) {
          status.textContent = input.value.trim()
            ? "Invalid code or the order does not meet the code requirements."
            : "Enter a promo code to apply.";
          status.className = "promo-status-text error";
        }
      }
      renderCart();
    };

    document.querySelector(".promo-apply-btn")?.addEventListener("click", applyPromo);
    document.getElementById("promo-code-input")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyPromo();
      }
    });

    document.getElementById("checkout-button")?.addEventListener("click", (event) => {
      const cart = readCart();
      if (cart.length === 0) {
        event.preventDefault();
        return;
      }
      const promoCode = sessionStorage.getItem("akshar_cart_promo") || "";
      const subtotal = cart.reduce((total, item) => total + PRODUCTS[item.id].price * item.quantity, 0);
      localStorage.setItem(CHECKOUT_KEY, JSON.stringify({
        customerId: getUser()?.id || null,
        items: cart,
        totals: calculateTotals(cart, getPromo(promoCode, subtotal))
      }));
    });

    window.addEventListener("akshar:cart-change", renderCart);
    renderCart();
  }

  document.addEventListener("click", (event) => {
    const addButton = event.target.closest(".btn-card-add-cart, .btn-add-cart, .btn-add-cart-lg, .btn-buy-now-lg");
    if (!addButton) {
      return;
    }

    event.preventDefault();
    if (addButton.disabled) {
      return;
    }
    const productId = getProductId(addButton);
    if (!productId) {
      return;
    }
    const quantityInput = document.querySelector(".product-detail-grid .qty-display");
    const quantityText = quantityInput?.value ?? quantityInput?.textContent ?? "1";
    const quantity = Math.floor(Number(quantityText));
    if (!Number.isFinite(quantity) || quantity < 1) {
      console.error("Invalid square feet quantity:", quantityText);
      addButton.setAttribute("aria-label", "Enter a valid square feet quantity");
      return;
    }

    const product = PRODUCTS[productId];
    const numericProductId = product?.numericId || (/^\d+$/.test(productId) ? Number(productId) : null);
    if (!numericProductId) {
      console.error("Product has no numeric product_id:", productId);
      addButton.setAttribute("aria-label", "Unable to identify this product");
      return;
    }

    const originalText = addButton.querySelector("span")
      ? addButton.innerHTML
      : addButton.textContent;
    addButton.disabled = true;
    addButton.setAttribute("aria-busy", "true");
    if (addButton.querySelector("span")) {
      const textNodes = Array.from(addButton.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE);
      textNodes.forEach((node) => { node.textContent = " Adding..."; });
    } else {
      addButton.textContent = "Adding...";
    }

    addDatabaseCartItem(numericProductId, quantity)
      .then((result) => {
        addProduct(productId, quantity);
        setCartCount(result.cartCount || 0);
        if (addButton.querySelector("span")) {
          addButton.innerHTML = originalText.replace(/Add to Cart/, "Added to Cart");
        } else {
          addButton.textContent = "Added to Cart";
        }
        setTimeout(() => {
          addButton.disabled = false;
          addButton.removeAttribute("aria-busy");
          if (addButton.querySelector("span")) {
            addButton.innerHTML = originalText;
          } else {
            addButton.textContent = "Add to Cart";
          }
          window.location.href = addButton.getAttribute("href") || "cart.html";
        }, 450);
      })
      .catch((error) => {
        console.error("Add to cart failed:", error);
        addButton.disabled = false;
        addButton.removeAttribute("aria-busy");
        addButton.setAttribute("aria-label", error.message || "Unable to add item to cart");
        if (addButton.querySelector("span")) {
          addButton.innerHTML = originalText;
        } else {
          addButton.textContent = "Add to Cart";
        }
      });
  });

  setupCartPage();
})();
