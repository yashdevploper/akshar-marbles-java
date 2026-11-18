package com.aksharmarbles;

import com.aksharmarbles.config.HibernateUtil;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class HibernateValidationTest {

    @Test
    void testSessionFactoryCreationAndSchemaValidation() {
        SessionFactory sessionFactory = HibernateUtil.getSessionFactory();
        assertNotNull(sessionFactory, "SessionFactory should not be null");
        assertTrue(sessionFactory.isOpen(), "SessionFactory should be open");

        try (Session session = HibernateUtil.openSession()) {
            assertNotNull(session, "Session should not be null");
            assertTrue(session.isOpen(), "Session should be open");
            
            // Execute a simple test query to verify live connection
            Object result = session.createNativeQuery("SELECT DATABASE()").getSingleResult();
            System.out.println("Connected to MySQL/MariaDB database: " + result);
        }
    }

    @AfterAll
    static void tearDown() {
        HibernateUtil.shutdown();
    }
}
