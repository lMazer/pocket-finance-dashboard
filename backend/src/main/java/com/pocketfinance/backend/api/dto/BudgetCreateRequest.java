package com.pocketfinance.backend.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public record BudgetCreateRequest(
        @NotBlank String month,
        @NotNull UUID categoryId,
        @NotNull @DecimalMin(value = "0.01") BigDecimal amount
) {
}
