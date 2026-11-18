package com.aksharmarbles;

import com.aksharmarbles.config.HibernateUtil;
import com.aksharmarbles.dto.*;
import com.aksharmarbles.service.CategoryService;
import com.aksharmarbles.service.ProductService;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class CatalogueModuleTest {

    private final CategoryService categoryService = new CategoryService();
    private final ProductService productService = new ProductService();

    @Test
    void testGetCategoriesWithCount() {
        List<CategoryDto> categories = categoryService.getAllCategoriesWithCount();
        assertNotNull(categories);
        assertFalse(categories.isEmpty(), "Categories should not be empty");
        System.out.println("Loaded categories count: " + categories.size());
        for (CategoryDto c : categories) {
            System.out.println("Category: " + c.getName() + " (Products: " + c.getProductCount() + ")");
            assertNotNull(c.getName());
        }
    }

    @Test
    void testGetAllActiveProducts() {
        List<ProductSummaryDto> products = productService.getAllActiveProducts();
        assertNotNull(products);
        assertEquals(6, products.size(), "Should have exactly 6 active products migrated from Excel");
        for (ProductSummaryDto p : products) {
            System.out.println("Product: " + p.getCode() + " - " + p.getName() + 
                    ", Price: " + p.getCurrentPrice() + " " + p.getPriceUnit() + 
                    ", Category: " + p.getCategoryName() + 
                    ", Rating: " + p.getRatingScore() + " (" + p.getReviewCount() + " reviews)");
            assertNotNull(p.getCode());
            assertNotNull(p.getName());
            assertNotNull(p.getCurrentPrice(), "Price must be populated");
        }
    }

    @Test
    void testGetProductDetailByCode() {
        ProductDetailDto detail = productService.getProductDetail("P001");
        assertNotNull(detail);
        assertEquals("P001", detail.getCode());
        assertEquals("Statuario White", detail.getName());
        assertNotNull(detail.getSpecification(), "Specification must be loaded");
        assertEquals(new BigDecimal("18.00"), detail.getSpecification().getThicknessMm());
        assertFalse(detail.getImages().isEmpty(), "Images must be loaded");
        assertFalse(detail.getGallery().isEmpty(), "Gallery URLs must be loaded");
        assertEquals("Polished", detail.getTechnicalSpecs().get("Finish"));
        System.out.println("Detail P001 loaded successfully. Gallery count: " + detail.getGallery().size());
    }

    @Test
    void testFilterProductsByCategoryAndPrice() {
        // Filter by Italian Marble
        PageResponse<ProductSummaryDto> page = productService.getFilteredProducts(
                "Italian Marble", null, null, null, null, null, null, null, "recommended", 1, 10);
        assertNotNull(page);
        assertTrue(page.getTotalItems() > 0, "Should find Italian marble products");
        System.out.println("Italian Marble filtered count: " + page.getTotalItems());

        // Filter by price range <= 350
        PageResponse<ProductSummaryDto> cheapPage = productService.getFilteredProducts(
                null, null, null, null, null, null, new BigDecimal("350.00"), null, "price_asc", 1, 10);
        assertNotNull(cheapPage);
        assertTrue(cheapPage.getTotalItems() > 0, "Should find products under 350");
        System.out.println("Products <= 350 count: " + cheapPage.getTotalItems());
    }

    @AfterAll
    static void tearDown() {
        HibernateUtil.shutdown();
    }
}
