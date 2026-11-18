package com.aksharmarbles.entity;

public enum StockStatus {
    IN_STOCK("In Stock"),
    OUT_OF_STOCK("Out of Stock"),
    LOW_STOCK("Low Stock"),
    PRE_ORDER("Pre Order");

    private final String dbValue;

    StockStatus(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public String getDisplayName() {
        return dbValue;
    }

    public static StockStatus fromDisplayName(String value) {
        return fromDbValue(value);
    }

    public static StockStatus fromDbValue(String value) {
        if (value == null) {
            return IN_STOCK;
        }
        for (StockStatus status : values()) {
            if (status.dbValue.equalsIgnoreCase(value.trim()) || status.name().equalsIgnoreCase(value.trim())) {
                return status;
            }
        }
        return IN_STOCK;
    }
}
