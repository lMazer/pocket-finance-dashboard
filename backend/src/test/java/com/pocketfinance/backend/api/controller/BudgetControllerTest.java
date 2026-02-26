package com.pocketfinance.backend.api.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pocketfinance.backend.api.dto.BudgetCreateRequest;
import com.pocketfinance.backend.api.dto.BudgetResponse;
import com.pocketfinance.backend.api.dto.BudgetUpdateRequest;
import com.pocketfinance.backend.security.AppUserPrincipal;
import com.pocketfinance.backend.service.BudgetService;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BudgetControllerTest {

    @Mock
    private BudgetService budgetService;

    private BudgetController controller;
    private UUID userId;
    private AppUserPrincipal principal;

    @BeforeEach
    void setUp() {
        controller = new BudgetController(budgetService);
        userId = UUID.randomUUID();
        principal = new AppUserPrincipal(userId, "demo@pocket.local", "Demo User");
    }

    @Test
    void listShouldDelegateToServiceWithMonthFilter() {
        List<BudgetResponse> expected = List.of(
                new BudgetResponse(UUID.randomUUID(), UUID.randomUUID(), "Moradia", LocalDate.of(2026, 2, 1), new BigDecimal("1200.00"))
        );
        when(budgetService.list(userId, "2026-02")).thenReturn(expected);

        List<BudgetResponse> response = controller.list(principal, "2026-02");

        assertEquals(expected, response);
        verify(budgetService).list(userId, "2026-02");
    }

    @Test
    void createAndUpdateShouldDelegateToService() {
        UUID categoryId = UUID.randomUUID();
        BudgetCreateRequest createRequest = new BudgetCreateRequest("2026-02", categoryId, new BigDecimal("500.00"));
        BudgetResponse created = new BudgetResponse(UUID.randomUUID(), categoryId, "Lazer", LocalDate.of(2026, 2, 1), new BigDecimal("500.00"));
        when(budgetService.create(userId, createRequest)).thenReturn(created);

        BudgetResponse createResponse = controller.create(principal, createRequest);
        assertEquals(created, createResponse);
        verify(budgetService).create(userId, createRequest);

        BudgetUpdateRequest updateRequest = new BudgetUpdateRequest(new BigDecimal("650.00"));
        BudgetResponse updated = new BudgetResponse(created.id(), categoryId, "Lazer", LocalDate.of(2026, 2, 1), new BigDecimal("650.00"));
        when(budgetService.update(userId, created.id(), updateRequest)).thenReturn(updated);

        BudgetResponse updateResponse = controller.update(principal, created.id(), updateRequest);
        assertEquals(updated, updateResponse);
        verify(budgetService).update(userId, created.id(), updateRequest);
    }
}
