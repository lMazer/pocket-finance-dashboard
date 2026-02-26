package com.pocketfinance.backend.api.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pocketfinance.backend.api.dto.PageResponse;
import com.pocketfinance.backend.api.dto.TransactionCreateRequest;
import com.pocketfinance.backend.api.dto.TransactionResponse;
import com.pocketfinance.backend.api.dto.TransactionUpdateRequest;
import com.pocketfinance.backend.domain.model.TransactionType;
import com.pocketfinance.backend.security.AppUserPrincipal;
import com.pocketfinance.backend.service.TransactionService;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TransactionControllerTest {

    @Mock
    private TransactionService transactionService;

    private TransactionController controller;
    private UUID userId;
    private AppUserPrincipal principal;

    @BeforeEach
    void setUp() {
        controller = new TransactionController(transactionService);
        userId = UUID.randomUUID();
        principal = new AppUserPrincipal(userId, "demo@pocket.local", "Demo User");
    }

    @Test
    void listShouldDelegateWithFiltersAndPage() {
        UUID categoryId = UUID.randomUUID();
        PageResponse<TransactionResponse> expected = new PageResponse<>(
                List.of(sampleTransaction(UUID.randomUUID(), categoryId)),
                0,
                20,
                1,
                1,
                true
        );
        when(transactionService.list(userId, "2026-02", categoryId, TransactionType.EXPENSE, "mercado", 0)).thenReturn(expected);

        PageResponse<TransactionResponse> response =
                controller.list(principal, "2026-02", categoryId, TransactionType.EXPENSE, "mercado", 0);

        assertEquals(expected, response);
        verify(transactionService).list(userId, "2026-02", categoryId, TransactionType.EXPENSE, "mercado", 0);
    }

    @Test
    void createGetUpdateDeleteShouldDelegateToService() {
        UUID categoryId = UUID.randomUUID();
        UUID transactionId = UUID.randomUUID();
        TransactionCreateRequest createRequest = new TransactionCreateRequest(
                categoryId,
                TransactionType.EXPENSE,
                "Mercado",
                new BigDecimal("100.00"),
                LocalDate.of(2026, 2, 26)
        );
        TransactionResponse created = sampleTransaction(transactionId, categoryId);
        when(transactionService.create(userId, createRequest)).thenReturn(created);
        when(transactionService.getById(userId, transactionId)).thenReturn(created);

        assertEquals(created, controller.create(principal, createRequest));
        assertEquals(created, controller.get(principal, transactionId));
        verify(transactionService).create(userId, createRequest);
        verify(transactionService).getById(userId, transactionId);

        TransactionUpdateRequest updateRequest = new TransactionUpdateRequest(
                categoryId,
                TransactionType.EXPENSE,
                "Mercado atualizado",
                new BigDecimal("120.00"),
                LocalDate.of(2026, 2, 27)
        );
        TransactionResponse updated = new TransactionResponse(
                transactionId,
                categoryId,
                "Alimentacao",
                TransactionType.EXPENSE,
                "Mercado atualizado",
                new BigDecimal("120.00"),
                LocalDate.of(2026, 2, 27),
                created.createdAt(),
                Instant.parse("2026-02-27T10:00:00Z")
        );
        when(transactionService.update(userId, transactionId, updateRequest)).thenReturn(updated);

        assertEquals(updated, controller.update(principal, transactionId, updateRequest));
        verify(transactionService).update(userId, transactionId, updateRequest);

        controller.delete(principal, transactionId);
        verify(transactionService).delete(userId, transactionId);
    }

    private TransactionResponse sampleTransaction(UUID transactionId, UUID categoryId) {
        return new TransactionResponse(
                transactionId,
                categoryId,
                "Alimentacao",
                TransactionType.EXPENSE,
                "Mercado",
                new BigDecimal("100.00"),
                LocalDate.of(2026, 2, 26),
                Instant.parse("2026-02-26T10:00:00Z"),
                Instant.parse("2026-02-26T10:00:00Z")
        );
    }
}
