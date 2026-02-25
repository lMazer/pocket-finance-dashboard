package com.pocketfinance.backend.service;

import com.pocketfinance.backend.api.dto.CategoryCreateRequest;
import com.pocketfinance.backend.api.dto.CategoryResponse;
import com.pocketfinance.backend.api.dto.CategoryUpdateRequest;
import com.pocketfinance.backend.domain.model.Category;
import com.pocketfinance.backend.domain.model.User;
import com.pocketfinance.backend.domain.repository.CategoryRepository;
import com.pocketfinance.backend.domain.repository.UserRepository;
import com.pocketfinance.backend.exception.BadRequestException;
import com.pocketfinance.backend.exception.UnauthorizedException;
import java.util.List;
import java.util.UUID;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public CategoryService(CategoryRepository categoryRepository, UserRepository userRepository) {
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> list(UUID userId) {
        return categoryRepository.findByUserIdOrderByNameAsc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public CategoryResponse create(UUID userId, CategoryCreateRequest request) {
        String normalizedName = request.name().trim();
        if (categoryRepository.findByUserIdAndNameIgnoreCase(userId, normalizedName).isPresent()) {
            throw new BadRequestException("Categoria ja existe para este usuario.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Usuario nao encontrado."));

        Category category = new Category();
        category.setUser(user);
        category.setName(normalizedName);
        category.setColor(request.color().trim());

        return toResponse(categoryRepository.save(category));
    }

    public CategoryResponse update(UUID userId, UUID categoryId, CategoryUpdateRequest request) {
        Category category = getByIdAndUser(categoryId, userId);
        String normalizedName = request.name().trim();

        categoryRepository.findByUserIdAndNameIgnoreCase(userId, normalizedName)
                .filter(existing -> !existing.getId().equals(categoryId))
                .ifPresent(existing -> {
                    throw new BadRequestException("Categoria ja existe para este usuario.");
                });

        category.setName(normalizedName);
        category.setColor(request.color().trim());
        return toResponse(categoryRepository.save(category));
    }

    public void delete(UUID userId, UUID categoryId) {
        Category category = getByIdAndUser(categoryId, userId);
        try {
            categoryRepository.delete(category);
            categoryRepository.flush();
        } catch (DataIntegrityViolationException ex) {
            throw new BadRequestException("Nao foi possivel excluir categoria com transacoes ou metas vinculadas.");
        }
    }

    @Transactional(readOnly = true)
    public Category getByIdAndUser(UUID categoryId, UUID userId) {
        return categoryRepository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new BadRequestException("Categoria nao pertence ao usuario."));
    }

    @Transactional(readOnly = true)
    public Category findOrCreateByName(UUID userId, String categoryName, String fallbackColor) {
        return categoryRepository.findByUserIdAndNameIgnoreCase(userId, categoryName)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new UnauthorizedException("Usuario nao encontrado."));
                    Category category = new Category();
                    category.setUser(user);
                    category.setName(categoryName.trim());
                    category.setColor(fallbackColor);
                    return categoryRepository.save(category);
                });
    }

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(category.getId(), category.getName(), category.getColor());
    }
}
