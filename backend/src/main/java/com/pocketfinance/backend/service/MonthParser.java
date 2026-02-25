package com.pocketfinance.backend.service;

import com.pocketfinance.backend.exception.BadRequestException;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import org.springframework.stereotype.Component;

@Component
public class MonthParser {

    public LocalDate parseRequiredMonth(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(fieldName + " e obrigatorio no formato yyyy-MM");
        }
        return parseOptionalMonth(value).orElseThrow(() ->
                new BadRequestException(fieldName + " deve estar no formato yyyy-MM"));
    }

    public java.util.Optional<LocalDate> parseOptionalMonth(String value) {
        if (value == null || value.isBlank()) {
            return java.util.Optional.empty();
        }
        try {
            return java.util.Optional.of(YearMonth.parse(value).atDay(1));
        } catch (DateTimeParseException ex) {
            throw new BadRequestException("month deve estar no formato yyyy-MM");
        }
    }
}
