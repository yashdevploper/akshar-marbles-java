(function () {
  // --- Story Modal Handling ---
  const watchButton = document.getElementById("watch-story-button");
  const modal = document.getElementById("story-modal");
  const video = modal?.querySelector(".story-modal-video");
  const closeButton = modal?.querySelector(".story-modal-close");

  if (watchButton && modal && video && closeButton) {
    let closing = false;

    function closeStory() {
      if (!modal.classList.contains("is-open") || closing) {
        return;
      }

      closing = true;
      modal.classList.add("is-closing");
      video.pause();

      const finishClosing = (event) => {
        if (event.target !== modal) {
          return;
        }
        modal.classList.remove("is-open", "is-closing");
        modal.setAttribute("aria-hidden", "true");
        document.body.classList.remove("story-modal-open");
        closing = false;
        modal.removeEventListener("animationend", finishClosing);
      };

      modal.addEventListener("animationend", finishClosing);
    }

    function openStory(event) {
      event.preventDefault();
      closing = false;
      modal.classList.remove("is-closing");
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("story-modal-open");
      closeButton.focus();

      video.currentTime = 0;
      const playback = video.play();
      if (playback) {
        playback.catch(() => {
          video.focus();
        });
      }
    }

    watchButton.addEventListener("click", openStory);
    closeButton.addEventListener("click", closeStory);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        closeStory();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("is-open")) {
        closeStory();
      }
    });
  }

  // --- Dynamic Database Integration for Home Page ---
  async function loadHomeProducts() {
    if (!window.CatalogueAPI) {
      return;
    }

    try {
      const dtoList = await window.CatalogueAPI.getAllActiveProducts();
      if (!Array.isArray(dtoList) || dtoList.length === 0) {
        return;
      }

      const isPagesDir = window.location.pathname.toLowerCase().includes("/pages/");
      const assetBase = isPagesDir ? "../assets/" : "assets/";
      const productPageUrl = isPagesDir ? "product.html" : "pages/product.html";
      const cartPageUrl = isPagesDir ? "cart.html" : "pages/cart.html";

      const resolveImg = (path) => {
        if (!path) return `${assetBase}front-images/Makrana-Marble-2.png`;
        const clean = path.replace(/\\/g, "/").replace(/^assets\/front-images\//i, "");
        return `${assetBase}front-images/${clean}`;
      };

      // 1. Render bestsellers (take up to 4 top products from TiDB)
      const grid = document.getElementById("home-bestsellers-grid") ||
                   document.querySelector("section.home-section:not(#collections) .collections-4grid");
      if (grid) {
        const topProducts = dtoList.slice(0, 4);
        grid.innerHTML = topProducts.map((p) => {
          const code = p.code || String(p.id);
          const badgeClass = p.badgeStyle === "green" ? "premium" : "bestseller";
          const badgeText = p.badgeText || "Bestseller";
          const specText = [p.categoryName, p.finish].filter(Boolean).join(" · ");
          const ratingStars = p.ratingStars || "★★★★★";
          const reviewCount = p.reviewCount || 0;
          const price = p.currentPrice ? `₹${Math.round(p.currentPrice).toLocaleString("en-IN")}` : "₹450";
          const oldPrice = p.originalPrice
            ? `<span class="product-price-old">₹${Math.round(p.originalPrice).toLocaleString("en-IN")} /sqft</span>`
            : `<span class="product-price-unit">${p.priceUnit || "/sqft"}</span>`;
          const imgUrl = resolveImg(p.imagePath);

          return `
            <article class="product-card" data-id="${code}">
              <div class="product-image-wrap" style="height: 170px">
                <span class="product-badge ${badgeClass}">${badgeText}</span>
                <div class="product-action-icons">
                  <button class="product-icon-btn" title="Wishlist">♡</button>
                </div>
                <a href="${productPageUrl}?id=${encodeURIComponent(code)}">
                  <img src="${imgUrl}" alt="${p.name}" loading="lazy" />
                </a>
              </div>
              <div class="product-card-body">
                <span class="product-card-category">${specText}</span>
                <h3 class="product-card-title">
                  <a href="${productPageUrl}?id=${encodeURIComponent(code)}" style="color: inherit; text-decoration: none">${p.name}</a>
                </h3>
                <div class="product-card-rating">
                  <span>${ratingStars}</span>
                  <small>(${reviewCount})</small>
                </div>
                <div class="product-card-footer">
                  <div class="product-price-info">
                    <span class="product-price-current">${price}</span>
                    ${oldPrice}
                  </div>
                  <a href="${cartPageUrl}" class="btn-add-cart" aria-label="Add ${p.name} to cart">🛒</a>
                </div>
              </div>
            </article>
          `;
        }).join("");
      }

      // 2. Sync category counts in "Explore Our Collections" from TiDB
      try {
        const categories = await window.CatalogueAPI.getCategories();
        if (Array.isArray(categories)) {
          const catCards = document.querySelectorAll("#collections .collection-card-item");
          catCards.forEach((card) => {
            const heading = card.querySelector("h3")?.textContent.trim();
            const found = categories.find((c) => c.name.toLowerCase() === heading?.toLowerCase());
            if (found) {
              const small = card.querySelector("small");
              if (small) {
                small.textContent = `${found.productCount} variant${found.productCount === 1 ? "" : "s"}`;
              }
            }
          });
        }
      } catch (_) {}

      // 3. Expose active products to window for cart lookup
      window.AksharProducts = dtoList.map((p) => ({
        id: p.code || String(p.id),
        numericId: p.id,
        title: p.name,
        price: Number(p.currentPrice) || 0,
        image: resolveImg(p.imagePath)
      }));
      window.dispatchEvent(new CustomEvent("akshar:products-loaded"));

    } catch (err) {
      console.warn("Unable to load home products from backend API, keeping static fallback:", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadHomeProducts);
  } else {
    loadHomeProducts();
  }
})();
