package com.pocketfinance.backend.api.dto;

import com.pocketfinance.backend.domain.model.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionUpdateRequest(
        UUID categoryId,
        TransactionType type,
        @Size(max = 255) String description,
        @DecimalMin(value = "0.01") BigDecimal amount,
        LocalDate date
) {
}
