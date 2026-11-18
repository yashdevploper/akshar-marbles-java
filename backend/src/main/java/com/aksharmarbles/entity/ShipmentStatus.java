package com.aksharmarbles.entity;

public enum ShipmentStatus {
    PENDING("Pending"),
    PACKED("Packed"),
    DISPATCHED("Dispatched"),
    IN_TRANSIT("In Transit"),
    DELIVERED("Delivered"),
    RETURNED("Returned");

    private final String dbValue;

    ShipmentStatus(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static ShipmentStatus fromDbValue(String value) {
        if (value == null) {
            return PENDING;
        }
        for (ShipmentStatus status : values()) {
            if (status.dbValue.equalsIgnoreCase(value.trim()) || status.name().equalsIgnoreCase(value.trim())) {
                return status;
            }
        }
        return PENDING;
    }
}
