package com.aksharmarbles.dto;

public class ProductImageDto {

    private Long id;
    private String imagePath;
    private String imageType;
    private Byte displayOrder;
    private String imageAlt;

    public ProductImageDto() {
    }

    public ProductImageDto(Long id, String imagePath, String imageType, Byte displayOrder, String imageAlt) {
        this.id = id;
        this.imagePath = imagePath;
        this.imageType = imageType;
        this.displayOrder = displayOrder;
        this.imageAlt = imageAlt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getImagePath() {
        return imagePath;
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
    }

    public String getImageType() {
        return imageType;
    }

    public void setImageType(String imageType) {
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
}
