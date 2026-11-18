package com.aksharmarbles.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
public class ProductDiscountId implements Serializable {

    @Column(name = "product_id", columnDefinition = "INT UNSIGNED")
    private Long productId;

    @Column(name = "discount_id", columnDefinition = "INT UNSIGNED")
    private Long discountId;

    public ProductDiscountId() {
    }

    public ProductDiscountId(Long productId, Long discountId) {
        this.productId = productId;
        this.discountId = discountId;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Long getDiscountId() {
        return discountId;
    }

    public void setDiscountId(Long discountId) {
        this.discountId = discountId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ProductDiscountId that)) return false;
        return Objects.equals(productId, that.productId) && Objects.equals(discountId, that.discountId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(productId, discountId);
    }
}
