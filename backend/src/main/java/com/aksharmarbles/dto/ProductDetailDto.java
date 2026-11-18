package com.aksharmarbles.dto;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class ProductDetailDto extends ProductSummaryDto {

    private ProductSpecificationDto specification;
    private List<ProductImageDto> images = new ArrayList<>();
    private List<String> gallery = new ArrayList<>();
    private Map<String, String> technicalSpecs = new LinkedHashMap<>();
    private Integer stock = 1;
    private Integer minimumOrder = 1;
    private Integer defaultQuantity = 1;

    public ProductDetailDto() {
        super();
    }

    public ProductSpecificationDto getSpecification() {
        return specification;
    }

    public void setSpecification(ProductSpecificationDto specification) {
        this.specification = specification;
    }

    public List<ProductImageDto> getImages() {
        return images;
    }

    public void setImages(List<ProductImageDto> images) {
        this.images = images;
    }

    public List<String> getGallery() {
        return gallery;
    }

    public void setGallery(List<String> gallery) {
        this.gallery = gallery;
    }

    public Map<String, String> getTechnicalSpecs() {
        return technicalSpecs;
    }

    public void setTechnicalSpecs(Map<String, String> technicalSpecs) {
        this.technicalSpecs = technicalSpecs;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public Integer getMinimumOrder() {
        return minimumOrder;
    }

    public void setMinimumOrder(Integer minimumOrder) {
        this.minimumOrder = minimumOrder;
    }

    public Integer getDefaultQuantity() {
        return defaultQuantity;
    }

    public void setDefaultQuantity(Integer defaultQuantity) {
        this.defaultQuantity = defaultQuantity;
    }
}
