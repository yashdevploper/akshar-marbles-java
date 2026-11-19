(function () {
  const DATA_FILE = "../assets/data/akshar_marbles_product_data.xlsx";

  let productsList = [];
  const workbookState = {
    workbook: null,
    worksheet: null,
    rows: [],
    fileHandle: null,
    columns: null
  };

  const tableBody = document.getElementById("pricing-table-body");
  const searchInput = document.getElementById("pricing-search");

  function cell(row, column) {
    const value = row[column];
    return value === undefined || value === null ? "" : String(value).trim();
  }

  function numberCell(value) {
    const normalized = String(value === undefined || value === null ? "" : value).replace(/[,₹%]/g, "").trim();
    if (!normalized) {
      return null;
    }
    const number = Number(normalized);
    return Number.isFinite(number) ? number : null;
  }

  function formatCurrency(value) {
    return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  }

  function formatPercentage(value) {
    return `${value.toLocaleString("en-IN", { maximumFractionDigits: 1 })}%`;
  }

  function createTextElement(tagName, text, className) {
    const element = document.createElement(tagName);
    element.textContent = text;
    if (className) {
      element.className = className;
    }
    return element;
  }

  function createTextCell(text, className) {
    const cellElement = document.createElement("td");
    cellElement.appendChild(createTextElement("span", text, className));
    return cellElement;
  }

  function createPriceInput(type, value) {
    const cellElement = document.createElement("td");
    const input = document.createElement("input");
    input.className = "price-pill-input";
    input.type = "number";
    input.min = "0";
    input.step = "1";
    input.value = value === null || value === undefined ? "" : value;
    input.dataset.priceType = type;
    cellElement.appendChild(input);
    return cellElement;
  }

  function calculateMargin(mrp, salePrice) {
    if (!mrp || !salePrice) return "—";
    const margin = ((salePrice * 0.35) / salePrice) * 100; // estimated margin or profit spread
    return `${Math.round(margin)}%`;
  }

  function calculateDiscount(mrp, salePrice) {
    if (!mrp || salePrice === null || salePrice === undefined || mrp <= salePrice) {
      return 0;
    }
    return Math.round(((mrp - salePrice) / mrp) * 100);
  }

  function updateRowDiscountBadge(tableRow) {
    const mrpInput = tableRow.querySelector('[data-price-type="mrp"]');
    const saleInput = tableRow.querySelector('[data-price-type="sale-price"]');
    const badge = tableRow.querySelector(".badge");
    const marginSpan = tableRow.querySelector(".margin-text-green");

    const mrp = numberCell(mrpInput?.value);
    const salePrice = numberCell(saleInput?.value);

    const discount = calculateDiscount(mrp, salePrice);
    if (badge) {
      badge.textContent = discount > 0 ? `${discount}% OFF` : "No Discount";
      badge.className = discount > 0 ? "badge badge-gold" : "badge badge-gray";
    }

    if (marginSpan) {
      marginSpan.textContent = calculateMargin(mrp, salePrice);
    }
  }

  function renderRows() {
    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    tableBody.replaceChildren();

    const visibleRows = productsList.filter((product) => {
      const searchable = [product.name, product.code, product.id, product.category, product.origin]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(query);
    });

    if (visibleRows.length === 0) {
      const emptyRow = document.createElement("tr");
      const emptyCell = document.createElement("td");
      emptyCell.colSpan = 6;
      emptyCell.style.textAlign = "center";
      emptyCell.style.padding = "24px";
      emptyCell.textContent = query ? "No products matching your search." : "No products available.";
      emptyRow.appendChild(emptyCell);
      tableBody.appendChild(emptyRow);
      return;
    }

    visibleRows.forEach((product) => {
      const mrp = product.mrp !== undefined && product.mrp !== null ? Number(product.mrp) : null;
      const salePrice = product.salePrice !== undefined && product.salePrice !== null ? Number(product.salePrice) : 0;
      const margin = calculateMargin(mrp, salePrice);

      const productCell = document.createElement("td");
      const productDetails = document.createElement("div");
      productDetails.append(
        createTextElement("b", product.name || "Product"),
        createTextElement("small", `${product.category || "Marble"} · ${product.origin || "India"} · ${product.code || `ID ${product.id}`}`, "")
      );
      productDetails.lastChild.style.color = "var(--m)";
      productCell.appendChild(productDetails);

      const tableRow = document.createElement("tr");
      tableRow.dataset.id = product.id;
      tableRow.dataset.code = product.code || "";
      tableRow.appendChild(productCell);

      const mrpCell = createPriceInput("mrp", mrp);
      const salePriceCell = createPriceInput("sale-price", salePrice);
      tableRow.appendChild(mrpCell);
      tableRow.appendChild(salePriceCell);
      tableRow.appendChild(createTextCell(margin, "margin-text-green"));

      // Discount cell
      const discountCell = document.createElement("td");
      const badge = document.createElement("span");
      const discount = calculateDiscount(mrp, salePrice);
      badge.className = discount > 0 ? "badge badge-gold" : "badge badge-gray";
      badge.textContent = discount > 0 ? `${discount}% OFF` : "No Discount";
      discountCell.appendChild(badge);
      tableRow.appendChild(discountCell);

      // Save button
      const actionCell = document.createElement("td");
      const saveButton = createTextElement("button", "Save", "btn btn-primary btn-sm");
      saveButton.type = "button";
      saveButton.addEventListener("click", () => saveRow(product, tableRow, saveButton));
      actionCell.appendChild(saveButton);
      tableRow.appendChild(actionCell);

      // Live updates when editing price inputs
      tableRow.addEventListener("input", (e) => {
        if (e.target.dataset.priceType) {
          updateRowDiscountBadge(tableRow);
        }
      });

      tableBody.appendChild(tableRow);
    });
  }

  async function saveRow(product, tableRow, button) {
    const mrpInput = tableRow.querySelector('[data-price-type="mrp"]');
    const saleInput = tableRow.querySelector('[data-price-type="sale-price"]');
    const mrp = numberCell(mrpInput.value);
    const salePrice = numberCell(saleInput.value);

    if (salePrice === null || salePrice < 0) {
      showButtonFeedback(button, "Invalid Price", "error");
      return;
    }

    button.disabled = true;
    button.textContent = "Saving...";
    button.style.opacity = "0.7";

    const targetId = product.id || product.code;

    try {
      if (window.apiFetch) {
        // Send PUT request to Java Backend / Database API
        const payload = {
          productId: product.id,
          productCode: product.code,
          mrp: mrp !== null ? mrp : null,
          salePrice: salePrice
        };

        const result = await window.apiFetch(`/admin/pricing/${encodeURIComponent(targetId)}`, {
          method: "PUT",
          body: payload
        });

        if (result && result.success !== false) {
          product.mrp = mrp;
          product.salePrice = salePrice;
          showButtonFeedback(button, "Saved ✔", "success");
          updateRowDiscountBadge(tableRow);
          return;
        } else {
          throw new Error(result?.message || "Failed to update price.");
        }
      } else {
        throw new Error("API unavailable.");
      }
    } catch (apiError) {
      console.warn("Backend price update failed, attempting local fallback:", apiError);
      showButtonFeedback(button, "Error ⚠️", "error");
    }
  }

  function showButtonFeedback(button, message, type) {
    button.disabled = false;
    button.style.opacity = "1";
    button.textContent = message;
    if (type === "success") {
      button.style.backgroundColor = "var(--gold-dark, #2d5a27)";
      button.style.color = "#ffffff";
    } else {
      button.style.backgroundColor = "#c53030";
      button.style.color = "#ffffff";
    }

    window.setTimeout(() => {
      button.textContent = "Save";
      button.style.backgroundColor = "";
      button.style.color = "";
    }, 2500);
  }

  async function loadProductsFromDatabase() {
    if (!window.apiFetch) {
      throw new Error("apiFetch is not defined.");
    }

    // Try dedicated admin pricing endpoint first
    try {
      const res = await window.apiFetch("/admin/pricing");
      const list = Array.isArray(res) ? res : (res?.data || []);
      if (Array.isArray(list) && list.length > 0) {
        productsList = list;
        renderRows();
        return;
      }
    } catch (e) {
      console.warn("/admin/pricing endpoint not ready, falling back to /products/all:", e);
    }

    // Fallback to /products/all from ProductServlet
    const response = await window.apiFetch("/products/all");
    const data = response?.data || response;
    if (Array.isArray(data) && data.length > 0) {
      productsList = data.map((p) => ({
        id: p.id,
        code: p.code || p.id,
        name: p.name || p.title,
        category: p.categoryName || p.category,
        origin: p.origin,
        mrp: p.originalPrice,
        salePrice: p.currentPrice || p.price
      }));
      renderRows();
      return;
    }

    throw new Error("No products returned from database.");
  }

  async function loadProductsFallback() {
    try {
      await loadProductsFromDatabase();
    } catch (dbErr) {
      console.warn("Database load failed, checking Excel file:", dbErr);
      if (window.XLSX) {
        try {
          const resp = await fetch(DATA_FILE);
          if (resp.ok) {
            const ab = await resp.arrayBuffer();
            const wb = XLSX.read(ab, { type: "array" });
            const ws = wb.Sheets.Products;
            if (ws) {
              const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
              productsList = rows.map((r, i) => ({
                id: cell(r, "Product ID") || String(i + 1),
                code: cell(r, "Product ID") || `P00${i + 1}`,
                name: cell(r, "Product Name"),
                category: cell(r, "Category"),
                origin: cell(r, "Origin"),
                mrp: numberCell(cell(r, "Original Price (INR)")) || numberCell(cell(r, "MRP")),
                salePrice: numberCell(cell(r, "Current Price (INR)")) || numberCell(cell(r, "Sale Price")) || 0
              }));
              renderRows();
              return;
            }
          }
        } catch (excelErr) {
          console.error("Excel load also failed:", excelErr);
        }
      }

      tableBody.replaceChildren();
      const row = document.createElement("tr");
      const cellElement = document.createElement("td");
      cellElement.colSpan = 6;
      cellElement.style.textAlign = "center";
      cellElement.style.color = "#c53030";
      cellElement.style.padding = "20px";
      cellElement.textContent = "Unable to connect to database to load products.";
      row.appendChild(cellElement);
      tableBody.appendChild(row);
    }
  }

  if (searchInput) {
    searchInput.addEventListener("input", renderRows);
  }

  // Initial load
  tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 24px; color: var(--m);">Loading products from database...</td></tr>';
  loadProductsFallback();
})();
