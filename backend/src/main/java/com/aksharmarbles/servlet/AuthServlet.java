package com.aksharmarbles.servlet;

import com.aksharmarbles.entity.Customer;
import com.aksharmarbles.config.HibernateUtil;
import com.aksharmarbles.util.SecurityUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.hibernate.Session;
import org.hibernate.Transaction;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

@WebServlet(name = "AuthServlet", urlPatterns = {"/api/auth/register", "/api/auth/login", "/api/auth/me", "/api/auth/logout"})
public class AuthServlet extends BaseServlet {
    public static class AuthRequest {
        public String name;
        public String full_name;
        public String email;
        public String phone;
        public String password;
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getServletPath();
        if (path.endsWith("/register")) {
            register(req, resp);
        } else if (path.endsWith("/login")) {
            login(req, resp);
        } else if (path.endsWith("/logout")) {
            logout(req, resp);
        } else {
            sendJson(resp, 404, Map.of("success", false, "message", "Auth endpoint not found."));
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!req.getServletPath().endsWith("/me")) {
            sendJson(resp, 404, Map.of("success", false, "message", "Auth endpoint not found."));
            return;
        }
        Object user = req.getSession(false) != null ? req.getSession(false).getAttribute("clientUser") : null;
        if (user == null) {
            sendJson(resp, 401, Map.of("success", false, "message", "Not signed in."));
            return;
        }
        sendJson(resp, Map.of("success", true, "user", user));
    }

    private void register(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        AuthRequest body = readJson(req, AuthRequest.class);
        if (body == null || body.email == null || body.password == null) {
            sendJson(resp, 400, Map.of("success", false, "message", "Email and password are required."));
            return;
        }
        String email = body.email.trim().toLowerCase();
        String name = body.full_name != null ? body.full_name.trim() :
                (body.name != null ? body.name.trim() : "");
        if (email.isEmpty() || name.isEmpty() || body.password.length() < 8) {
            sendJson(resp, 400, Map.of("success", false, "message", "Enter a name and a password of at least 8 characters."));
            return;
        }

        try (Session session = HibernateUtil.openSession()) {
            Transaction tx = session.beginTransaction();
            Customer existing = session.createQuery("from Customer c where c.email = :email", Customer.class)
                    .setParameter("email", email).setMaxResults(1).uniqueResult();
            if (existing != null) {
                tx.rollback();
                sendJson(resp, 409, Map.of("success", false, "message", "An account with this email already exists."));
                return;
            }
            Customer customer = new Customer();
            customer.setFullName(name);
            customer.setEmail(email);
            customer.setPhone(body.phone);
            customer.setPasswordHash(SecurityUtil.hashPassword(body.password));
            session.persist(customer);
            session.flush();
            tx.commit();

            Map<String, Object> user = clientUser(customer);
            req.getSession(true).setAttribute("clientUser", user);
            sendJson(resp, Map.of("success", true, "message", "Account created.", "user", user));
        } catch (Exception e) {
            logger.error("Customer registration failed", e);
            sendJson(resp, 500, Map.of("success", false, "message", "Unable to create account."));
        }
    }

    private void login(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        AuthRequest body = readJson(req, AuthRequest.class);
        if (body == null || body.email == null || body.password == null) {
            sendJson(resp, 400, Map.of("success", false, "message", "Email and password are required."));
            return;
        }
        String identifier = body.email.trim().toLowerCase();
        try (Session session = HibernateUtil.openSession()) {
            Customer customer = session.createQuery(
                    "from Customer c where c.email = :email or c.phone = :phone",
                    Customer.class)
                    .setParameter("email", identifier)
                    .setParameter("phone", body.email.trim())
                    .setMaxResults(1).uniqueResult();
            if (customer == null || !SecurityUtil.checkPassword(body.password, customer.getPasswordHash())) {
                sendJson(resp, 401, Map.of("success", false, "message", "Invalid email or password."));
                return;
            }
            Map<String, Object> user = clientUser(customer);
            req.getSession(true).setAttribute("clientUser", user);
            sendJson(resp, Map.of("success", true, "message", "Signed in.", "user", user));
        } catch (Exception e) {
            logger.error("Customer login failed", e);
            sendJson(resp, 500, Map.of("success", false, "message", "Unable to sign in."));
        }
    }

    private void logout(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpSession session = req.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        sendJson(resp, Map.of("success", true, "message", "Signed out."));
    }

    private Map<String, Object> clientUser(Customer customer) {
        Map<String, Object> user = new LinkedHashMap<>();
        user.put("id", customer.getCustomerId());
        user.put("name", customer.getFullName());
        user.put("email", customer.getEmail());
        user.put("phone", customer.getPhone());
        user.put("role", "client");
        user.put("tier", "Member");
        user.put("avatar", "../assets/avatar-ananya.svg");
        return user;
    }
}
