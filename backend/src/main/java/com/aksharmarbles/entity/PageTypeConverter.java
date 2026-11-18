package com.aksharmarbles.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class PageTypeConverter implements AttributeConverter<PageType, String> {

    @Override
    public String convertToDatabaseColumn(PageType attribute) {
        if (attribute == null) {
            return PageType.public_page.getDbValue();
        }
        return attribute.getDbValue();
    }

    @Override
    public PageType convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return PageType.public_page;
        }
        return PageType.fromDbValue(dbData);
    }
}
