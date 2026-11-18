package com.aksharmarbles.service;

import com.aksharmarbles.dao.CategoryDao;
import com.aksharmarbles.dto.CategoryDto;
import com.aksharmarbles.entity.Category;

import java.util.ArrayList;
import java.util.List;

public class CategoryService extends BaseService {

    private final CategoryDao categoryDao;

    public CategoryService() {
        this.categoryDao = new CategoryDao();
    }

    public CategoryService(CategoryDao categoryDao) {
        this.categoryDao = categoryDao;
    }

    public List<CategoryDto> getAllCategoriesWithCount() {
        List<Object[]> rows = categoryDao.findCategoriesWithProductCount();
        List<CategoryDto> dtos = new ArrayList<>();
        for (Object[] row : rows) {
            Category category = (Category) row[0];
            Long count = (Long) row[1];
            dtos.add(new CategoryDto(
                    category.getCategoryId(),
                    category.getCategoryName(),
                    category.getDescription(),
                    count != null ? count : 0L
            ));
        }
        return dtos;
    }
}
