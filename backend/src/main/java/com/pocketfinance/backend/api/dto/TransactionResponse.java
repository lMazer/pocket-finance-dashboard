package com.pocketfinance.backend.api.dto;

import com.pocketfinance.backend.domain.model.TransactionType;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionResponse(
        UUID id,
        UUID categoryId,
        String categoryName,
        TransactionType type,
        String description,
        BigDecimal amount,
        LocalDate date,
        Instant createdAt,
        Instant updatedAt
) {
}
