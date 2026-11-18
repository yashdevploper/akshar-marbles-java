package com.aksharmarbles.servlet;

import com.aksharmarbles.dto.ApiResponse;
import com.aksharmarbles.dto.PageResponse;
import com.aksharmarbles.dto.ProductDetailDto;
import com.aksharmarbles.dto.ProductSummaryDto;
import com.aksharmarbles.service.ProductService;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;

@WebServlet(name = "ProductServlet", urlPatterns = {"/api/products", "/api/products/*"})
public class ProductServlet extends BaseServlet {

    private final ProductService productService = new ProductService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();

        // 1. If path is "/all", return all active products (used by cart / catalogue cache)
        if (pathInfo != null && pathInfo.equalsIgnoreCase("/all")) {
            List<ProductSummaryDto> all = productService.getAllActiveProducts();
            sendJson(resp, ApiResponse.ok(all));
            return;
        }

        // 2. If pathInfo is null, empty, or "/", handle list and filter query
        if (pathInfo == null || pathInfo.trim().isEmpty() || pathInfo.equals("/")) {
            handleProductList(req, resp);
            return;
        }

        // 3. If path is "/search", handle search
        if (pathInfo.equalsIgnoreCase("/search")) {
            handleProductList(req, resp);
            return;
        }

        // 4. Otherwise, it's a detail request: /api/products/{idOrCode}
        String idOrCode = pathInfo.startsWith("/") ? pathInfo.substring(1) : pathInfo;
        if (idOrCode.endsWith("/")) {
            idOrCode = idOrCode.substring(0, idOrCode.length() - 1);
        }

        ProductDetailDto detail = productService.getProductDetail(idOrCode);
        sendJson(resp, ApiResponse.ok(detail));
    }

    private void handleProductList(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String category = req.getParameter("category");
        String origin = req.getParameter("origin");
        String finish = req.getParameter("finish");
        String stoneType = req.getParameter("stoneType");
        String stockStatus = req.getParameter("stockStatus");
        String search = req.getParameter("search");
        if (search == null || search.trim().isEmpty()) {
            search = req.getParameter("q");
        }
        String sort = req.getParameter("sort");

        BigDecimal minPrice = null;
        String minPriceStr = req.getParameter("minPrice");
        if (minPriceStr != null && !minPriceStr.trim().isEmpty()) {
            try {
                minPrice = new BigDecimal(minPriceStr.trim());
            } catch (NumberFormatException ignored) {}
        }

        BigDecimal maxPrice = null;
        String maxPriceStr = req.getParameter("maxPrice");
        if (maxPriceStr != null && !maxPriceStr.trim().isEmpty()) {
            try {
                maxPrice = new BigDecimal(maxPriceStr.trim());
            } catch (NumberFormatException ignored) {}
        }

        int page = 1;
        String pageStr = req.getParameter("page");
        if (pageStr != null && !pageStr.trim().isEmpty()) {
            try {
                page = Integer.parseInt(pageStr.trim());
            } catch (NumberFormatException ignored) {}
        }

        int size = 12;
        String sizeStr = req.getParameter("size");
        if (sizeStr != null && !sizeStr.trim().isEmpty()) {
            try {
                size = Integer.parseInt(sizeStr.trim());
            } catch (NumberFormatException ignored) {}
        }

        PageResponse<ProductSummaryDto> result = productService.getFilteredProducts(
                category, origin, finish, stoneType, stockStatus, minPrice, maxPrice, search, sort, page, size);

        sendJson(resp, ApiResponse.ok(result));
    }
}
