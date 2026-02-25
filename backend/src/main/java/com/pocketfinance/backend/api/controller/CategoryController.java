package com.pocketfinance.backend.api.controller;

import com.pocketfinance.backend.api.dto.CategoryCreateRequest;
import com.pocketfinance.backend.api.dto.CategoryResponse;
import com.pocketfinance.backend.security.AppUserPrincipal;
import com.pocketfinance.backend.service.CategoryService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
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
}
