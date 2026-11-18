package com.aksharmarbles.servlet;

import com.aksharmarbles.dto.ApiResponse;
import com.aksharmarbles.dto.CategoryDto;
import com.aksharmarbles.service.CategoryService;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

@WebServlet(name = "CategoryServlet", urlPatterns = {"/api/categories"})
public class CategoryServlet extends BaseServlet {

    private final CategoryService categoryService = new CategoryService();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        List<CategoryDto> categories = categoryService.getAllCategoriesWithCount();
        sendJson(resp, ApiResponse.ok(categories));
    }
}
