package com.pocketfinance.backend.api.dto;

public record AuthResponse(
        String tokenType,
        String accessToken,
        String refreshToken,
        long expiresIn,
        AuthUserResponse user
) {
}
