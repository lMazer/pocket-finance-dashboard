package com.pocketfinance.backend.api.dto;

import java.util.UUID;

public record CategoryResponse(
        UUID id,
        String name,
        String color
) {
}
