package com.aksharmarbles.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "product_id", columnDefinition = "INT UNSIGNED")
    private Long productId;

    @Column(name = "product_code", nullable = false, unique = true, length = 30)
    private String productCode;

    @Column(name = "product_name", nullable = false, length = 200)
    private String productName;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "origin", length = 100)
    private String origin;

    @Column(name = "finish", length = 100)
    private String finish;

    @Column(name = "tile_size", length = 50)
    private String tileSize;

    @Column(name = "type_of_stone", length = 100)
    private String typeOfStone;

    @Column(name = "badge_text", length = 100)
    private String badgeText;

    @Column(name = "badge_style", length = 50)
    private String badgeStyle;

    @Column(name = "stock_status", columnDefinition = "ENUM('In Stock','Out of Stock','Low Stock','Pre Order')")
    @Convert(converter = StockStatusConverter.class)
    private StockStatus stockStatus = StockStatus.IN_STOCK;

    @Column(name = "image_path", length = 500)
    private String imagePath;

    @Column(name = "image_alt", length = 255)
    private String imageAlt;

    @Column(name = "product_page", length = 255)
    private String productPage = "product.html";

    @Column(name = "is_active", nullable = false, columnDefinition = "TINYINT(1)")
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false, columnDefinition = "TIMESTAMP")
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false, columnDefinition = "TIMESTAMP")
    private LocalDateTime updatedAt;

    @OneToOne(mappedBy = "product", fetch = FetchType.LAZY)
    private ProductSpecification specification;

    @OneToOne(mappedBy = "product", fetch = FetchType.LAZY)
    private ProductRatingSummary ratingSummary;

    @OneToOne(mappedBy = "product", fetch = FetchType.LAZY)
    private Inventory inventory;

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
    private List<ProductImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
    private List<ProductPrice> prices = new ArrayList<>();

    public Product() {
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductCode() {
        return productCode;
    }

    public void setProductCode(String productCode) {
        this.productCode = productCode;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public String getOrigin() {
        return origin;
    }

    public void setOrigin(String origin) {
        this.origin = origin;
    }

    public String getFinish() {
        return finish;
    }

    public void setFinish(String finish) {
        this.finish = finish;
    }

    public String getTileSize() {
        return tileSize;
    }

    public void setTileSize(String tileSize) {
        this.tileSize = tileSize;
    }

    public String getTypeOfStone() {
        return typeOfStone;
    }

    public void setTypeOfStone(String typeOfStone) {
        this.typeOfStone = typeOfStone;
    }

    public String getBadgeText() {
        return badgeText;
    }

    public void setBadgeText(String badgeText) {
        this.badgeText = badgeText;
    }

    public String getBadgeStyle() {
        return badgeStyle;
    }

    public void setBadgeStyle(String badgeStyle) {
        this.badgeStyle = badgeStyle;
    }

    public StockStatus getStockStatus() {
        return stockStatus;
    }

    public void setStockStatus(StockStatus stockStatus) {
        this.stockStatus = stockStatus;
    }

    public String getImagePath() {
        return imagePath;
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
    }

    public String getImageAlt() {
        return imageAlt;
    }

    public void setImageAlt(String imageAlt) {
        this.imageAlt = imageAlt;
    }

    public String getProductPage() {
        return productPage;
    }

    public void setProductPage(String productPage) {
        this.productPage = productPage;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public ProductSpecification getSpecification() {
        return specification;
    }

    public void setSpecification(ProductSpecification specification) {
        this.specification = specification;
    }

    public ProductRatingSummary getRatingSummary() {
        return ratingSummary;
    }

    public void setRatingSummary(ProductRatingSummary ratingSummary) {
        this.ratingSummary = ratingSummary;
    }

    public Inventory getInventory() {
        return inventory;
    }

    public void setInventory(Inventory inventory) {
        this.inventory = inventory;
    }

    public List<ProductImage> getImages() {
        return images;
    }

    public void setImages(List<ProductImage> images) {
        this.images = images;
    }

    public List<ProductPrice> getPrices() {
        return prices;
    }

    public void setPrices(List<ProductPrice> prices) {
        this.prices = prices;
    }
}
