package com.aksharmarbles.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_images")
public class ProductImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "image_id", columnDefinition = "INT UNSIGNED")
    private Long imageId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "image_path", nullable = false, length = 500)
    private String imagePath;

    @Enumerated(EnumType.STRING)
    @Column(name = "image_type", nullable = false, columnDefinition = "ENUM('main','gallery')")
    private ProductImageType imageType = ProductImageType.gallery;

    @Column(name = "display_order", columnDefinition = "TINYINT(3) UNSIGNED")
    private Byte displayOrder = 1;

    @Column(name = "image_alt", length = 255)
    private String imageAlt;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false, columnDefinition = "TIMESTAMP")
    private LocalDateTime createdAt;

    public ProductImage() {
    }

    public Long getImageId() {
        return imageId;
    }

    public void setImageId(Long imageId) {
        this.imageId = imageId;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public String getImagePath() {
        return imagePath;
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
    }

    public ProductImageType getImageType() {
        return imageType;
    }

    public void setImageType(ProductImageType imageType) {
        this.imageType = imageType;
    }

    public Byte getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Byte displayOrder) {
        this.displayOrder = displayOrder;
    }

    public String getImageAlt() {
        return imageAlt;
    }

    public void setImageAlt(String imageAlt) {
        this.imageAlt = imageAlt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
