package com.pocketfinance.backend.api.controller;

import com.pocketfinance.backend.api.dto.CategoryCreateRequest;
import com.pocketfinance.backend.api.dto.CategoryResponse;
import com.pocketfinance.backend.api.dto.CategoryUpdateRequest;
import com.pocketfinance.backend.security.AppUserPrincipal;
import com.pocketfinance.backend.service.CategoryService;
import jakarta.validation.Valid;
import java.util.List;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public List<CategoryResponse> list(@AuthenticationPrincipal AppUserPrincipal principal) {
        return categoryService.list(principal.getUserId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse create(@AuthenticationPrincipal AppUserPrincipal principal,
                                   @Valid @RequestBody CategoryCreateRequest request) {
        return categoryService.create(principal.getUserId(), request);
    }

    @PatchMapping("/{id}")
    public CategoryResponse update(@AuthenticationPrincipal AppUserPrincipal principal,
                                   @PathVariable UUID id,
                                   @Valid @RequestBody CategoryUpdateRequest request) {
        return categoryService.update(principal.getUserId(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AppUserPrincipal principal,
                       @PathVariable UUID id) {
        categoryService.delete(principal.getUserId(), id);
    }
}
