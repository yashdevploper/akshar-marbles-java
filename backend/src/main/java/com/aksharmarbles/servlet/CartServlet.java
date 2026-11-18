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
        private Long product_id;
        private Integer quantity;
        private Long customer_id;
        private String session_token;

        public Long getProduct_id() { return product_id; }
        public void setProduct_id(Long product_id) { this.product_id = product_id; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public Long getCustomer_id() { return customer_id; }
        public void setCustomer_id(Long customer_id) { this.customer_id = customer_id; }
        public String getSession_token() { return session_token; }
        public void setSession_token(String session_token) { this.session_token = session_token; }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        CartRequest body = readJson(req, CartRequest.class);
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

            Product product = session.get(Product.class, body.getProduct_id());
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
                    .setParameter("productId", body.getProduct_id())
                    .setMaxResults(1)
                    .uniqueResult();
            if (price == null) {
                sendJson(resp, 409, failure("A current price is not available for this product."));
                tx.rollback();
                return;
            }

            Cart cart = findCart(session, body.getCustomer_id(), body.getSession_token());
            if (cart == null) {
                cart = new Cart();
                if (body.getCustomer_id() != null) {
                    Customer customer = session.get(Customer.class, body.getCustomer_id());
                    if (customer == null) {
                        sendJson(resp, 400, failure("Customer not found."));
                        tx.rollback();
                        return;
                    }
                    cart.setCustomer(customer);
                } else {
                    if (body.getSession_token() == null || body.getSession_token().trim().isEmpty()) {
                        sendJson(resp, 400, failure("A session_token is required for guest carts."));
                        tx.rollback();
                        return;
                    }
                    cart.setSessionToken(body.getSession_token().trim());
                }
                session.persist(cart);
                session.flush();
            }

            NativeQuery<?> upsert = session.createNativeQuery(
                    "INSERT INTO cart_items (cart_id, product_id, quantity, unit_price) " +
                    "VALUES (?, ?, ?, ?) " +
                    "ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity), unit_price = VALUES(unit_price)");
            upsert.setParameter(1, cart.getCartId());
            upsert.setParameter(2, body.getProduct_id());
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

        try (Session session = HibernateUtil.openSession()) {
            Cart cart = findCart(session, customerId, sessionToken);
            List<Map<String, Object>> items = new ArrayList<>();
            if (cart != null) {
                List<Object[]> rows = session.createNativeQuery(
                        "SELECT ci.cart_item_id, ci.product_id, p.product_name, p.image_path, " +
                        "ci.quantity, ci.unit_price " +
                        "FROM cart_items ci JOIN products p ON p.product_id = ci.product_id " +
                        "WHERE ci.cart_id = :cartId ORDER BY ci.cart_item_id")
                        .setParameter("cartId", cart.getCartId())
                        .list();
                for (Object[] row : rows) {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("cart_item_id", row[0]);
                    item.put("product_id", row[1]);
                    item.put("product_name", row[2]);
                    item.put("image_path", row[3]);
                    item.put("quantity", row[4]);
                    item.put("unit_price", row[5]);
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
            return query.setParameter("customerId", customerId).setMaxResults(1).uniqueResult();
        }
        if (sessionToken != null && !sessionToken.trim().isEmpty()) {
            Query<Cart> query = session.createQuery(
                    "from Cart c where c.sessionToken = :sessionToken", Cart.class);
            return query.setParameter("sessionToken", sessionToken.trim()).setMaxResults(1).uniqueResult();
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
}
