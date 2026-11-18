package com.aksharmarbles.dto;

import java.math.BigDecimal;

public class ProductSpecificationDto {

    private BigDecimal thicknessMm;
    private String waterAbsorption;
    private String hardnessMohs;
    private String weightKgM2;

    public ProductSpecificationDto() {
    }

    public ProductSpecificationDto(BigDecimal thicknessMm, String waterAbsorption, String hardnessMohs, String weightKgM2) {
        this.thicknessMm = thicknessMm;
        this.waterAbsorption = waterAbsorption;
        this.hardnessMohs = hardnessMohs;
        this.weightKgM2 = weightKgM2;
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
}
