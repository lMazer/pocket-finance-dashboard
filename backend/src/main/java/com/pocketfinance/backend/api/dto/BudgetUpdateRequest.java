package com.pocketfinance.backend.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record BudgetUpdateRequest(
        @NotNull @DecimalMin(value = "0.01") BigDecimal amount
) {
}
