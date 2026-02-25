package com.pocketfinance.backend.api.controller;

import com.pocketfinance.backend.api.dto.PageResponse;
import com.pocketfinance.backend.api.dto.TransactionCreateRequest;
import com.pocketfinance.backend.api.dto.TransactionResponse;
import com.pocketfinance.backend.api.dto.TransactionUpdateRequest;
import com.pocketfinance.backend.domain.model.TransactionType;
import com.pocketfinance.backend.security.AppUserPrincipal;
import com.pocketfinance.backend.service.TransactionService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
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
@RequestMapping("/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    public PageResponse<TransactionResponse> list(@AuthenticationPrincipal AppUserPrincipal principal,
                                                  @RequestParam(required = false) String month,
                                                  @RequestParam(required = false) UUID category,
                                                  @RequestParam(required = false) TransactionType type,
                                                  @RequestParam(required = false) String q,
                                                  @RequestParam(defaultValue = "0") Integer page) {
        return transactionService.list(principal.getUserId(), month, category, type, q, page);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionResponse create(@AuthenticationPrincipal AppUserPrincipal principal,
                                      @Valid @RequestBody TransactionCreateRequest request) {
        return transactionService.create(principal.getUserId(), request);
    }

    @GetMapping("/{id}")
    public TransactionResponse get(@AuthenticationPrincipal AppUserPrincipal principal,
                                   @PathVariable UUID id) {
        return transactionService.getById(principal.getUserId(), id);
    }

    @PatchMapping("/{id}")
    public TransactionResponse update(@AuthenticationPrincipal AppUserPrincipal principal,
                                      @PathVariable UUID id,
                                      @Valid @RequestBody TransactionUpdateRequest request) {
        return transactionService.update(principal.getUserId(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AppUserPrincipal principal,
                       @PathVariable UUID id) {
        transactionService.delete(principal.getUserId(), id);
    }
}
