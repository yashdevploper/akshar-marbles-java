package com.aksharmarbles.dao;

import com.aksharmarbles.config.HibernateUtil;
import org.hibernate.Session;
import org.hibernate.Transaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.Serializable;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;

public class BaseDao<T, ID extends Serializable> {

    protected final Logger logger = LoggerFactory.getLogger(getClass());

    public Optional<T> findById(Class<T> entityClass, ID id) {
        return execute(session -> Optional.ofNullable(session.get(entityClass, id)));
    }

    public List<T> findAll(Class<T> entityClass) {
        return execute(session -> session.createQuery("from " + entityClass.getSimpleName(), entityClass).list());
    }

    public T save(T entity) {
        return executeInTransaction(session -> {
            session.persist(entity);
            return entity;
        });
    }

    public T update(T entity) {
        return executeInTransaction(session -> session.merge(entity));
    }

    public void delete(T entity) {
        executeInTransaction(session -> {
            session.remove(session.contains(entity) ? entity : session.merge(entity));
            return null;
        });
    }

    public <R> R execute(Function<Session, R> action) {
        try (Session session = HibernateUtil.openSession()) {
            return action.apply(session);
        }
    }

    public <R> R executeInTransaction(Function<Session, R> action) {
        Transaction tx = null;
        try (Session session = HibernateUtil.openSession()) {
            tx = session.beginTransaction();
            R result = action.apply(session);
            tx.commit();
            return result;
        } catch (Exception e) {
            if (tx != null && tx.isActive()) {
                try {
                    tx.rollback();
                } catch (Exception rbEx) {
                    logger.error("Failed to rollback transaction", rbEx);
                }
            }
            throw e;
        }
    }
}
