package com.aksharmarbles.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "product_rating_summaries")
public class ProductRatingSummary {

    @Id
    @Column(name = "product_id", columnDefinition = "INT UNSIGNED")
    private Long productId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "product_id", columnDefinition = "INT UNSIGNED")
    private Product product;

    @Column(name = "rating_score", nullable = false, precision = 2, scale = 1)
    private BigDecimal ratingScore;

    @Column(name = "rating_stars", length = 10)
    private String ratingStars;

    @Column(name = "review_count", columnDefinition = "INT UNSIGNED")
    private Integer reviewCount = 0;

    public ProductRatingSummary() {
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public BigDecimal getRatingScore() {
        return ratingScore;
    }

    public void setRatingScore(BigDecimal ratingScore) {
        this.ratingScore = ratingScore;
    }

    public String getRatingStars() {
        return ratingStars;
    }

    public void setRatingStars(String ratingStars) {
        this.ratingStars = ratingStars;
    }

    public Integer getReviewCount() {
        return reviewCount;
    }

    public void setReviewCount(Integer reviewCount) {
        this.reviewCount = reviewCount;
    }
}
