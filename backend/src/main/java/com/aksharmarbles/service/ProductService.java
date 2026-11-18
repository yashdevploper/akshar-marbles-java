package com.aksharmarbles.service;

import com.aksharmarbles.dao.ProductDao;
import com.aksharmarbles.dto.*;
import com.aksharmarbles.entity.*;
import com.aksharmarbles.exception.ResourceNotFoundException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

public class ProductService extends BaseService {

    private final ProductDao productDao;

    public ProductService() {
        this.productDao = new ProductDao();
    }

    public ProductService(ProductDao productDao) {
        this.productDao = productDao;
    }

    public PageResponse<ProductSummaryDto> getFilteredProducts(
            String category,
            String origin,
            String finish,
            String stoneType,
            String stockStatusStr,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            String search,
            String sort,
            int page,
            int size) {

        if (page < 1) page = 1;
        if (size < 1) size = 12;
        if (size > 100) size = 100;

        StockStatus stockStatus = null;
        if (stockStatusStr != null && !stockStatusStr.trim().isEmpty()) {
            stockStatus = StockStatus.fromDisplayName(stockStatusStr.trim());
        }

        int offset = (page - 1) * size;
        List<Product> products = productDao.findFiltered(
                category, origin, finish, stoneType, stockStatus, minPrice, maxPrice, search, sort, offset, size);
        long totalItems = productDao.countFiltered(
                category, origin, finish, stoneType, stockStatus, minPrice, maxPrice, search);

        List<ProductSummaryDto> dtos = new ArrayList<>();
        for (Product product : products) {
            dtos.add(toSummaryDto(product));
        }

        return PageResponse.of(dtos, page, size, totalItems);
    }

    public ProductDetailDto getProductDetail(String idOrCode) {
        if (idOrCode == null || idOrCode.trim().isEmpty()) {
            throw new ResourceNotFoundException("Product identifier must not be empty");
        }

        Optional<Product> productOpt = Optional.empty();
        try {
            Long id = Long.parseLong(idOrCode.trim());
            productOpt = productDao.findDetailById(id);
        } catch (NumberFormatException ignored) {
            // Not a numeric ID, search by product code
        }

        if (productOpt.isEmpty()) {
            productOpt = productDao.findDetailByCode(idOrCode.trim());
        }

        Product product = productOpt.orElseThrow(() -> 
                new ResourceNotFoundException("Product not found with identifier: " + idOrCode));

        return toDetailDto(product);
    }

    public List<ProductSummaryDto> getAllActiveProducts() {
        List<Product> products = productDao.findAllActive();
        List<ProductSummaryDto> dtos = new ArrayList<>();
        for (Product p : products) {
            dtos.add(toSummaryDto(p));
        }
        return dtos;
    }

    public ProductSummaryDto toSummaryDto(Product product) {
        ProductSummaryDto dto = new ProductSummaryDto();
        dto.setId(product.getProductId());
        dto.setCode(product.getProductCode());
        dto.setName(product.getProductName());

        if (product.getCategory() != null) {
            dto.setCategoryId(product.getCategory().getCategoryId());
            dto.setCategoryName(product.getCategory().getCategoryName());
        }

        dto.setOrigin(product.getOrigin());
        dto.setFinish(product.getFinish());
        dto.setTileSize(product.getTileSize());
        dto.setTypeOfStone(product.getTypeOfStone());
        dto.setBadgeText(product.getBadgeText());
        dto.setBadgeStyle(product.getBadgeStyle());
        dto.setStockStatus(product.getStockStatus() != null ? product.getStockStatus().getDisplayName() : "In Stock");
        dto.setImagePath(product.getImagePath());
        dto.setImageAlt(product.getImageAlt() != null ? product.getImageAlt() : product.getProductName());
        dto.setProductPage(product.getProductPage());

        ProductPrice activePrice = getActivePrice(product);
        if (activePrice != null) {
            dto.setCurrentPrice(activePrice.getCurrentPrice());
            dto.setOriginalPrice(activePrice.getOriginalPrice());
            dto.setPriceUnit(activePrice.getPriceUnit());
        }

        if (product.getRatingSummary() != null) {
            dto.setRatingScore(product.getRatingSummary().getRatingScore());
            dto.setRatingStars(product.getRatingSummary().getRatingStars());
            dto.setReviewCount(product.getRatingSummary().getReviewCount());
        } else {
            dto.setRatingScore(BigDecimal.ZERO);
            dto.setReviewCount(0);
        }

        return dto;
    }

    public ProductDetailDto toDetailDto(Product product) {
        ProductDetailDto dto = new ProductDetailDto();
        ProductSummaryDto summary = toSummaryDto(product);

        dto.setId(summary.getId());
        dto.setCode(summary.getCode());
        dto.setName(summary.getName());
        dto.setCategoryId(summary.getCategoryId());
        dto.setCategoryName(summary.getCategoryName());
        dto.setOrigin(summary.getOrigin());
        dto.setFinish(summary.getFinish());
        dto.setTileSize(summary.getTileSize());
        dto.setTypeOfStone(summary.getTypeOfStone());
        dto.setBadgeText(summary.getBadgeText());
        dto.setBadgeStyle(summary.getBadgeStyle());
        dto.setStockStatus(summary.getStockStatus());
        dto.setImagePath(summary.getImagePath());
        dto.setImageAlt(summary.getImageAlt());
        dto.setProductPage(summary.getProductPage());
        dto.setCurrentPrice(summary.getCurrentPrice());
        dto.setOriginalPrice(summary.getOriginalPrice());
        dto.setPriceUnit(summary.getPriceUnit());
        dto.setRatingScore(summary.getRatingScore());
        dto.setRatingStars(summary.getRatingStars());
        dto.setReviewCount(summary.getReviewCount());

        if (product.getInventory() != null && product.getInventory().getQuantity() != null) {
            dto.setStock(product.getInventory().getQuantity());
        }

        // Specifications
        ProductSpecification spec = product.getSpecification();
        if (spec != null) {
            dto.setSpecification(new ProductSpecificationDto(
                    spec.getThicknessMm(),
                    spec.getWaterAbsorption(),
                    spec.getHardnessMohs(),
                    spec.getWeightKgM2()
            ));
        }

        // Images and Gallery
        List<ProductImageDto> imageDtos = new ArrayList<>();
        List<String> galleryUrls = new ArrayList<>();
        if (product.getImages() != null) {
            List<ProductImage> sorted = new ArrayList<>(product.getImages());
            sorted.sort(Comparator.comparing(img -> img.getDisplayOrder() != null ? img.getDisplayOrder() : 99));

            for (ProductImage img : sorted) {
                imageDtos.add(new ProductImageDto(
                        img.getImageId(),
                        img.getImagePath(),
                        img.getImageType() != null ? img.getImageType().name() : "gallery",
                        img.getDisplayOrder(),
                        img.getImageAlt()
                ));
                if (img.getImagePath() != null && !img.getImagePath().trim().isEmpty()) {
                    galleryUrls.add(img.getImagePath().trim());
                }
            }
        }
        dto.setImages(imageDtos);
        dto.setGallery(galleryUrls);

        // Technical Specs Map for convenient display
        Map<String, String> technical = new LinkedHashMap<>();
        technical.put("Stone Type", product.getTypeOfStone() != null ? product.getTypeOfStone() : "");
        technical.put("Origin", product.getOrigin() != null ? product.getOrigin() : "");
        technical.put("Finish", product.getFinish() != null ? product.getFinish() : "");
        technical.put("Tile Size", product.getTileSize() != null ? product.getTileSize() : "");
        if (spec != null) {
            technical.put("Thickness", spec.getThicknessMm() != null ? spec.getThicknessMm() + " mm" : "");
            technical.put("Water Absorption", spec.getWaterAbsorption() != null ? spec.getWaterAbsorption() + "%" : "");
            technical.put("Hardness (Mohs)", spec.getHardnessMohs() != null ? spec.getHardnessMohs() : "");
            technical.put("Weight", spec.getWeightKgM2() != null ? spec.getWeightKgM2() + " kg/m²" : "");
        }
        dto.setTechnicalSpecs(technical);

        return dto;
    }

    private ProductPrice getActivePrice(Product product) {
        if (product.getPrices() == null || product.getPrices().isEmpty()) {
            return null;
        }
        LocalDateTime now = LocalDateTime.now();
        return product.getPrices().stream()
                .filter(p -> p.getEffectiveFrom() == null || !p.getEffectiveFrom().isAfter(now))
                .max(Comparator.comparing(ProductPrice::getEffectiveFrom, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(ProductPrice::getPriceId, Comparator.nullsLast(Comparator.naturalOrder())))
                .orElse(product.getPrices().get(0));
    }
}
