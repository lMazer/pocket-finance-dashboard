package com.pocketfinance.backend.api.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pocketfinance.backend.api.dto.CategoryCreateRequest;
import com.pocketfinance.backend.api.dto.CategoryResponse;
import com.pocketfinance.backend.api.dto.CategoryUpdateRequest;
import com.pocketfinance.backend.security.AppUserPrincipal;
import com.pocketfinance.backend.service.CategoryService;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CategoryControllerTest {

    @Mock
    private CategoryService categoryService;

    private CategoryController controller;
    private AppUserPrincipal principal;
    private UUID userId;

    @BeforeEach
    void setUp() {
        controller = new CategoryController(categoryService);
        userId = UUID.randomUUID();
        principal = new AppUserPrincipal(userId, "demo@pocket.local", "Demo User");
    }

    @Test
    void listShouldDelegateToService() {
        List<CategoryResponse> expected = List.of(new CategoryResponse(UUID.randomUUID(), "Alimentacao", "#00FF00"));
        when(categoryService.list(userId)).thenReturn(expected);

        List<CategoryResponse> response = controller.list(principal);

        assertEquals(expected, response);
        verify(categoryService).list(userId);
    }

    @Test
    void createUpdateAndDeleteShouldDelegateToService() {
        CategoryCreateRequest createRequest = new CategoryCreateRequest("Lazer", "#112233");
        CategoryResponse created = new CategoryResponse(UUID.randomUUID(), "Lazer", "#112233");
        when(categoryService.create(userId, createRequest)).thenReturn(created);

        CategoryResponse createResponse = controller.create(principal, createRequest);
        assertEquals(created, createResponse);
        verify(categoryService).create(userId, createRequest);

        UUID categoryId = created.id();
        CategoryUpdateRequest updateRequest = new CategoryUpdateRequest("Lazer+", "#445566");
        CategoryResponse updated = new CategoryResponse(categoryId, "Lazer+", "#445566");
        when(categoryService.update(userId, categoryId, updateRequest)).thenReturn(updated);

        CategoryResponse updateResponse = controller.update(principal, categoryId, updateRequest);
        assertEquals(updated, updateResponse);
        verify(categoryService).update(userId, categoryId, updateRequest);

        controller.delete(principal, categoryId);
        verify(categoryService).delete(userId, categoryId);
    }
}
