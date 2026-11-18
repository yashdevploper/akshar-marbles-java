package com.aksharmarbles.dao;

import com.aksharmarbles.entity.Product;
import com.aksharmarbles.entity.StockStatus;
import org.hibernate.Hibernate;
import org.hibernate.query.Query;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

public class ProductDao extends BaseDao<Product, Long> {

    public Optional<Product> findDetailById(Long id) {
        return execute(session -> {
            Product p = session.createQuery(
                    "select distinct p from Product p " +
                    "join fetch p.category " +
                    "left join fetch p.specification " +
                    "left join fetch p.ratingSummary " +
                    "left join fetch p.inventory " +
                    "where p.productId = :id and p.isActive = true", Product.class)
                    .setParameter("id", id)
                    .uniqueResult();
            if (p != null) {
                Hibernate.initialize(p.getImages());
                Hibernate.initialize(p.getPrices());
            }
            return Optional.ofNullable(p);
        });
    }

    public Optional<Product> findDetailByCode(String code) {
        return execute(session -> {
            Product p = session.createQuery(
                    "select distinct p from Product p " +
                    "join fetch p.category " +
                    "left join fetch p.specification " +
                    "left join fetch p.ratingSummary " +
                    "left join fetch p.inventory " +
                    "where lower(p.productCode) = lower(:code) and p.isActive = true", Product.class)
                    .setParameter("code", code)
                    .uniqueResult();
            if (p != null) {
                Hibernate.initialize(p.getImages());
                Hibernate.initialize(p.getPrices());
            }
            return Optional.ofNullable(p);
        });
    }

    public List<Product> findFiltered(
            String category,
            String origin,
            String finish,
            String stoneType,
            StockStatus stockStatus,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String search,
            String sort,
            int offset,
            int limit) {

        return execute(session -> {
            StringBuilder hql = new StringBuilder(
                    "select distinct p from Product p " +
                    "join fetch p.category c " +
                    "left join fetch p.ratingSummary rs " +
                    "left join fetch p.inventory inv " +
                    "where p.isActive = true "
            );

            Map<String, Object> params = new HashMap<>();
            buildWhereClause(hql, params, category, origin, finish, stoneType, stockStatus, minPrice, maxPrice, search);
            buildOrderByClause(hql, sort);

            Query<Product> query = session.createQuery(hql.toString(), Product.class);
            params.forEach(query::setParameter);
            query.setFirstResult(offset);
            query.setMaxResults(limit);

            List<Product> products = query.list();
            for (Product p : products) {
                Hibernate.initialize(p.getImages());
                Hibernate.initialize(p.getPrices());
            }
            return products;
        });
    }

    public long countFiltered(
            String category,
            String origin,
            String finish,
            String stoneType,
            StockStatus stockStatus,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String search) {

        return execute(session -> {
            StringBuilder hql = new StringBuilder(
                    "select count(distinct p.productId) from Product p " +
                    "join p.category c " +
                    "where p.isActive = true "
            );

            Map<String, Object> params = new HashMap<>();
            buildWhereClause(hql, params, category, origin, finish, stoneType, stockStatus, minPrice, maxPrice, search);

            Query<Long> query = session.createQuery(hql.toString(), Long.class);
            params.forEach(query::setParameter);
            Long count = query.uniqueResult();
            return count != null ? count : 0L;
        });
    }

    public List<Product> findAllActive() {
        return execute(session -> {
            List<Product> list = session.createQuery(
                    "select distinct p from Product p " +
                    "join fetch p.category " +
                    "left join fetch p.ratingSummary " +
                    "left join fetch p.inventory " +
                    "where p.isActive = true order by p.productId asc", Product.class)
                    .list();
            for (Product p : list) {
                Hibernate.initialize(p.getImages());
                Hibernate.initialize(p.getPrices());
            }
            return list;
        });
    }

    private void buildWhereClause(
            StringBuilder hql,
            Map<String, Object> params,
            String category,
            String origin,
            String finish,
            String stoneType,
            StockStatus stockStatus,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String search) {

        if (category != null && !category.trim().isEmpty()) {
            hql.append("and (lower(c.categoryName) = lower(:category) ");
            params.put("category", category.trim());
            try {
                Long catId = Long.parseLong(category.trim());
                hql.append("or c.categoryId = :catId ");
                params.put("catId", catId);
            } catch (NumberFormatException ignored) {}
            hql.append(") ");
        }

        if (origin != null && !origin.trim().isEmpty()) {
            hql.append("and lower(p.origin) = lower(:origin) ");
            params.put("origin", origin.trim());
        }

        if (finish != null && !finish.trim().isEmpty()) {
            hql.append("and lower(p.finish) = lower(:finish) ");
            params.put("finish", finish.trim());
        }

        if (stoneType != null && !stoneType.trim().isEmpty()) {
            hql.append("and lower(p.typeOfStone) = lower(:stoneType) ");
            params.put("stoneType", stoneType.trim());
        }

        if (stockStatus != null) {
            hql.append("and p.stockStatus = :stockStatus ");
            params.put("stockStatus", stockStatus);
        }

        if (minPrice != null || maxPrice != null) {
            hql.append("and exists (select 1 from ProductPrice pr where pr.product = p and (pr.effectiveFrom is null or pr.effectiveFrom <= :now) ");
            params.put("now", LocalDateTime.now());
            if (minPrice != null) {
                hql.append("and pr.currentPrice >= :minPrice ");
                params.put("minPrice", minPrice);
            }
            if (maxPrice != null) {
                hql.append("and pr.currentPrice <= :maxPrice ");
                params.put("maxPrice", maxPrice);
            }
            hql.append(") ");
        }

        if (search != null && !search.trim().isEmpty()) {
            String pattern = "%" + search.trim().toLowerCase() + "%";
            hql.append("and (lower(p.productName) like :search ")
               .append("or lower(p.productCode) like :search ")
               .append("or lower(c.categoryName) like :search ")
               .append("or lower(p.origin) like :search ")
               .append("or lower(p.finish) like :search ")
               .append("or lower(p.typeOfStone) like :search) ");
            params.put("search", pattern);
        }
    }

    private void buildOrderByClause(StringBuilder hql, String sort) {
        if (sort == null) {
            sort = "recommended";
        }
        switch (sort.toLowerCase()) {
            case "price_asc":
            case "price-low-to-high":
                hql.append("order by (select coalesce(min(pr.currentPrice), 0) from ProductPrice pr where pr.product = p) asc, p.productId asc");
                break;
            case "price_desc":
            case "price-high-to-low":
                hql.append("order by (select coalesce(max(pr.currentPrice), 0) from ProductPrice pr where pr.product = p) desc, p.productId asc");
                break;
            case "rating_desc":
            case "highest-rated":
                hql.append("order by coalesce(rs.ratingScore, 0) desc, p.productId asc");
                break;
            case "name_asc":
                hql.append("order by p.productName asc");
                break;
            case "name_desc":
                hql.append("order by p.productName desc");
                break;
            case "newest":
                hql.append("order by p.createdAt desc, p.productId desc");
                break;
            case "recommended":
            default:
                hql.append("order by p.productId asc");
                break;
        }
    }
}
