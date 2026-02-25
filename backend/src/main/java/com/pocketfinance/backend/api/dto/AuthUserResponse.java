package com.pocketfinance.backend.api.dto;

import java.util.UUID;

public record AuthUserResponse(
        UUID id,
        String email,
        String fullName
) {
}
