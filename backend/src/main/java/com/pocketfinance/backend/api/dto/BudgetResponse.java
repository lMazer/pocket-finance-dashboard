package com.pocketfinance.backend.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record BudgetResponse(
        UUID id,
        UUID categoryId,
        String categoryName,
        LocalDate month,
        BigDecimal amount
) {
}
