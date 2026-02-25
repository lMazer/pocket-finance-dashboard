package com.pocketfinance.backend.api.dto;

import com.pocketfinance.backend.domain.model.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionCreateRequest(
        @NotNull UUID categoryId,
        @NotNull TransactionType type,
        @NotBlank @Size(max = 255) String description,
        @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
        @NotNull LocalDate date
) {
}
