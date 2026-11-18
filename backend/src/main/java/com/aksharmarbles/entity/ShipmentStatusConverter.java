package com.aksharmarbles.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class ShipmentStatusConverter implements AttributeConverter<ShipmentStatus, String> {

    @Override
    public String convertToDatabaseColumn(ShipmentStatus attribute) {
        if (attribute == null) {
            return ShipmentStatus.PENDING.getDbValue();
        }
        return attribute.getDbValue();
    }

    @Override
    public ShipmentStatus convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return ShipmentStatus.PENDING;
        }
        return ShipmentStatus.fromDbValue(dbData);
    }
}
