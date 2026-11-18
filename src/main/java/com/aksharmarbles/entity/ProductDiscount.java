package com.aksharmarbles.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "product_discounts")
public class ProductDiscount {

    @EmbeddedId
    private ProductDiscountId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("productId")
    @JoinColumn(name = "product_id", columnDefinition = "INT UNSIGNED")
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("discountId")
    @JoinColumn(name = "discount_id", columnDefinition = "INT UNSIGNED")
    private Discount discount;

    public ProductDiscount() {
    }

    public ProductDiscount(Product product, Discount discount) {
        this.product = product;
        this.discount = discount;
        this.id = new ProductDiscountId(product.getProductId(), discount.getDiscountId());
    }

    public ProductDiscountId getId() {
        return id;
    }

    public void setId(ProductDiscountId id) {
        this.id = id;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public Discount getDiscount() {
        return discount;
    }

    public void setDiscount(Discount discount) {
        this.discount = discount;
    }
}
