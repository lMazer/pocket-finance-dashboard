package com.pocketfinance.backend.api.dto;

import java.util.UUID;

public record MeResponse(
        UUID id,
        String email,
        String fullName
) {
}
