package com.aksharmarbles.config;

import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.SessionCookieConfig;
import jakarta.servlet.annotation.WebListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.Driver;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Enumeration;

@WebListener
public class AppContextListener implements ServletContextListener {

    private static final Logger logger = LoggerFactory.getLogger(AppContextListener.class);

    @Override
    public void contextInitialized(ServletContextEvent sce) {
        String env = AppConfig.getEnvironment();
        logger.info("=================================================");
        logger.info("Starting Akshar Marbles Web Application");
        logger.info("Environment: {}", env);
        logger.info("Database configured: {}", AppConfig.get("db.url") != null ? "YES" : "NO");
        logger.info("=================================================");

        // Configure session cookies
        SessionCookieConfig cookieConfig = sce.getServletContext().getSessionCookieConfig();
        cookieConfig.setName("AKSHAR_SESSION_ID");
        cookieConfig.setHttpOnly(true);
        if (AppConfig.isProduction()) {
            cookieConfig.setSecure(true);
            logger.info("Production mode: Secure cookie attribute enabled.");
        } else {
            logger.info("Development mode: Secure cookie attribute relaxed for localhost.");
        }
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        logger.info("Shutting down Akshar Marbles Web Application...");
        HibernateUtil.shutdown();

        // Deregister JDBC drivers to prevent classloader memory leaks
        Enumeration<Driver> drivers = DriverManager.getDrivers();
        while (drivers.hasMoreElements()) {
            Driver driver = drivers.nextElement();
            try {
                DriverManager.deregisterDriver(driver);
                logger.info("Deregistered JDBC driver: {}", driver);
            } catch (SQLException e) {
                logger.warn("Error deregistering JDBC driver {}: {}", driver, e.getMessage());
            }
        }
    }
}
