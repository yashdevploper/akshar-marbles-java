package com.aksharmarbles.servlet;

import com.aksharmarbles.config.HibernateUtil;
import com.aksharmarbles.entity.Admin;
import com.aksharmarbles.util.SecurityUtil;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.hibernate.Session;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.Map;

@WebServlet(name = "AdminAuthServlet", urlPatterns = {"/api/admin/auth/login", "/api/admin/auth/me", "/api/admin/auth/logout"})
public class AdminAuthServlet extends BaseServlet {
    public static class AdminAuthRequest {
        public String email;
        public String password;
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (req.getServletPath().endsWith("/logout")) {
            HttpSession session = req.getSession(false);
            if (session != null) {
                session.invalidate();
            }
            sendJson(resp, Map.of("success", true, "message", "Signed out."));
            return;
        }
        login(req, resp);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpSession session = req.getSession(false);
        Object user = session != null ? session.getAttribute("adminUser") : null;
        if (user == null) {
            sendJson(resp, 401, Map.of("success", false, "message", "Not signed in."));
            return;
        }
        sendJson(resp, Map.of("success", true, "user", user));
    }

    private void login(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        AdminAuthRequest body = readJson(req, AdminAuthRequest.class);
        if (body == null || body.email == null || body.password == null) {
            sendJson(resp, 400, Map.of("success", false, "message", "Email and password are required."));
            return;
        }
        String identifier = body.email.trim().toLowerCase();
        try (Session hibernate = HibernateUtil.openSession()) {
            Admin admin = hibernate.createQuery(
                    "from Admin a where lower(a.email) = :email or lower(a.username) = :email",
                    Admin.class)
                    .setParameter("email", identifier)
                    .setMaxResults(1).uniqueResult();
            if (admin == null || !SecurityUtil.checkPassword(body.password, admin.getPasswordHash())) {
                sendJson(resp, 401, Map.of("success", false, "message", "Invalid email or password."));
                return;
            }
            Map<String, Object> user = new LinkedHashMap<>();
            user.put("id", "ADM-" + admin.getAdminId());
            user.put("name", admin.getUsername());
            user.put("email", admin.getEmail());
            user.put("role", "admin");
            user.put("title", "Super Admin");
            user.put("avatar", "../assets/avatar-rajan.svg");
            req.getSession(true).setAttribute("adminUser", user);
            sendJson(resp, Map.of("success", true, "message", "Signed in.", "user", user));
        } catch (Exception e) {
            logger.error("Admin login failed", e);
            sendJson(resp, 500, Map.of("success", false, "message", "Unable to sign in."));
        }
    }
}
