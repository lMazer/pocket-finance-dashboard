package com.pocketfinance.backend.api.controller;

import com.pocketfinance.backend.api.dto.BudgetCreateRequest;
import com.pocketfinance.backend.api.dto.BudgetResponse;
import com.pocketfinance.backend.api.dto.BudgetUpdateRequest;
import com.pocketfinance.backend.security.AppUserPrincipal;
import com.pocketfinance.backend.service.BudgetService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/budgets")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @GetMapping
    public List<BudgetResponse> list(@AuthenticationPrincipal AppUserPrincipal principal,
                                     @RequestParam(required = false) String month) {
        return budgetService.list(principal.getUserId(), month);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BudgetResponse create(@AuthenticationPrincipal AppUserPrincipal principal,
                                 @Valid @RequestBody BudgetCreateRequest request) {
        return budgetService.create(principal.getUserId(), request);
    }

    @PatchMapping("/{id}")
    public BudgetResponse update(@AuthenticationPrincipal AppUserPrincipal principal,
                                 @PathVariable UUID id,
                                 @Valid @RequestBody BudgetUpdateRequest request) {
        return budgetService.update(principal.getUserId(), id, request);
    }
}
