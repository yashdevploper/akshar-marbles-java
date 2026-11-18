package com.aksharmarbles.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class StockStatusConverter implements AttributeConverter<StockStatus, String> {

    @Override
    public String convertToDatabaseColumn(StockStatus attribute) {
        if (attribute == null) {
            return StockStatus.IN_STOCK.getDbValue();
        }
        return attribute.getDbValue();
    }

    @Override
    public StockStatus convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return StockStatus.IN_STOCK;
        }
        return StockStatus.fromDbValue(dbData);
    }
}
