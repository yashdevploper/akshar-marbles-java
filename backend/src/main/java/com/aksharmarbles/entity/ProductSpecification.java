package com.aksharmarbles.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_specifications")
public class ProductSpecification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "specification_id", columnDefinition = "INT UNSIGNED")
    private Long specificationId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "product_id", nullable = false, unique = true)
    private Product product;

    @Column(name = "thickness_mm", precision = 8, scale = 2)
    private BigDecimal thicknessMm;

    @Column(name = "water_absorption", length = 50)
    private String waterAbsorption;

    @Column(name = "hardness_mohs", length = 50)
    private String hardnessMohs;

    @Column(name = "weight_kg_m2", length = 50)
    private String weightKgM2;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false, columnDefinition = "TIMESTAMP")
    private LocalDateTime createdAt;

    public ProductSpecification() {
    }

    public Long getSpecificationId() {
        return specificationId;
    }

    public void setSpecificationId(Long specificationId) {
        this.specificationId = specificationId;
    }

    public Product getProduct() {
        return product;
    }

    public void setProduct(Product product) {
        this.product = product;
    }

    public BigDecimal getThicknessMm() {
        return thicknessMm;
    }

    public void setThicknessMm(BigDecimal thicknessMm) {
        this.thicknessMm = thicknessMm;
    }

    public String getWaterAbsorption() {
        return waterAbsorption;
    }

    public void setWaterAbsorption(String waterAbsorption) {
        this.waterAbsorption = waterAbsorption;
    }

    public String getHardnessMohs() {
        return hardnessMohs;
    }

    public void setHardnessMohs(String hardnessMohs) {
        this.hardnessMohs = hardnessMohs;
    }

    public String getWeightKgM2() {
        return weightKgM2;
    }

    public void setWeightKgM2(String weightKgM2) {
        this.weightKgM2 = weightKgM2;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
