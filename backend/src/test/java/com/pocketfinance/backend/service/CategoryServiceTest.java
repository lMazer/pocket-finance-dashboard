package com.pocketfinance.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pocketfinance.backend.api.dto.CategoryResponse;
import com.pocketfinance.backend.api.dto.CategoryUpdateRequest;
import com.pocketfinance.backend.domain.model.Category;
import com.pocketfinance.backend.domain.model.User;
import com.pocketfinance.backend.domain.repository.CategoryRepository;
import com.pocketfinance.backend.domain.repository.UserRepository;
import com.pocketfinance.backend.exception.BadRequestException;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;
    @Mock
    private UserRepository userRepository;

    private CategoryService categoryService;
    private UUID userId;
    private UUID categoryId;

    @BeforeEach
    void setUp() {
        categoryService = new CategoryService(categoryRepository, userRepository);
        userId = UUID.randomUUID();
        categoryId = UUID.randomUUID();
    }

    @Test
    void updateShouldRejectDuplicateNameFromAnotherCategory() {
        Category current = category(categoryId, "Mercado", "#00FF00");
        Category duplicate = category(UUID.randomUUID(), "Mercado", "#FF0000");

        when(categoryRepository.findByIdAndUserId(categoryId, userId)).thenReturn(Optional.of(current));
        when(categoryRepository.findByUserIdAndNameIgnoreCase(userId, "Alimentacao")).thenReturn(Optional.of(duplicate));

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> categoryService.update(userId, categoryId, new CategoryUpdateRequest(" Alimentacao ", " #123456 "))
        );

        assertEquals("Categoria ja existe para este usuario.", exception.getMessage());
        verify(categoryRepository, never()).save(any(Category.class));
    }

    @Test
    void updateShouldAllowSameNameForSameCategoryAndTrimFields() {
        Category current = category(categoryId, "Mercado", "#00FF00");

        when(categoryRepository.findByIdAndUserId(categoryId, userId)).thenReturn(Optional.of(current));
        when(categoryRepository.findByUserIdAndNameIgnoreCase(userId, "Mercado")).thenReturn(Optional.of(current));
        when(categoryRepository.save(current)).thenReturn(current);

        CategoryResponse response = categoryService.update(userId, categoryId, new CategoryUpdateRequest(" Mercado ", " #123456 "));

        assertEquals(categoryId, response.id());
        assertEquals("Mercado", response.name());
        assertEquals("#123456", response.color());
        verify(categoryRepository).save(current);
    }

    @Test
    void deleteShouldWrapIntegrityViolationAsBadRequest() {
        Category current = category(categoryId, "Moradia", "#112233");
        when(categoryRepository.findByIdAndUserId(categoryId, userId)).thenReturn(Optional.of(current));
        doThrow(new DataIntegrityViolationException("fk_violation")).when(categoryRepository).flush();

        BadRequestException exception = assertThrows(BadRequestException.class, () -> categoryService.delete(userId, categoryId));

        assertEquals("Nao foi possivel excluir categoria com transacoes ou metas vinculadas.", exception.getMessage());
        verify(categoryRepository).delete(current);
        verify(categoryRepository).flush();
    }

    private Category category(UUID id, String name, String color) {
        User user = new User();
        user.setId(userId);

        Category category = new Category();
        category.setId(id);
        category.setUser(user);
        category.setName(name);
        category.setColor(color);
        return category;
    }
}
