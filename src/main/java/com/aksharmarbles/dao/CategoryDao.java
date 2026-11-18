package com.aksharmarbles.dao;

import com.aksharmarbles.entity.Category;

import java.util.List;
import java.util.Optional;

public class CategoryDao extends BaseDao<Category, Long> {

    public List<Category> findAll() {
        return execute(session -> session.createQuery(
                "from Category c order by c.categoryName asc", Category.class)
                .list());
    }

    public Optional<Category> findById(Long id) {
        return findById(Category.class, id);
    }

    public Optional<Category> findByName(String name) {
        return execute(session -> session.createQuery(
                "from Category c where lower(c.categoryName) = lower(:name)", Category.class)
                .setParameter("name", name)
                .uniqueResultOptional());
    }

    public List<Object[]> findCategoriesWithProductCount() {
        return execute(session -> session.createQuery(
                "select c, count(p) from Category c left join Product p on p.category = c and p.isActive = true " +
                "group by c.categoryId, c.categoryName, c.description, c.createdAt " +
                "order by c.categoryName asc", Object[].class)
                .list());
    }
}
