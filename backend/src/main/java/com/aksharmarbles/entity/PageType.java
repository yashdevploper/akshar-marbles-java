package com.aksharmarbles.entity;

public enum PageType {
    admin,
    customer,
    public_page("public");

    private final String dbValue;

    PageType() {
        this.dbValue = name();
    }

    PageType(String dbValue) {
        this.dbValue = dbValue;
    }

    public String getDbValue() {
        return dbValue;
    }

    public static PageType fromDbValue(String value) {
        if (value == null) {
            return public_page;
        }
        for (PageType pt : values()) {
            if (pt.dbValue.equalsIgnoreCase(value.trim()) || pt.name().equalsIgnoreCase(value.trim())) {
                return pt;
            }
        }
        return public_page;
    }
}
