package com.pocketfinance.backend.api.dto;

public record CsvImportResponse(
        int imported,
        int skipped
) {
}
