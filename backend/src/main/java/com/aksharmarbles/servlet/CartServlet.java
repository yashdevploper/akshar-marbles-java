package com.aksharmarbles.servlet;

import com.aksharmarbles.config.HibernateUtil;
import com.aksharmarbles.entity.Cart;
import com.aksharmarbles.entity.Customer;
import com.aksharmarbles.entity.Product;
import com.aksharmarbles.entity.ProductPrice;
import com.aksharmarbles.entity.StockStatus;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.hibernate.Session;
import org.hibernate.Transaction;
import org.hibernate.query.NativeQuery;
import org.hibernate.query.Query;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@WebServlet(name = "CartServlet", urlPatterns = {"/api/cart", "/api/cart/items", "/api/cart/items/*"})
public class CartServlet extends BaseServlet {

    private static final int MAX_QUANTITY = 100000;

    public static class CartRequest {
        private Object product_id;
        private Integer quantity;
        private Object customer_id;
        private String session_token;

        public Object getProduct_id() { return product_id; }
        public void setProduct_id(Object product_id) { this.product_id = product_id; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public Object getCustomer_id() { return customer_id; }
        public void setCustomer_id(Object customer_id) { this.customer_id = customer_id; }
        public String getSession_token() { return session_token; }
        public void setSession_token(String session_token) { this.session_token = session_token; }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        updateCartItem(req, resp, false);
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        updateCartItem(req, resp, true);
    }

    private void updateCartItem(HttpServletRequest req, HttpServletResponse resp, boolean remove) throws IOException {
        Long productId = parseOptionalLong(getPathId(req));
        CartRequest body = remove ? null : readJson(req, CartRequest.class);
        if (productId == null || (!remove && (body == null || body.getQuantity() == null
                || body.getQuantity() < 1 || body.getQuantity() > MAX_QUANTITY))) {
            sendJson(resp, 400, failure(remove ? "A valid product id is required."
                    : "Quantity must be a whole number from 1 to " + MAX_QUANTITY + "."));
            return;
        }

        try (Session session = HibernateUtil.openSession()) {
            Transaction tx = session.beginTransaction();
            Long customerId = remove ? parseOptionalLong(req.getParameter("customer_id")) : resolveCustomerId(body.getCustomer_id());
            String sessionToken = remove ? req.getParameter("session_token") : body.getSession_token();
            if (sessionToken == null || sessionToken.trim().isEmpty()) {
                String raw = remove ? req.getParameter("customer_id") : (body.getCustomer_id() != null ? body.getCustomer_id().toString() : null);
                if (raw != null && !raw.trim().isEmpty() && customerId == null) {
                    sessionToken = raw.trim().startsWith("user_") ? raw.trim() : "user_" + raw.trim();
                }
            }
            Cart cart = findCart(session, customerId, sessionToken);
            if (cart == null) {
                tx.rollback();
                sendJson(resp, 404, failure("Cart not found."));
                return;
            }
            NativeQuery<?> itemQuery = session.createNativeQuery(remove
                    ? "DELETE FROM cart_items WHERE cart_id = :cartId AND product_id = :productId"
                    : "UPDATE cart_items SET quantity = :quantity WHERE cart_id = :cartId AND product_id = :productId")
                    .setParameter("cartId", cart.getCartId())
                    .setParameter("productId", productId);
            if (!remove) {
                itemQuery.setParameter("quantity", body.getQuantity());
            }
            int changed = itemQuery.executeUpdate();
            if (changed == 0) {
                tx.rollback();
                sendJson(resp, 404, failure("Cart item not found."));
                return;
            }
            Map<String, Object> totals = getCartTotals(session, cart.getCartId());
            tx.commit();
            sendJson(resp, success("Cart updated.", totals));
        } catch (Exception e) {
            logger.error("Failed to update cart item", e);
            sendJson(resp, 500, failure("Unable to update cart."));
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        CartRequest body;
        try {
            body = readJson(req, CartRequest.class);
        } catch (Exception e) {
            sendJson(resp, 400, failure("Invalid JSON payload."));
            return;
        }
        Transaction tx = null;

        try (Session session = HibernateUtil.openSession()) {
            tx = session.beginTransaction();

            if (body == null || body.getProduct_id() == null) {
                sendJson(resp, 400, failure("A valid product_id is required."));
                tx.rollback();
                return;
            }
            if (body.getQuantity() == null || body.getQuantity() < 1 || body.getQuantity() > MAX_QUANTITY) {
                sendJson(resp, 400, failure("Quantity must be a whole number from 1 to " + MAX_QUANTITY + "."));
                tx.rollback();
                return;
            }

            Long resolvedProductId = resolveProductId(session, body.getProduct_id());
            if (resolvedProductId == null) {
                sendJson(resp, 404, failure("Product not found."));
                tx.rollback();
                return;
            }

            Product product = session.get(Product.class, resolvedProductId);
            if (product == null) {
                sendJson(resp, 404, failure("Product not found."));
                tx.rollback();
                return;
            }
            if (!Boolean.TRUE.equals(product.getIsActive())) {
                sendJson(resp, 409, failure("This product is not available."));
                tx.rollback();
                return;
            }
            if (product.getStockStatus() == StockStatus.OUT_OF_STOCK) {
                sendJson(resp, 409, failure("This product is out of stock."));
                tx.rollback();
                return;
            }

            ProductPrice price = session.createQuery(
                    "from ProductPrice pp where pp.product.productId = :productId " +
                    "order by pp.effectiveFrom desc, pp.priceId desc", ProductPrice.class)
                    .setParameter("productId", resolvedProductId)
                    .setMaxResults(1)
                    .uniqueResult();
            if (price == null) {
                sendJson(resp, 409, failure("A current price is not available for this product."));
                tx.rollback();
                return;
            }

            Long customerId = resolveCustomerId(body.getCustomer_id());
            String sessionToken = body.getSession_token();
            if (sessionToken == null || sessionToken.trim().isEmpty()) {
                if (body.getCustomer_id() != null && customerId == null) {
                    String raw = body.getCustomer_id().toString().trim();
                    if (!raw.isEmpty()) {
                        sessionToken = raw.startsWith("user_") ? raw : "user_" + raw;
                    }
                }
            }

            Cart cart = findCart(session, customerId, sessionToken);
            if (cart == null) {
                cart = new Cart();
                if (customerId != null) {
                    Customer customer = session.get(Customer.class, customerId);
                    if (customer == null) {
                        if (sessionToken == null || sessionToken.trim().isEmpty()) {
                            sessionToken = "user_" + customerId;
                        }
                        cart.setSessionToken(sessionToken.trim());
                    } else {
                        cart.setCustomer(customer);
                    }
                } else {
                    if (sessionToken == null || sessionToken.trim().isEmpty()) {
                        sendJson(resp, 400, failure("A session_token is required for guest carts."));
                        tx.rollback();
                        return;
                    }
                    cart.setSessionToken(sessionToken.trim());
                }
                session.persist(cart);
                session.flush();
            }

            NativeQuery<?> upsert = session.createNativeQuery(
                    "INSERT INTO cart_items (cart_id, product_id, quantity, unit_price) " +
                    "VALUES (?, ?, ?, ?) " +
                    "ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity), unit_price = VALUES(unit_price)");
            upsert.setParameter(1, cart.getCartId());
            upsert.setParameter(2, resolvedProductId);
            upsert.setParameter(3, body.getQuantity());
            upsert.setParameter(4, price.getCurrentPrice());
            upsert.executeUpdate();

            Map<String, Object> totals = getCartTotals(session, cart.getCartId());
            tx.commit();
            sendJson(resp, success("Added to cart.", totals));
        } catch (Exception e) {
            if (tx != null && tx.isActive()) {
                tx.rollback();
            }
            logger.error("Failed to add cart item", e);
            sendJson(resp, 500, failure("Unable to add item to cart."));
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        Long customerId = parseOptionalLong(req.getParameter("customer_id"));
        String sessionToken = req.getParameter("session_token");
        if ((sessionToken == null || sessionToken.trim().isEmpty()) && req.getParameter("customer_id") != null) {
            String rawCustomer = req.getParameter("customer_id").trim();
            if (customerId == null && !rawCustomer.isEmpty()) {
                sessionToken = rawCustomer.startsWith("user_") ? rawCustomer : "user_" + rawCustomer;
            }
        }

        try (Session session = HibernateUtil.openSession()) {
            Cart cart = findCart(session, customerId, sessionToken);
            List<Map<String, Object>> items = new ArrayList<>();
            if (cart != null) {
                List<Object[]> rows = session.createNativeQuery(
                        "SELECT ci.cart_item_id, ci.product_id, p.product_code, p.product_name, p.image_path, " +
                        "ci.quantity, ci.unit_price " +
                        "FROM cart_items ci JOIN products p ON p.product_id = ci.product_id " +
                        "WHERE ci.cart_id = :cartId ORDER BY ci.cart_item_id")
                        .setParameter("cartId", cart.getCartId())
                        .list();
                for (Object[] row : rows) {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("cart_item_id", row[0]);
                    item.put("product_id", row[1]);
                    item.put("product_code", row[2]);
                    item.put("product_name", row[3]);
                    item.put("image_path", row[4]);
                    item.put("quantity", row[5]);
                    item.put("unit_price", row[6]);
                    items.add(item);
                }
            }
            Map<String, Object> totals = cart == null ? getEmptyTotals() : getCartTotals(session, cart.getCartId());
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("success", true);
            response.put("items", items);
            response.putAll(totals);
            sendJson(resp, response);
        } catch (Exception e) {
            logger.error("Failed to load cart", e);
            sendJson(resp, 500, failure("Unable to load cart."));
        }
    }

    private Cart findCart(Session session, Long customerId, String sessionToken) {
        if (customerId != null) {
            Query<Cart> query = session.createQuery(
                    "from Cart c where c.customer.customerId = :customerId", Cart.class);
            Cart cart = query.setParameter("customerId", customerId).setMaxResults(1).uniqueResult();
            if (cart != null) {
                return cart;
            }
        }
        if (sessionToken != null && !sessionToken.trim().isEmpty()) {
            Query<Cart> query = session.createQuery(
                    "from Cart c where c.sessionToken = :sessionToken", Cart.class);
            Cart cart = query.setParameter("sessionToken", sessionToken.trim()).setMaxResults(1).uniqueResult();
            if (cart != null) {
                return cart;
            }
            // If passed with or without user_ prefix, check alternate
            String alt = sessionToken.trim().startsWith("user_")
                    ? sessionToken.trim().substring(5)
                    : "user_" + sessionToken.trim();
            Cart altCart = query.setParameter("sessionToken", alt).setMaxResults(1).uniqueResult();
            if (altCart != null) {
                return altCart;
            }
        }
        return null;
    }

    private Map<String, Object> getCartTotals(Session session, Long cartId) {
        Object[] row = (Object[]) session.createNativeQuery(
                "SELECT COALESCE(SUM(quantity), 0), COALESCE(SUM(quantity * unit_price), 0) " +
                "FROM cart_items WHERE cart_id = :cartId")
                .setParameter("cartId", cartId)
                .uniqueResult();
        Map<String, Object> totals = new LinkedHashMap<>();
        totals.put("cartCount", row[0] instanceof Number ? ((Number) row[0]).intValue() : 0);
        totals.put("cartTotal", row[1] == null ? BigDecimal.ZERO : new BigDecimal(row[1].toString()));
        return totals;
    }

    private Map<String, Object> getEmptyTotals() {
        Map<String, Object> totals = new LinkedHashMap<>();
        totals.put("cartCount", 0);
        totals.put("cartTotal", BigDecimal.ZERO);
        return totals;
    }

    private Map<String, Object> success(String message, Map<String, Object> totals) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", true);
        response.put("message", message);
        response.putAll(totals);
        return response;
    }

    private Map<String, Object> failure(String message) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", false);
        response.put("message", message);
        return response;
    }

    private Long resolveCustomerId(Object raw) {
        if (raw == null) {
            return null;
        }
        if (raw instanceof Number number) {
            return number.longValue();
        }
        return parseOptionalLong(raw.toString());
    }

    private Long resolveProductId(Session session, Object rawId) {
        if (rawId == null) {
            return null;
        }
        if (rawId instanceof Number number) {
            return number.longValue();
        }
        String str = rawId.toString().trim();
        if (str.isEmpty()) {
            return null;
        }
        try {
            return Long.parseLong(str);
        } catch (NumberFormatException e) {
            Product prod = session.createQuery(
                    "from Product p where p.productCode = :code", Product.class)
                    .setParameter("code", str)
                    .setMaxResults(1)
                    .uniqueResult();
            if (prod != null) {
                return prod.getProductId();
            }
            String digits = str.replaceAll("[^0-9]", "");
            if (!digits.isEmpty()) {
                try {
                    return Long.parseLong(digits);
                } catch (NumberFormatException ignored) {}
            }
            return null;
        }
    }

    private Long parseOptionalLong(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String getPathId(HttpServletRequest req) {
        String path = req.getPathInfo();
        if (path == null || path.length() <= 1) {
            return null;
        }
        String[] segments = path.split("/");
        return segments.length == 2 ? segments[1] : null;
    }
}
