(function () {
  const productId = new URLSearchParams(window.location.search).get("id");
  let product = null;
  const page = document.querySelector(".product-detail-grid");
  const tabs = document.querySelector(".product-tabs-wrapper");
  const DATA_FILE = "assets/data/akshar_marbles_product_data.xlsx";

  function cell(row, column) {
    const value = row[column];
    return value === undefined || value === null ? "" : String(value).trim();
  }

  function numberCell(row, column) {
    const value = Number(cell(row, column).replace(/[,₹]/g, ""));
    return Number.isFinite(value) ? value : null;
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

  function mapDetailDtoToProduct(detail) {
    const code = detail.code || String(detail.id);
    const title = detail.name || "";
    const currentPrice = Number(detail.currentPrice) || 0;
    const originalPrice = detail.originalPrice ? Number(detail.originalPrice) : null;
    const rating = Number(detail.ratingScore) || 0;
    const reviews = Number(detail.reviewCount) || 0;
    const spec = detail.specification || {};

    let gallery = (detail.gallery && detail.gallery.length > 0
      ? detail.gallery
      : (detail.images || []).map((img) => img.imagePath)
    ).map(resolveUrl).filter(Boolean);

    return {
      id: code,
      numericId: detail.id,
      title: title,
      category: detail.categoryName || "",
      origin: detail.origin || "",
      finish: detail.finish || "",
      tileSize: detail.tileSize || "",
      thickness: spec.thicknessMm ? `${spec.thicknessMm} mm` : "",
      availability: detail.stockStatus || "In Stock",
      image: resolveUrl(detail.imagePath),
      imageAlt: detail.imageAlt || title,
      gallery: gallery,
      rating: rating,
      reviews: reviews,
      price: currentPrice,
      strikePrice: originalPrice,
      technicalSpecs: detail.technicalSpecs || {
        "Stone Type": detail.typeOfStone || "",
        Origin: detail.origin || "",
        Finish: detail.finish || "",
        "Tile Size": detail.tileSize || "",
        Thickness: spec.thicknessMm ? `${spec.thicknessMm} mm` : "",
        "Water Absorption": spec.waterAbsorption ? `${spec.waterAbsorption}%` : "",
        "Hardness (Mohs)": spec.hardnessMohs || "",
        Weight: spec.weightKgM2 ? `${spec.weightKgM2} kg/m²` : ""
      },
      badge: detail.badgeText ? {
        text: detail.badgeText,
        type: detail.badgeStyle || "badge-new"
      } : null,
      stock: detail.stock || 1,
      minimumOrder: detail.minimumOrder || 1,
      defaultQuantity: detail.defaultQuantity || 1,
      productUrl: resolveUrl(detail.productPage || "product.html")
    };
  }

  async function loadProduct() {
    // 1. Primary: Fetch product detail from Java Backend / MySQL Database
    if (window.CatalogueAPI) {
      try {
        const idOrCode = productId || "P001";
        const detail = await window.CatalogueAPI.getProduct(idOrCode);
        if (detail) {
          product = mapDetailDtoToProduct(detail);
          window.AksharProducts = [product];
          window.dispatchEvent(new CustomEvent("akshar:products-loaded"));
          return;
        }
      } catch (apiErr) {
        console.warn("Backend API product detail unavailable, attempting Excel fallback:", apiErr);
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
    const row = rows.find((item) => !productId || cell(item, "Product ID") === productId);
    if (!row) {
      throw new Error(`Product "${productId || "unknown"}" was not found.`);
    }
    product = {
      id: cell(row, "Product ID"),
      title: cell(row, "Product Name"),
      category: cell(row, "Category"),
      origin: cell(row, "Origin"),
      finish: cell(row, "Finish"),
      tileSize: cell(row, "Tile Size"),
      thickness: cell(row, "Thickness (mm)") ? `${cell(row, "Thickness (mm)")} mm` : "",
      availability: cell(row, "Stock Status"),
      image: resolveUrl(cell(row, "Image Path")),
      imageAlt: cell(row, "Image Alt") || cell(row, "Product Name"),
      gallery: [
        cell(row, "Gallery Image 1"),
        cell(row, "Gallery Image 2"),
        cell(row, "Gallery Image 3")
      ].map(resolveUrl).filter(Boolean),
      rating: numberCell(row, "Rating Score") || 0,
      reviews: numberCell(row, "Review Count") || 0,
      price: numberCell(row, "Current Price (INR)") || 0,
      strikePrice: numberCell(row, "Original Price (INR)"),
      technicalSpecs: {
        "Stone Type": cell(row, "Type of Stone"),
        Origin: cell(row, "Origin"),
        Finish: cell(row, "Finish"),
        "Tile Size": cell(row, "Tile Size"),
        Thickness: cell(row, "Thickness (mm)") ? `${cell(row, "Thickness (mm)")} mm` : "",
        "Water Absorption": cell(row, "Water Absorption (%)") ? `${cell(row, "Water Absorption (%)")}%` : "",
        "Hardness (Mohs)": cell(row, "Hardness (Mohs)"),
        Weight: cell(row, "Weight (kg/m²)") ? `${cell(row, "Weight (kg/m²)")} kg/m²` : ""
      },
      badge: cell(row, "Badge Text") ? {
        text: cell(row, "Badge Text"),
        type: cell(row, "Badge Style")
      } : null,
      stock: 1,
      minimumOrder: 1,
      defaultQuantity: 1,
      productUrl: resolveUrl(cell(row, "Product URL"))
    };
    window.AksharProducts = [product];
    window.dispatchEvent(new CustomEvent("akshar:products-loaded"));
  }

  function formatCurrency(value) {
    return `₹${Math.round(value).toLocaleString("en-IN")}`;
  }

  function setField(name, value, prefix = "") {
    const element = document.querySelector(`[data-product-field="${name}"]`);
    if (!element) {
      return;
    }

    if (name === "stock") {
      element.innerHTML = value || "";
      return;
    }

    element.textContent = value ? `${prefix}${value}` : "";
    if (name === "strikePrice" || name === "savings") {
      element.hidden = !value;
    }
  }

  function getGallery() {
    return product.gallery.map((src) => ({ src, alt: product.imageAlt }));
  }

  function imageIsAvailable(src) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
      image.src = src;
    });
  }

  async function renderGallery() {
    let gallery = getGallery();
    const availableImages = await Promise.all(
      gallery.map(async (item) => (await imageIsAvailable(item.src) ? item : null))
    );
    gallery = availableImages.filter(Boolean);
    if (!gallery.length && product.image && await imageIsAvailable(product.image)) {
      gallery = [{ src: product.image, alt: product.imageAlt }];
    }

    const thumbs = document.querySelector("[data-gallery-thumbs]");
    const mainImage = document.getElementById("product-main-image");
    if (!thumbs || !mainImage) {
      return;
    }

    thumbs.replaceChildren();
    gallery.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `gallery-thumb${index === 0 ? " active" : ""}`;
      button.setAttribute("aria-label", `View ${item.alt}`);
      button.setAttribute("aria-current", String(index === 0));

      const image = document.createElement("img");
      image.src = item.src;
      image.alt = item.alt;
      button.appendChild(image);
      thumbs.appendChild(button);
    });

    if (gallery.length) {
      mainImage.src = gallery[0].src;
      mainImage.alt = gallery[0].alt;
    } else {
      mainImage.removeAttribute("src");
      mainImage.alt = product.imageAlt;
    }
  }

  function renderBadges() {
    const container = document.querySelector("[data-product-badges]");
    if (!container) {
      return;
    }

    const badges = [];
    if (product.badge) {
      badges.push(`<span class="product-badge ${product.badge.type}">${product.badge.text}</span>`);
    }
    if (product.strikePrice) {
      const discount = Math.round((1 - product.price / product.strikePrice) * 100);
      badges.push(`<span class="product-badge premium">${discount}% OFF</span>`);
    }
    container.innerHTML = badges.join("");
  }

  function renderTechnicalSpecs() {
    const specs = product.technicalSpecs || {};
    document.querySelectorAll("[data-spec-row]").forEach((row) => {
      const value = specs[row.dataset.specRow];
      row.hidden = !value;
      row.querySelector("b").textContent = value || "";
    });
  }

  function renderReviews() {
    const rating = product.rating ? product.rating.toFixed(1) : "";
    const fullStars = product.rating ? "★".repeat(Math.floor(product.rating)) : "";
    const emptyStars = product.rating ? "☆".repeat(5 - Math.floor(product.rating)) : "";
    setField("rating", rating);
    setField("reviews", product.reviews ? `(${product.reviews} reviews)` : "");
    setField("reviewRating", rating);
    setField("reviewCount", product.reviews ? `${product.reviews} reviews` : "");
    document.querySelectorAll(".product-detail-reviews-row .stars, .score-number-big .stars").forEach((stars) => {
      stars.textContent = `${fullStars}${emptyStars}`;
    });
    document.querySelectorAll(".star-bar-row").forEach((row) => {
      row.hidden = product.id !== "SKU-0021";
    });
    document.querySelectorAll(".user-review-card").forEach((review) => {
      review.hidden = product.id !== "SKU-0021";
    });
  }

  async function renderProduct() {
    if (!product) {
      document.title = "Product | Akshar Marbles";
      document.querySelector(".active-crumb").textContent = "Product";
      document.querySelector('[data-product-field="breadcrumbCategory"]')?.setAttribute("hidden", "");
      page?.setAttribute("hidden", "");
      tabs?.setAttribute("hidden", "");
      return;
    }

    document.title = `${product.title} — ${product.category} | Akshar Marbles`;
    document.querySelector(".active-crumb").textContent = product.title;
    setField("category", product.category);
    setField("breadcrumbCategory", product.category);
    setField("id", product.id);
    setField("title", product.title);
    setField("description", product.description);
    setField("price", formatCurrency(product.price));
    setField("strikePrice", product.strikePrice ? formatCurrency(product.strikePrice) : "");
    setField("savings", product.strikePrice ? `You save ${formatCurrency(product.strikePrice - product.price)}/sqft` : "");
    setField("originDisplay", product.originDisplay || product.origin, "📍 ");
    setField("finish", product.finish, "🔘 ");
    setField("tileSize", product.tileSize || product.dimensions, "📐 ");
    setField("thickness", product.thickness, "📦 ");
    setField("stock", product.stock > 0
      ? `<b>${product.availability}</b> — ${product.stock.toLocaleString("en-IN")} sqft available · Ready to ship`
      : `<b>${product.availability}</b>`);
    const startingQuantity = product.defaultQuantity || product.minimumOrder || 1;
    const quantityDisplay = document.querySelector(".quantity-order-section .qty-display");
    if (quantityDisplay) {
      if (typeof quantityDisplay.value !== "undefined") {
        quantityDisplay.value = String(startingQuantity);
      } else {
        quantityDisplay.textContent = String(startingQuantity);
      }
    }
    setField("quantityTotal", formatCurrency(product.price * startingQuantity));
    setField("minimumOrder", product.minimumOrder ? `Minimum order: ${product.minimumOrder} sqft · Sold in full slabs` : "");
    await renderGallery();
    renderBadges();
    renderTechnicalSpecs();
    renderReviews();
  }

  function setupInteractions() {
    const mainImage = document.getElementById("product-main-image");
    const shareButton = document.querySelector(".btn-share-square");
    const thumbnails = document.querySelector("[data-gallery-thumbs]");
    const quantityDisplay = document.querySelector(".quantity-order-section .qty-display");
    const quantityTotal = document.querySelector('[data-product-field="quantityTotal"]');
    const minimumOrder = product?.minimumOrder || 1;

    shareButton?.addEventListener("click", () => {
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert("copied");
      });
    });

    thumbnails?.addEventListener("click", (event) => {
      const thumbnail = event.target.closest(".gallery-thumb");
      const thumbnailImage = thumbnail?.querySelector("img");
      if (!thumbnailImage || !mainImage) {
        return;
      }

      mainImage.src = thumbnailImage.currentSrc || thumbnailImage.src;
      mainImage.alt = thumbnailImage.alt;
      mainImage.style.transform = thumbnailImage.style.transform || "none";
      thumbnails.querySelectorAll(".gallery-thumb").forEach((item) => {
        const active = item === thumbnail;
        item.classList.toggle("active", active);
        item.setAttribute("aria-current", String(active));
      });
    });

    const updateQuantity = (next) => {
      if (!quantityDisplay || !product) {
        return;
      }
      const minimum = 1;
      const maximum = 100000;
      const parsed = Number.parseInt(String(next), 10);
      const safeQuantity = Number.isFinite(parsed)
        ? Math.min(maximum, Math.max(minimum, parsed))
        : minimum;
      if (typeof quantityDisplay.value !== "undefined") {
        quantityDisplay.value = String(safeQuantity);
      } else {
        quantityDisplay.textContent = String(safeQuantity);
      }
      if (quantityTotal) {
        quantityTotal.textContent = formatCurrency(product.price * safeQuantity);
      }
    };

    quantityDisplay?.addEventListener("input", () => {
      if (!quantityDisplay.value) {
        if (quantityTotal) {
          quantityTotal.textContent = formatCurrency(0);
        }
        return;
      }
      const parsed = Number(quantityDisplay.value);
      if (!Number.isFinite(parsed) || parsed < 1) {
        return;
      }
      updateQuantity(Math.floor(parsed));
    });

    quantityDisplay?.addEventListener("change", () => {
      updateQuantity(quantityDisplay.value);
    });

    document.querySelectorAll(".quantity-order-section .qty-btn").forEach((button, index) => {
      button.addEventListener("click", () => {
        if (!quantityDisplay || !product) {
          return;
        }
        const current = typeof quantityDisplay.value !== "undefined"
          ? (Number.parseInt(quantityDisplay.value, 10) || minimumOrder)
          : (parseInt(quantityDisplay.textContent, 10) || minimumOrder);
        const next = index === 0
          ? Math.max(minimumOrder, current - 1)
          : Math.min(100000, current + 1);
        updateQuantity(next);
      });
    });
  }

  loadProduct()
    .then(() => {
      renderProduct();
      setupInteractions();
    })
    .catch((error) => {
      document.title = "Product | Akshar Marbles";
      if (page) {
        page.removeAttribute("hidden");
      }
      if (tabs) {
        tabs.setAttribute("hidden", "");
      }
      const title = document.querySelector('[data-product-field="title"]');
      if (title) {
        title.textContent = "Unable to load product";
      }
      const description = document.querySelector('[data-product-field="description"]');
      if (description) {
        description.textContent = error.message || "Product data is unavailable.";
      }
    });
})();
