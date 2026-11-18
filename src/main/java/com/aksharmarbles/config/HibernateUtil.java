package com.aksharmarbles.config;

import com.aksharmarbles.entity.*;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.hibernate.cfg.Configuration;
import org.hibernate.service.ServiceRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Singleton SessionFactory manager with HikariCP connection pooling
 * and strict Hibernate schema validation.
 */
public final class HibernateUtil {

    private static final Logger logger = LoggerFactory.getLogger(HibernateUtil.class);
    private static SessionFactory sessionFactory;

    static {
        try {
            buildSessionFactory();
        } catch (Exception e) {
            logger.error("Initial SessionFactory creation failed: {}", e.getMessage(), e);
            throw new ExceptionInInitializerError(e);
        }
    }

    private HibernateUtil() {
    }

    private static synchronized void buildSessionFactory() {
        if (sessionFactory != null && !sessionFactory.isClosed()) {
            return;
        }

        logger.info("Initializing Hibernate SessionFactory with HikariCP...");

        Configuration configuration = new Configuration();

        // Database connection settings
        configuration.setProperty("hibernate.connection.driver_class", 
                AppConfig.get("db.driver", "com.mysql.cj.jdbc.Driver"));
        configuration.setProperty("hibernate.connection.url", 
                AppConfig.get("db.url"));
        configuration.setProperty("hibernate.connection.username", 
                AppConfig.get("db.username", "root"));
        configuration.setProperty("hibernate.connection.password", 
                AppConfig.get("db.password", ""));

        // HikariCP connection pool settings
        configuration.setProperty("hibernate.connection.provider_class", 
                "org.hibernate.hikaricp.internal.HikariCPConnectionProvider");
        configuration.setProperty("hibernate.hikari.maximumPoolSize", 
                AppConfig.get("hikari.maximumPoolSize", "10"));
        configuration.setProperty("hibernate.hikari.minimumIdle", 
                AppConfig.get("hikari.minimumIdle", "2"));
        configuration.setProperty("hibernate.hikari.idleTimeout", 
                AppConfig.get("hikari.idleTimeout", "30000"));
        configuration.setProperty("hibernate.hikari.connectionTimeout", 
                AppConfig.get("hikari.connectionTimeout", "20000"));
        configuration.setProperty("hibernate.hikari.maxLifetime", 
                AppConfig.get("hikari.maxLifetime", "1800000"));

        // Hibernate Dialect: if explicitly configured (and not "auto"), apply it;
        // otherwise Hibernate 6 automatically resolves the optimal dialect (MySQLDialect vs MariaDBDialect)
        // based on the live JDBC connection metadata!
        String dialect = AppConfig.get("hibernate.dialect");
        if (dialect != null && !dialect.trim().isEmpty() && !dialect.equalsIgnoreCase("auto")) {
            configuration.setProperty("hibernate.dialect", dialect.trim());
        }
        configuration.setProperty("hibernate.hbm2ddl.auto", 
                AppConfig.get("hibernate.hbm2ddl.auto", "validate"));
        configuration.setProperty("hibernate.show_sql", 
                AppConfig.get("hibernate.show_sql", "false"));
        configuration.setProperty("hibernate.format_sql", 
                AppConfig.get("hibernate.format_sql", "false"));

        // Register all 22 Entities
        configuration.addAnnotatedClass(Admin.class);
        configuration.addAnnotatedClass(Category.class);
        configuration.addAnnotatedClass(Product.class);
        configuration.addAnnotatedClass(ProductSpecification.class);
        configuration.addAnnotatedClass(ProductImage.class);
        configuration.addAnnotatedClass(ProductPrice.class);
        configuration.addAnnotatedClass(ProductRatingSummary.class);
        configuration.addAnnotatedClass(ProductReview.class);
        configuration.addAnnotatedClass(Customer.class);
        configuration.addAnnotatedClass(CustomerAddress.class);
        configuration.addAnnotatedClass(Discount.class);
        configuration.addAnnotatedClass(ProductDiscount.class);
        configuration.addAnnotatedClass(Inventory.class);
        configuration.addAnnotatedClass(InventoryMovement.class);
        configuration.addAnnotatedClass(Cart.class);
        configuration.addAnnotatedClass(CartItem.class);
        configuration.addAnnotatedClass(Wishlist.class);
        configuration.addAnnotatedClass(Order.class);
        configuration.addAnnotatedClass(OrderItem.class);
        configuration.addAnnotatedClass(Shipment.class);
        configuration.addAnnotatedClass(OrderStatusHistory.class);
        configuration.addAnnotatedClass(WebsitePage.class);

        ServiceRegistry serviceRegistry = new StandardServiceRegistryBuilder()
                .applySettings(configuration.getProperties()).build();

        sessionFactory = configuration.buildSessionFactory(serviceRegistry);
        logger.info("Hibernate SessionFactory initialized and schema validated successfully.");
    }

    public static SessionFactory getSessionFactory() {
        if (sessionFactory == null || sessionFactory.isClosed()) {
            buildSessionFactory();
        }
        return sessionFactory;
    }

    public static Session openSession() {
        return getSessionFactory().openSession();
    }

    public static synchronized void shutdown() {
        if (sessionFactory != null && !sessionFactory.isClosed()) {
            logger.info("Closing Hibernate SessionFactory...");
            sessionFactory.close();
            sessionFactory = null;
        }
    }
}
