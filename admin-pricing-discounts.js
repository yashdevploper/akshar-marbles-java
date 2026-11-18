(function () {
  const DATA_FILE = "assets/data/akshar_marbles_product_data.xlsx";
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
    return `${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}%`;
  }

  function setCellValue(rowNumber, columnNumber, value) {
    const address = XLSX.utils.encode_cell({ r: rowNumber, c: columnNumber });
    const existing = workbookState.worksheet[address];
    workbookState.worksheet[address] = {
      t: "n",
      v: value,
      ...(existing && existing.z ? { z: existing.z } : {})
    };
  }

  function locateColumns() {
    const headers = XLSX.utils.sheet_to_json(workbookState.worksheet, { header: 1, defval: "" })[0] || [];
    const indexOf = (names) => names.map((name) => headers.indexOf(name)).find((index) => index >= 0);
    const columns = {
      id: indexOf(["Product ID", "Product ID/SKU", "SKU"]),
      name: indexOf(["Product Name", "Name"]),
      category: indexOf(["Category"]),
      origin: indexOf(["Origin"]),
      mrp: indexOf(["Original Price (INR)", "MRP", "MRP (INR)"]),
      salePrice: indexOf(["Current Price (INR)", "Sale Price", "Sale Price (INR)"]),
      margin: indexOf(["Margin", "Margin (%)", "Margin %"])
    };
    const requiredColumns = ["id", "name", "category", "origin", "mrp", "salePrice"];
    if (requiredColumns.some((name) => columns[name] === undefined)) {
      throw new Error("The Products worksheet is missing a required pricing column.");
    }
    return {
      ...columns,
      mrpName: headers[columns.mrp],
      salePriceName: headers[columns.salePrice],
      marginName: columns.margin === undefined ? "" : headers[columns.margin]
    };
  }

  function rowNumberForSku(sku) {
    const rows = XLSX.utils.sheet_to_json(workbookState.worksheet, { header: 1, defval: "" });
    const rowIndex = rows.findIndex((row, index) => index > 0 && String(row[workbookState.columns.id]).trim() === sku);
    return rowIndex;
  }

  function createTextElement(tagName, text, className) {
    const element = document.createElement(tagName);
    element.textContent = text;
    if (className) {
      element.className = className;
    }
    return element;
  }

  function renderRows() {
    const query = searchInput.value.trim().toLowerCase();
    tableBody.replaceChildren();
    const visibleRows = workbookState.rows.filter((row) => {
      const searchable = [cell(row, "Product Name"), cell(row, "Product ID"), cell(row, "Category"), cell(row, "Origin")]
        .join(" ")
        .toLowerCase();
      return searchable.includes(query);
    });

    visibleRows.forEach((row) => {
      const sku = cell(row, "Product ID");
      const mrp = numberCell(row[workbookState.columns.mrpName]);
      const salePrice = numberCell(row[workbookState.columns.salePriceName]);
      const margin = cell(row, workbookState.columns.marginName) || "—";
      const productCell = document.createElement("td");
      const productDetails = document.createElement("div");
      productDetails.append(
        createTextElement("b", cell(row, "Product Name")),
        createTextElement("small", `${cell(row, "Category")} · ${cell(row, "Origin")} · ${sku}`, "")
      );
      productDetails.lastChild.style.color = "var(--m)";
      productCell.appendChild(productDetails);

      const tableRow = document.createElement("tr");
      tableRow.dataset.sku = sku;
      tableRow.appendChild(productCell);
      tableRow.appendChild(createPriceInput("mrp", mrp));
      tableRow.appendChild(createPriceInput("sale-price", salePrice));
      tableRow.appendChild(createTextCell(margin, "margin-text-green"));
      tableRow.appendChild(createDiscountCell(mrp, salePrice));

      const actionCell = document.createElement("td");
      const saveButton = createTextElement("button", "Save", "btn btn-primary btn-sm");
      saveButton.type = "button";
      saveButton.addEventListener("click", () => saveRow(tableRow, saveButton));
      actionCell.appendChild(saveButton);
      tableRow.appendChild(actionCell);
      tableBody.appendChild(tableRow);
    });
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
    input.step = "0.01";
    input.value = value === null ? "" : value;
    input.dataset.priceType = type;
    cellElement.appendChild(input);
    return cellElement;
  }

  function createDiscountCell(mrp, salePrice) {
    const cellElement = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "badge";
    updateDiscountBadge(badge, mrp, salePrice);
    cellElement.appendChild(badge);
    return cellElement;
  }

  function updateDiscountBadge(badge, mrp, salePrice) {
    const discount = mrp && salePrice !== null ? ((mrp - salePrice) / mrp) * 100 : 0;
    badge.textContent = discount > 0 ? `${formatPercentage(discount)} OFF` : "No Discount";
    badge.className = discount > 0 ? "badge badge-gold" : "badge badge-gray";
  }

  function showSaveError(button, message) {
    button.textContent = "Error";
    button.title = message;
    button.setAttribute("aria-label", message);
    window.setTimeout(() => {
      button.textContent = "Save";
      button.removeAttribute("aria-label");
    }, 3500);
  }

  async function persistWorkbook() {
    const fileName = "akshar_marbles_product_data_updated.xlsx";
    if (typeof window.showOpenFilePicker !== "function") {
      XLSX.writeFile(workbookState.workbook, fileName);
      window.alert(`Your changes were downloaded as ${fileName}. Replace the workbook in the website's data folder before deployment; the hosted file was not updated.`);
      return;
    }
    try {
      if (!workbookState.fileHandle) {
        const handles = await window.showOpenFilePicker({
          multiple: false,
          types: [{ description: "Excel workbook", accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] } }]
        });
        workbookState.fileHandle = handles[0];
      }
      let permission = await workbookState.fileHandle.queryPermission({ mode: "readwrite" });
      if (permission !== "granted") {
        permission = await workbookState.fileHandle.requestPermission({ mode: "readwrite" });
      }
      if (permission !== "granted") {
        throw new DOMException("Write permission was denied.", "NotAllowedError");
      }
      const writable = await workbookState.fileHandle.createWritable();
      await writable.write(XLSX.write(workbookState.workbook, { bookType: "xlsx", type: "array" }));
      await writable.close();
    } catch (error) {
      if (error.name === "AbortError") {
        throw error;
      }
      if (!["NotAllowedError", "SecurityError", "NotSupportedError"].includes(error.name)) {
        throw error;
      }
      XLSX.writeFile(workbookState.workbook, fileName);
      window.alert(`Write permission was unavailable, so your changes were downloaded as ${fileName}. Replace the workbook in the website's data folder before deployment; the hosted file was not updated.`);
    }
  }

  async function saveRow(tableRow, button) {
    const mrpInput = tableRow.querySelector('[data-price-type="mrp"]');
    const saleInput = tableRow.querySelector('[data-price-type="sale-price"]');
    const mrp = numberCell(mrpInput.value);
    const salePrice = numberCell(saleInput.value);
    if (mrp === null || mrp <= 0 || salePrice === null || salePrice < 0) {
      showSaveError(button, "Enter a valid MRP greater than zero and a non-negative sale price.");
      return;
    }

    const sku = tableRow.dataset.sku;
    const rowNumber = rowNumberForSku(sku);
    if (rowNumber < 0) {
      showSaveError(button, `Product SKU "${sku}" was not found.`);
      return;
    }
    setCellValue(rowNumber, workbookState.columns.mrp, mrp);
    setCellValue(rowNumber, workbookState.columns.salePrice, salePrice);
    const row = workbookState.rows.find((item) => cell(item, "Product ID") === sku);
    row[workbookState.columns.mrpName] = mrp;
    row[workbookState.columns.salePriceName] = salePrice;
    updateDiscountBadge(tableRow.querySelector(".badge"), mrp, salePrice);
    button.disabled = true;
    try {
      await persistWorkbook();
      button.textContent = "Saved";
      button.title = "Workbook saved successfully.";
    } catch (error) {
      showSaveError(button, error.name === "AbortError" ? "File selection was cancelled." : error.message);
    } finally {
      window.setTimeout(() => {
        button.disabled = false;
        button.textContent = "Save";
      }, 2500);
    }
  }

  async function loadWorkbook() {
    if (!window.XLSX) {
      throw new Error("The spreadsheet parser could not be loaded.");
    }
    const response = await fetch(DATA_FILE);
    if (!response.ok) {
      throw new Error(`Product data file could not be loaded (${response.status}).`);
    }
    workbookState.workbook = XLSX.read(await response.arrayBuffer(), { type: "array" });
    workbookState.worksheet = workbookState.workbook.Sheets.Products;
    if (!workbookState.worksheet) {
      throw new Error('The workbook does not contain a "Products" worksheet.');
    }
    workbookState.columns = locateColumns();
    workbookState.rows = XLSX.utils.sheet_to_json(workbookState.worksheet, { defval: "" });
    if (!workbookState.rows.length) {
      throw new Error('The "Products" worksheet does not contain any records.');
    }
    renderRows();
  }

  searchInput.addEventListener("input", renderRows);
  loadWorkbook().catch((error) => {
    tableBody.replaceChildren();
    const row = document.createElement("tr");
    const cellElement = document.createElement("td");
    cellElement.colSpan = 6;
    cellElement.textContent = error.message;
    row.appendChild(cellElement);
    tableBody.appendChild(row);
  });
})();
