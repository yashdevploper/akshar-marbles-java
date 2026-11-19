package com.aksharmarbles.servlet;

import com.aksharmarbles.config.HibernateUtil;
import com.aksharmarbles.entity.Product;
import com.aksharmarbles.entity.ProductPrice;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.hibernate.Session;
import org.hibernate.Transaction;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@WebServlet(name = "AdminPricingServlet", urlPatterns = {"/api/admin/pricing", "/api/admin/pricing/*"})
public class AdminPricingServlet extends BaseServlet {

    public static class PriceUpdateRequest {
        public Object productId;
        public BigDecimal mrp;
        public BigDecimal salePrice;
        public BigDecimal originalPrice;
        public BigDecimal currentPrice;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        String pathId = null;
        if (pathInfo != null && pathInfo.length() > 1) {
            pathId = pathInfo.substring(1);
            if (pathId.endsWith("/")) {
                pathId = pathId.substring(0, pathId.length() - 1);
            }
        }

        try (Session session = HibernateUtil.openSession()) {
            if (pathId != null && !pathId.isEmpty() && !pathId.equalsIgnoreCase("all")) {
                Product product = resolveProduct(session, pathId);
                if (product == null) {
                    sendJson(resp, 404, Map.of("success", false, "message", "Product not found."));
                    return;
                }
                ProductPrice price = getLatestPrice(session, product.getProductId());
                sendJson(resp, Map.of("success", true, "data", formatPricing(product, price)));
                return;
            }

            List<Product> products = session.createQuery(
                    "from Product p order by p.productId asc", Product.class)
                    .list();

            List<Map<String, Object>> list = new ArrayList<>();
            for (Product p : products) {
                ProductPrice price = getLatestPrice(session, p.getProductId());
                list.add(formatPricing(p, price));
            }
            sendJson(resp, Map.of("success", true, "data", list));
        } catch (Exception e) {
            logger.error("Failed to load admin pricing list", e);
            sendJson(resp, 500, Map.of("success", false, "message", "Unable to load pricing data: " + e.getMessage()));
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        handlePriceUpdate(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        handlePriceUpdate(req, resp);
    }

    private void handlePriceUpdate(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String pathInfo = req.getPathInfo();
        String pathId = null;
        if (pathInfo != null && pathInfo.length() > 1) {
            pathId = pathInfo.substring(1);
            if (pathId.endsWith("/")) {
                pathId = pathId.substring(0, pathId.length() - 1);
            }
        }

        PriceUpdateRequest body = readJson(req, PriceUpdateRequest.class);
        if (body == null) {
            sendJson(resp, 400, Map.of("success", false, "message", "Invalid JSON payload."));
            return;
        }

        Object targetId = (pathId != null && !pathId.isEmpty()) ? pathId : body.productId;
        if (targetId == null) {
            sendJson(resp, 400, Map.of("success", false, "message", "Product ID or code is required."));
            return;
        }

        BigDecimal salePrice = body.salePrice != null ? body.salePrice : body.currentPrice;
        BigDecimal mrp = body.mrp != null ? body.mrp : body.originalPrice;

        if (salePrice == null || salePrice.compareTo(BigDecimal.ZERO) < 0) {
            sendJson(resp, 400, Map.of("success", false, "message", "Sale price must be a non-negative number."));
            return;
        }

        Transaction tx = null;
        try (Session session = HibernateUtil.openSession()) {
            tx = session.beginTransaction();
            Product product = resolveProduct(session, targetId);
            if (product == null) {
                tx.rollback();
                sendJson(resp, 404, Map.of("success", false, "message", "Product not found."));
                return;
            }

            ProductPrice price = getLatestPrice(session, product.getProductId());
            if (price != null) {
                price.setCurrentPrice(salePrice);
                price.setOriginalPrice(mrp);
                session.merge(price);
            } else {
                price = new ProductPrice();
                price.setProduct(product);
                price.setCurrentPrice(salePrice);
                price.setOriginalPrice(mrp);
                price.setPriceUnit("/sqft");
                price.setEffectiveFrom(LocalDateTime.now());
                session.persist(price);
            }

            tx.commit();

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("productId", product.getProductId());
            data.put("productCode", product.getProductCode());
            data.put("name", product.getProductName());
            data.put("salePrice", salePrice);
            data.put("mrp", mrp);
            sendJson(resp, Map.of("success", true, "message", "Price updated in database.", "data", data));
        } catch (Exception e) {
            if (tx != null && tx.isActive()) {
                tx.rollback();
            }
            logger.error("Failed to update product price in database", e);
            sendJson(resp, 500, Map.of("success", false, "message", "Database error: " + e.getMessage()));
        }
    }

    private Product resolveProduct(Session session, Object rawId) {
        if (rawId == null) return null;
        String str = rawId.toString().trim();
        if (str.isEmpty()) return null;
        try {
            Long id = Long.parseLong(str);
            Product p = session.get(Product.class, id);
            if (p != null) return p;
        } catch (NumberFormatException ignored) {}

        return session.createQuery("from Product p where lower(p.productCode) = :code", Product.class)
                .setParameter("code", str.toLowerCase())
                .setMaxResults(1)
                .uniqueResult();
    }

    private ProductPrice getLatestPrice(Session session, Long productId) {
        return session.createQuery(
                "from ProductPrice pp where pp.product.productId = :pid order by pp.effectiveFrom desc, pp.priceId desc",
                ProductPrice.class)
                .setParameter("pid", productId)
                .setMaxResults(1)
                .uniqueResult();
    }

    private Map<String, Object> formatPricing(Product p, ProductPrice price) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", p.getProductId());
        item.put("code", p.getProductCode());
        item.put("name", p.getProductName());
        item.put("category", p.getCategory() != null ? p.getCategory().getCategoryName() : "General");
        item.put("origin", p.getOrigin() != null ? p.getOrigin() : "");
        item.put("mrp", price != null && price.getOriginalPrice() != null ? price.getOriginalPrice() : null);
        item.put("salePrice", price != null ? price.getCurrentPrice() : BigDecimal.ZERO);
        item.put("priceUnit", price != null ? price.getPriceUnit() : "/sqft");
        return item;
    }
}
