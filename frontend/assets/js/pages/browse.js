/**
 * Interactive Filter & Catalogue Management for Akshar Marbles (browse.html)
 * Real-time filtering, multi-facet selection, price slider, search, sorting, view toggling, and pagination.
 */
(function () {
  const DATA_FILE = "../assets/data/akshar_marbles_product_data.xlsx";
  const REQUIRED_COLUMNS = [
    "Product ID", "Product Name", "Category", "Origin", "Finish", "Tile Size",
    "Stock Status", "Image Path", "Image Alt", "Badge Text", "Badge Style",
    "Rating Stars", "Rating Score", "Review Count", "Current Price (INR)",
    "Original Price (INR)", "Price Unit", "Wishlist Button", "Wishlist Active",
    "Quick View URL", "Product URL", "Add-to-Cart Label", "Cart URL"
  ];
  let PRODUCTS = [];

  // Active filter state
  const state = {
    categories: new Set(),
    finishes: new Set(),
    colors: new Set(),
    origins: new Set(),
    availability: new Set(),
    maxPrice: 2000,
    searchQuery: '',
    sort: 'recommended',
    currentPage: 1,
    pageSize: 6,
    viewMode: 'grid',
    wishlist: new Set()
  };

  // Color normalization mapping for swatches
  const COLOR_MAP = {
    '#ffffff': 'White',
    '#222222': 'Black',
    '#d9ccb5': 'Tan / Cream',
    '#8c6239': 'Brown',
    '#1e5b44': 'Emerald Green',
    '#8a6e87': 'Purple',
    '#d1876e': 'Terracotta',
    '#5b7891': 'Slate Blue'
  };

  // Check SVG checkmark string
  const CHECK_SVG = '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg>';

  function cell(row, column) {
    const value = row[column];
    return value === undefined || value === null ? "" : String(value).trim();
  }

  function numberCell(row, column) {
    const value = Number(cell(row, column).replace(/[,₹]/g, ""));
    return Number.isFinite(value) ? value : null;
  }

  function booleanCell(row, column) {
    return ["true", "1", "yes", "y"].includes(cell(row, column).toLowerCase());
  }

  function resolveUrl(value) {
    if (!value) {
      return "";
    }
    try {
      return new URL(value.replace(/\\/g, "/"), document.baseURI).href;
    } catch (error) {
      return "";
    }
  }

  function resolveProductUrl(value, productId) {
    const url = resolveUrl(value);
    if (!url) {
      return "";
    }
    try {
      const productUrl = new URL(url);
      if (productUrl.pathname.endsWith("/product.html") && !productUrl.searchParams.has("id")) {
        productUrl.searchParams.set("id", productId);
      }
      return productUrl.href;
    } catch (error) {
      return "";
    }
  }

  function normalizeProducts(rows) {
    return rows.map((row) => {
      const id = cell(row, "Product ID");
      const title = cell(row, "Product Name");
      const rating = numberCell(row, "Rating Score");
      return {
        id,
        title,
        category: cell(row, "Category"),
        origin: cell(row, "Origin"),
        finish: cell(row, "Finish"),
        color: "",
        availability: cell(row, "Stock Status"),
        price: numberCell(row, "Current Price (INR)") || 0,
        strikePrice: numberCell(row, "Original Price (INR)"),
        rating: rating || 0,
        reviews: numberCell(row, "Review Count") || 0,
        badge: cell(row, "Badge Text") ? {
          text: cell(row, "Badge Text"),
          type: cell(row, "Badge Style")
        } : null,
        image: resolveUrl(cell(row, "Image Path")),
        imageAlt: cell(row, "Image Alt") || title,
        stars: cell(row, "Rating Stars"),
        spec: [cell(row, "Origin"), cell(row, "Finish"), cell(row, "Tile Size")].filter(Boolean).join(" · "),
        priceUnit: cell(row, "Price Unit"),
        wishlistLabel: cell(row, "Wishlist Button") || "Wishlist",
        quickViewUrl: resolveProductUrl(cell(row, "Quick View URL"), id),
        productUrl: resolveProductUrl(cell(row, "Product URL"), id),
        cartUrl: resolveUrl(cell(row, "Cart URL")),
        addToCartLabel: cell(row, "Add-to-Cart Label") || "Add to Cart",
        stock: 1
      };
    }).filter((product) => product.id && product.title);
  }

  function mapDtoToProduct(dto) {
    const id = dto.code || String(dto.id);
    const title = dto.name || "";
    const origin = dto.origin || "";
    const finish = dto.finish || "";
    const tileSize = dto.tileSize || "";
    const rating = Number(dto.ratingScore) || 0;
    const reviews = Number(dto.reviewCount) || 0;
    return {
      id,
      numericId: dto.id,
      title,
      category: dto.categoryName || "",
      origin,
      finish,
      color: "",
      availability: dto.stockStatus || "In Stock",
      price: Number(dto.currentPrice) || 0,
      strikePrice: dto.originalPrice ? Number(dto.originalPrice) : null,
      rating: rating,
      reviews: reviews,
      badge: dto.badgeText ? {
        text: dto.badgeText,
        type: dto.badgeStyle || "badge-new"
      } : null,
      image: resolveUrl(dto.imagePath),
      imageAlt: dto.imageAlt || title,
      stars: dto.ratingStars || "★★★★★",
      spec: [origin, finish, tileSize].filter(Boolean).join(" · "),
      priceUnit: dto.priceUnit || "/sqft",
      wishlistLabel: "Wishlist",
      quickViewUrl: resolveProductUrl("product.html", id),
      productUrl: resolveProductUrl(dto.productPage || "product.html", id),
      cartUrl: resolveUrl("cart.html"),
      addToCartLabel: "Add to Cart",
      stock: 1
    };
  }

  async function loadProducts() {
    // 1. Primary: Fetch dynamic product data from Java Backend / MySQL Database
    if (window.CatalogueAPI) {
      try {
        const dtoList = await window.CatalogueAPI.getAllActiveProducts();
        if (Array.isArray(dtoList) && dtoList.length > 0) {
          const products = dtoList.map(mapDtoToProduct).filter((p) => p.id && p.title);
          PRODUCTS = products;
          window.AksharProducts = products;
          window.dispatchEvent(new CustomEvent("akshar:products-loaded"));
          return;
        }
      } catch (apiErr) {
        console.warn("Backend API unavailable, attempting Excel fallback:", apiErr);
      }
    }

    // 2. Fallback: Read Excel spreadsheet
    if (!window.XLSX) {
      throw new Error("The spreadsheet parser could not be loaded.");
    }
    const response = await fetch(DATA_FILE);
    if (!response.ok) {
      throw new Error(`Product data file could not be loaded (${response.status}).`);
    }
    const workbook = XLSX.read(await response.arrayBuffer(), { type: "array" });
    const worksheet = workbook.Sheets.Products;
    if (!worksheet) {
      throw new Error('The workbook does not contain a "Products" worksheet.');
    }
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
    if (!rows.length) {
      throw new Error('The "Products" worksheet does not contain any records.');
    }
    const missingColumns = REQUIRED_COLUMNS.filter((column) => !Object.prototype.hasOwnProperty.call(rows[0], column));
    if (missingColumns.length) {
      throw new Error(`Product data is missing required columns: ${missingColumns.join(", ")}.`);
    }
    const products = normalizeProducts(rows);
    if (!products.length) {
      throw new Error("The product records do not contain valid product IDs and names.");
    }
    PRODUCTS = products;
    window.AksharProducts = products;
    window.dispatchEvent(new CustomEvent("akshar:products-loaded"));
    state.wishlist = new Set(products.filter((product) => booleanCell(rows.find((row) => cell(row, "Product ID") === product.id), "Wishlist Active")).map((product) => product.id));
  }

  function showGridMessage(message, isError) {
    const grid = document.querySelector(".browse-products-grid");
    if (!grid) {
      return;
    }
    const messageElement = document.createElement("p");
    messageElement.className = isError ? "browse-data-error" : "browse-data-loading";
    messageElement.textContent = message;
    grid.replaceChildren(messageElement);
  }

  function createIcon(type) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", type === "heart" ? "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" : "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z");
    svg.appendChild(path);
    if (type !== "heart") {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", "12");
      circle.setAttribute("cy", "12");
      circle.setAttribute("r", "3");
      svg.appendChild(circle);
    }
    return svg;
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));
  }

  function initFromURL() {
    const params = new URLSearchParams(window.location.search);
    
    // Category param
    const cat = params.get('category');
    if (cat) {
      state.categories.add(cat);
    }

    // Search query param
    const q = params.get('search') || params.get('q');
    if (q) {
      state.searchQuery = q.trim();
    }

    // Finish param
    const finish = params.get('finish');
    if (finish) {
      state.finishes.add(finish);
    }

    // Origin param
    const origin = params.get('origin');
    if (origin) {
      state.origins.add(origin);
    }

    // Sort param
    const sort = params.get('sort');
    if (sort) {
      state.sort = sort;
    }
  }

  function getFilteredProducts() {
    return PRODUCTS.filter((item) => {
      // Category filter
      if (state.categories.size > 0 && !state.categories.has(item.category)) {
        return false;
      }

      // Finish filter
      if (state.finishes.size > 0 && !state.finishes.has(item.finish)) {
        return false;
      }

      // Color filter
      if (state.colors.size > 0 && !state.colors.has(item.color)) {
        return false;
      }

      // Origin filter
      if (state.origins.size > 0 && !state.origins.has(item.origin)) {
        return false;
      }

      // Availability filter
      if (state.availability.size > 0 && !state.availability.has(item.availability)) {
        return false;
      }

      // Price filter
      if (item.price > state.maxPrice) {
        return false;
      }

      // Search Query filter
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        const matchesOrigin = item.origin.toLowerCase().includes(query);
        const matchesFinish = item.finish.toLowerCase().includes(query);
        const matchesColor = item.color.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCategory && !matchesOrigin && !matchesFinish && !matchesColor) {
          return false;
        }
      }

      return true;
    });
  }

  function sortProducts(items) {
    const sorted = items.slice();
    switch (state.sort) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
        break;
      case 'name':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'recommended':
      default:
        // Prioritize Bestsellers and high ratings
        sorted.sort((a, b) => {
          const aBest = a.badge && a.badge.text === 'Bestseller' ? 1 : 0;
          const bBest = b.badge && b.badge.text === 'Bestseller' ? 1 : 0;
          if (bBest !== aBest) return bBest - aBest;
          return b.rating - a.rating;
        });
        break;
    }
    return sorted;
  }

  function renderProductCard(item) {
    const isWishlisted = state.wishlist.has(item.id);
    const card = document.createElement("article");
    card.className = "browse-product-card";
    card.dataset.id = item.id;

    const imageContainer = document.createElement("div");
    imageContainer.className = "card-img-container";
    if (item.badge) {
      const badge = document.createElement("span");
      badge.className = `card-corner-badge ${item.badge.type}`;
      badge.textContent = item.badge.text;
      imageContainer.appendChild(badge);
    }

    const actions = document.createElement("div");
    actions.className = "card-action-btns";
    const wishlist = document.createElement("button");
    wishlist.type = "button";
    wishlist.className = `card-round-btn${isWishlisted ? " heart-active" : ""}`;
    wishlist.dataset.wishlistId = item.id;
    wishlist.title = isWishlisted ? "Remove from wishlist" : item.wishlistLabel;
    wishlist.appendChild(createIcon("heart"));
    actions.appendChild(wishlist);

    if (item.quickViewUrl) {
      const quickView = document.createElement("a");
      quickView.href = item.quickViewUrl;
      quickView.className = "card-round-btn";
      quickView.title = "Quick view";
      quickView.appendChild(createIcon("view"));
      actions.appendChild(quickView);
    }
    imageContainer.appendChild(actions);

    const imageLink = document.createElement("a");
    imageLink.href = item.productUrl || item.quickViewUrl || "#";
    if (item.image) {
      const image = document.createElement("img");
      image.src = item.image;
      image.alt = item.imageAlt;
      image.loading = "lazy";
      imageLink.appendChild(image);
    }
    imageContainer.appendChild(imageLink);

    const specBar = document.createElement("div");
    specBar.className = "card-img-spec-bar";
    const spec = document.createElement("span");
    spec.className = "spec-info";
    spec.textContent = item.spec;
    const stock = document.createElement("span");
    stock.className = "stock-info";
    stock.textContent = item.availability;
    if (item.availability === "Available to Order") {
      stock.style.color = "#c5a46d";
    }
    specBar.append(spec, stock);
    imageContainer.appendChild(specBar);
    card.appendChild(imageContainer);

    const body = document.createElement("div");
    body.className = "browse-card-body";
    const category = document.createElement("span");
    category.className = "browse-card-category";
    category.textContent = item.category;
    body.appendChild(category);

    const title = document.createElement("a");
    title.className = "browse-card-title";
    title.href = item.productUrl || item.quickViewUrl || "#";
    title.textContent = item.title;
    body.appendChild(title);

    const ratingRow = document.createElement("div");
    ratingRow.className = "browse-card-rating-row";
    const stars = document.createElement("span");
    stars.className = "rating-stars";
    stars.textContent = item.stars;
    const score = document.createElement("span");
    score.className = "rating-score";
    score.textContent = item.rating ? item.rating.toFixed(1) : "";
    const reviews = document.createElement("span");
    reviews.className = "rating-reviews";
    reviews.textContent = item.reviews ? `(${item.reviews})` : "";
    ratingRow.append(stars, score, reviews);
    body.appendChild(ratingRow);

    const footer = document.createElement("div");
    footer.className = "browse-card-footer";
    const price = document.createElement("div");
    price.className = "browse-card-price";
    const currentPrice = document.createElement("span");
    currentPrice.className = "price-main";
    currentPrice.textContent = `₹${item.price.toLocaleString("en-IN")}`;
    price.appendChild(currentPrice);
    if (item.strikePrice) {
      const originalPrice = document.createElement("span");
      originalPrice.className = "price-strike";
      originalPrice.textContent = `₹${item.strikePrice.toLocaleString("en-IN")}`;
      price.appendChild(originalPrice);
    }
    const priceUnit = document.createElement("span");
    priceUnit.className = "price-per-sqft";
    priceUnit.textContent = item.priceUnit;
    price.appendChild(priceUnit);
    footer.appendChild(price);

    const cartLink = document.createElement("a");
    cartLink.href = item.cartUrl || "#";
    cartLink.className = "btn-card-add-cart";
    cartLink.textContent = item.addToCartLabel;
    footer.appendChild(cartLink);
    body.appendChild(footer);
    card.appendChild(body);
    return card;
  }

  function renderEmptyState() {
    return `
      <div class="browse-empty-state">
        <span class="browse-empty-icon">💎</span>
        <h3>No Marble Varieties Found</h3>
        <p>No slabs currently match all your selected filters. Try broadening your criteria or resetting filters to see our full luxury collection.</p>
        <button type="button" class="btn-empty-reset" id="btn-empty-reset">
          <span>↺</span> Reset All Filters
        </button>
      </div>
    `;
  }

  function updateSidebarCounts() {
    // Category counts
    document.querySelectorAll('[data-group="category"]').forEach((el) => {
      const val = el.getAttribute('data-value');
      const count = PRODUCTS.filter((p) => p.category === val).length;
      const countEl = el.querySelector('.filter-item-count');
      if (countEl) countEl.textContent = count;
    });

    // Origin counts
    document.querySelectorAll('[data-group="origin"]').forEach((el) => {
      const val = el.getAttribute('data-value');
      const count = PRODUCTS.filter((p) => p.origin === val).length;
      const countEl = el.querySelector('.filter-item-count');
      if (countEl) countEl.textContent = count;
    });
  }

  function updateActiveChips(totalMatches) {
    const container = document.querySelector('.browse-active-filters-row');
    if (!container) return;

    const chips = [];

    // Category chips
    state.categories.forEach((cat) => {
      chips.push({ group: 'category', value: cat, label: cat });
    });

    // Finish chips
    state.finishes.forEach((fin) => {
      chips.push({ group: 'finish', value: fin, label: `${fin} Finish` });
    });

    // Color chips
    state.colors.forEach((col) => {
      chips.push({ group: 'color', value: col, label: `${col} Tone` });
    });

    // Origin chips
    state.origins.forEach((orig) => {
      chips.push({ group: 'origin', value: orig, label: orig });
    });

    // Availability chips
    state.availability.forEach((avail) => {
      chips.push({ group: 'availability', value: avail, label: avail });
    });

    // Price chip
    if (state.maxPrice < 2000) {
      chips.push({ group: 'price', value: state.maxPrice, label: `Under ₹${state.maxPrice.toLocaleString('en-IN')}` });
    }

    // Search query chip
    if (state.searchQuery) {
      chips.push({ group: 'search', value: state.searchQuery, label: `"${state.searchQuery}"` });
    }

    // Update filter count badge on mobile filter button
    const badge = document.querySelector('.filter-count-badge');
    if (badge) {
      badge.textContent = chips.length;
      badge.style.display = chips.length > 0 ? 'inline-block' : 'none';
    }

    if (chips.length === 0) {
      container.style.display = 'none';
      container.innerHTML = '';
      return;
    }

    container.style.display = 'flex';
    container.innerHTML = chips.map((c) => `
        <a href="#" class="filter-chip" data-remove-group="${escapeHTML(c.group)}" data-remove-value="${escapeHTML(c.value)}">
          ${escapeHTML(c.label)} <span class="chip-remove">✕</span>
        </a>
      `).join('') + '<a href="#" class="btn-clear-all-filters" id="btn-clear-all">Clear All</a>';
  }

  function updateSidebarControlsUI() {
    // Checkboxes
    document.querySelectorAll('.filter-checkbox-item[data-group]').forEach((label) => {
      const group = label.getAttribute('data-group');
      const val = label.getAttribute('data-value');
      const box = label.querySelector('.custom-box');
      if (!box) return;

      let isChecked = false;
      if (group === 'category') isChecked = state.categories.has(val);
      else if (group === 'finish') isChecked = state.finishes.has(val);
      else if (group === 'origin') isChecked = state.origins.has(val);
      else if (group === 'availability') isChecked = state.availability.has(val);

      if (isChecked) {
        box.classList.add('checked');
        box.innerHTML = CHECK_SVG;
      } else {
        box.classList.remove('checked');
        box.innerHTML = '';
      }
    });

    // Swatches
    document.querySelectorAll('.color-swatch-circle').forEach((swatch) => {
      const val = swatch.getAttribute('data-color-name');
      if (state.colors.has(val)) {
        swatch.classList.add('active');
      } else {
        swatch.classList.remove('active');
      }
    });

    // Slider
    const slider = document.getElementById('price-range-slider');
    const display = document.getElementById('price-slider-display');
    if (slider) slider.value = state.maxPrice;
    if (display) display.textContent = state.maxPrice >= 2000 ? 'Up to ₹2,000' : `Up to ₹${state.maxPrice.toLocaleString('en-IN')}`;

    // Search input
    const searchInput = document.getElementById('browse-search-input');
    if (searchInput && searchInput.value !== state.searchQuery) {
      searchInput.value = state.searchQuery;
    }

    // Sort Dropdown label
    const sortLabel = document.getElementById('sort-dropdown-label');
    if (sortLabel) {
      const labels = {
        'recommended': 'Sort: Recommended',
        'price-asc': 'Sort: Price: Low to High',
        'price-desc': 'Sort: Price: High to Low',
        'rating': 'Sort: Customer Rating',
        'name': 'Sort: Name: A to Z'
      };
      sortLabel.textContent = labels[state.sort] || 'Sort: Recommended';
    }

    // Sort menu items active class
    document.querySelectorAll('.sort-dropdown-item').forEach((item) => {
      const s = item.getAttribute('data-sort');
      item.classList.toggle('active', s === state.sort);
    });
  }

  function renderPagination(totalItems) {
    const wrapper = document.querySelector('.browse-pagination-wrapper');
    if (!wrapper) return;

    const totalPages = Math.ceil(totalItems / state.pageSize);
    if (totalPages <= 1) {
      wrapper.style.display = totalItems === 0 ? 'none' : 'flex';
      wrapper.innerHTML = '<span class="page-btn active">1</span>';
      return;
    }

    wrapper.style.display = 'flex';
    let html = '';

    // Previous Arrow
    if (state.currentPage > 1) {
      html += `
        <a href="#" class="page-btn page-nav-btn" data-page="${state.currentPage - 1}" aria-label="Previous page">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </a>
      `;
    }

    // Page Numbers
    for (let p = 1; p <= totalPages; p++) {
      html += `
        <a href="#" class="page-btn page-num-btn ${p === state.currentPage ? 'active' : ''}" data-page="${p}">
          ${p}
        </a>
      `;
    }

    // Next Arrow
    if (state.currentPage < totalPages) {
      html += `
        <a href="#" class="page-btn page-nav-btn" data-page="${state.currentPage + 1}" aria-label="Next page">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </a>
      `;
    }

    wrapper.innerHTML = html;
  }

  function applyFiltersAndRender() {
    const filtered = getFilteredProducts();
    const sorted = sortProducts(filtered);

    // Update Result Counts & Header
    const titleGroup = document.querySelector('.browse-title-group');
    if (titleGroup) {
      let subtitle = `Showing ${sorted.length} ${sorted.length === 1 ? 'variety' : 'varieties'}`;
      if (state.searchQuery) {
        subtitle += ` for "${state.searchQuery}"`;
      } else if (state.categories.size > 0) {
        subtitle += ` in ${Array.from(state.categories).join(', ')}`;
      }
      titleGroup.querySelector('p').textContent = subtitle;
    }

    // Pagination calculations
    const totalPages = Math.ceil(sorted.length / state.pageSize);
    if (state.currentPage > totalPages && totalPages > 0) {
      state.currentPage = 1;
    }

    const startIndex = (state.currentPage - 1) * state.pageSize;
    const paginated = sorted.slice(startIndex, startIndex + state.pageSize);

    // Render Products Grid
    const grid = document.querySelector('.browse-products-grid');
    if (grid) {
      if (sorted.length === 0) {
        grid.innerHTML = renderEmptyState();
      } else {
        grid.replaceChildren(...paginated.map(renderProductCard));
      }

      // Ensure viewMode class is synchronized
      if (state.viewMode === 'list') {
        grid.classList.add('list-view');
      } else {
        grid.classList.remove('list-view');
      }
    }

    // Update UI Elements
    updateActiveChips(sorted.length);
    updateSidebarControlsUI();
    renderPagination(sorted.length);
  }

  function setupEventListeners() {
    // Checkbox items click handling
    document.querySelectorAll('.filter-checkbox-item[data-group]').forEach((label) => {
      label.addEventListener('click', function (e) {
        e.preventDefault();
        const group = this.getAttribute('data-group');
        const val = this.getAttribute('data-value');

        let targetSet;
        if (group === 'category') targetSet = state.categories;
        else if (group === 'finish') targetSet = state.finishes;
        else if (group === 'origin') targetSet = state.origins;
        else if (group === 'availability') targetSet = state.availability;

        if (targetSet) {
          if (targetSet.has(val)) {
            targetSet.delete(val);
          } else {
            targetSet.add(val);
          }
          state.currentPage = 1;
          applyFiltersAndRender();
        }
      });
    });

    // Color swatches click handling
    document.querySelectorAll('.color-swatch-circle').forEach((swatch) => {
      swatch.addEventListener('click', function () {
        const val = this.getAttribute('data-color-name');
        if (state.colors.has(val)) {
          state.colors.delete(val);
        } else {
          state.colors.add(val);
        }
        state.currentPage = 1;
        applyFiltersAndRender();
      });
    });

    // Price Slider range handling
    const slider = document.getElementById('price-range-slider');
    if (slider) {
      slider.addEventListener('input', function () {
        state.maxPrice = parseInt(this.value, 10);
        const display = document.getElementById('price-slider-display');
        if (display) {
          display.textContent = state.maxPrice >= 2000 ? 'Up to ₹2,000' : `Up to ₹${state.maxPrice.toLocaleString('en-IN')}`;
        }
      });

      slider.addEventListener('change', function () {
        state.maxPrice = parseInt(this.value, 10);
        state.currentPage = 1;
        applyFiltersAndRender();
      });
    }

    // Search Input handling
    const searchInput = document.getElementById('browse-search-input');
    if (searchInput) {
      let debounceTimer;
      searchInput.addEventListener('input', function () {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          state.searchQuery = searchInput.value.trim();
          state.currentPage = 1;
          applyFiltersAndRender();
        }, 250);
      });
    }

    // Active Chips delegate removal
    const activeRow = document.querySelector('.browse-active-filters-row');
    if (activeRow) {
      activeRow.addEventListener('click', function (e) {
        const chip = e.target.closest('.filter-chip');
        if (chip) {
          e.preventDefault();
          const group = chip.getAttribute('data-remove-group');
          const val = chip.getAttribute('data-remove-value');

          if (group === 'category') state.categories.delete(val);
          else if (group === 'finish') state.finishes.delete(val);
          else if (group === 'color') state.colors.delete(val);
          else if (group === 'origin') state.origins.delete(val);
          else if (group === 'availability') state.availability.delete(val);
          else if (group === 'price') state.maxPrice = 2000;
          else if (group === 'search') {
            state.searchQuery = '';
            if (searchInput) searchInput.value = '';
          }

          state.currentPage = 1;
          applyFiltersAndRender();
          return;
        }

        const clearBtn = e.target.closest('#btn-clear-all, .btn-clear-all-filters');
        if (clearBtn) {
          e.preventDefault();
          clearAllFilters();
        }
      });
    }

    // Empty state reset button delegate
    document.addEventListener('click', function (e) {
      if (e.target.closest('#btn-empty-reset')) {
        clearAllFilters();
      }
    });

    // Sort Dropdown toggle & selection
    const sortWrapper = document.getElementById('sort-dropdown-wrapper');
    const sortToggle = document.getElementById('sort-dropdown-toggle');

    if (sortToggle && sortWrapper) {
      sortToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        sortWrapper.classList.toggle('open');
      });

      document.querySelectorAll('.sort-dropdown-item').forEach((item) => {
        item.addEventListener('click', function () {
          const s = this.getAttribute('data-sort');
          state.sort = s;
          sortWrapper.classList.remove('open');
          state.currentPage = 1;
          applyFiltersAndRender();
        });
      });

      document.addEventListener('click', function (e) {
        if (!sortWrapper.contains(e.target)) {
          sortWrapper.classList.remove('open');
        }
      });
    }

    // View Mode Toggle (Grid vs List)
    document.querySelectorAll('.view-toggle-btn').forEach((btn) => {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.view-toggle-btn').forEach((b) => b.classList.remove('active'));
        this.classList.add('active');
        state.viewMode = this.getAttribute('title').toLowerCase().includes('list') ? 'list' : 'grid';
        const grid = document.querySelector('.browse-products-grid');
        if (grid) {
          if (state.viewMode === 'list') {
            grid.classList.add('list-view');
          } else {
            grid.classList.remove('list-view');
          }
        }
      });
    });

    // Wishlist Toggle
    document.addEventListener('click', function (e) {
      const wishBtn = e.target.closest('[data-wishlist-id]');
      if (wishBtn) {
        e.preventDefault();
        const id = wishBtn.getAttribute('data-wishlist-id');
        if (state.wishlist.has(id)) {
          state.wishlist.delete(id);
          wishBtn.classList.remove('heart-active');
          wishBtn.setAttribute('title', 'Add to wishlist');
        } else {
          state.wishlist.add(id);
          wishBtn.classList.add('heart-active');
          wishBtn.setAttribute('title', 'Remove from wishlist');
        }
      }
    });

    // Pagination Click
    const paginationWrapper = document.querySelector('.browse-pagination-wrapper');
    if (paginationWrapper) {
      paginationWrapper.addEventListener('click', function (e) {
        const pageBtn = e.target.closest('[data-page]');
        if (pageBtn) {
          e.preventDefault();
          const p = parseInt(pageBtn.getAttribute('data-page'), 10);
          if (p && p !== state.currentPage) {
            state.currentPage = p;
            applyFiltersAndRender();
            // Smooth scroll to catalogue top
            const banner = document.querySelector('.browse-header-banner');
            if (banner) {
              banner.scrollIntoView({ behavior: 'smooth' });
            }
          }
        }
      });
    }

    // Mobile Filter Drawer Toggle
    const filterToggleBtn = document.querySelector('.btn-filter-toggle');
    const sidebar = document.querySelector('.filters-sidebar');
    let backdrop = document.querySelector('.filters-backdrop');

    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'filters-backdrop';
      document.body.appendChild(backdrop);
    }

    const mobileFilterQuery = window.matchMedia('(max-width: 768px)');
    let previousBodyOverflow = '';

    function openMobileFilters() {
      if (!mobileFilterQuery.matches) return;

      previousBodyOverflow = document.body.style.overflow;
      if (sidebar) sidebar.classList.add('open');
      if (backdrop) backdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeMobileFilters() {
      if (sidebar) sidebar.classList.remove('open');
      if (backdrop) backdrop.classList.remove('open');
      document.body.style.overflow = previousBodyOverflow;
    }

    if (filterToggleBtn) {
      filterToggleBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        openMobileFilters();
      });
    }

    const closeBtn = document.querySelector('.filters-sidebar-close');
    if (closeBtn) closeBtn.addEventListener('click', closeMobileFilters);
    if (backdrop) backdrop.addEventListener('click', closeMobileFilters);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeMobileFilters();
      }
    });
  }

  function clearAllFilters() {
    state.categories.clear();
    state.finishes.clear();
    state.colors.clear();
    state.origins.clear();
    state.availability.clear();
    state.maxPrice = 2000;
    state.searchQuery = '';
    state.currentPage = 1;
    const searchInput = document.getElementById('browse-search-input');
    if (searchInput) searchInput.value = '';
    applyFiltersAndRender();
  }

  async function init() {
    showGridMessage("Loading products…", false);
    initFromURL();
    try {
      await loadProducts();
    } catch (error) {
      showGridMessage(error.message || "Unable to load products.", true);
      return;
    }
    updateSidebarCounts();
    setupEventListeners();
    applyFiltersAndRender();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
