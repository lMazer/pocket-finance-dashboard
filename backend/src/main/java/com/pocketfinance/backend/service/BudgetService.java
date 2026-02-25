package com.pocketfinance.backend.service;

import com.pocketfinance.backend.api.dto.BudgetCreateRequest;
import com.pocketfinance.backend.api.dto.BudgetResponse;
import com.pocketfinance.backend.api.dto.BudgetUpdateRequest;
import com.pocketfinance.backend.domain.model.Budget;
import com.pocketfinance.backend.domain.model.Category;
import com.pocketfinance.backend.domain.model.User;
import com.pocketfinance.backend.domain.repository.BudgetRepository;
import com.pocketfinance.backend.domain.repository.UserRepository;
import com.pocketfinance.backend.exception.BadRequestException;
import com.pocketfinance.backend.exception.NotFoundException;
import com.pocketfinance.backend.exception.UnauthorizedException;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;
    private final CategoryService categoryService;
    private final MonthParser monthParser;

    public BudgetService(BudgetRepository budgetRepository,
                         UserRepository userRepository,
                         CategoryService categoryService,
                         MonthParser monthParser) {
        this.budgetRepository = budgetRepository;
        this.userRepository = userRepository;
        this.categoryService = categoryService;
        this.monthParser = monthParser;
    }

    @Transactional(readOnly = true)
    public List<BudgetResponse> list(UUID userId, String month) {
        LocalDate monthRef = monthParser.parseOptionalMonth(month)
                .orElse(LocalDate.now().withDayOfMonth(1));
        return budgetRepository.findByUserIdAndMonthRefOrderByCategoryNameAsc(userId, monthRef)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public BudgetResponse create(UUID userId, BudgetCreateRequest request) {
        LocalDate monthRef = monthParser.parseRequiredMonth(request.month(), "month");
        Category category = categoryService.getByIdAndUser(request.categoryId(), userId);

        if (budgetRepository.existsByUserIdAndMonthRefAndCategoryId(userId, monthRef, request.categoryId())) {
            throw new BadRequestException("Budget ja cadastrado para user+month+category.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Usuario nao encontrado."));

        Budget budget = new Budget();
        budget.setUser(user);
        budget.setCategory(category);
        budget.setMonthRef(monthRef);
        budget.setAmount(request.amount());

        return toResponse(budgetRepository.save(budget));
    }

    public BudgetResponse update(UUID userId, UUID id, BudgetUpdateRequest request) {
        Budget budget = budgetRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("Budget nao encontrado."));
        budget.setAmount(request.amount());
        return toResponse(budgetRepository.save(budget));
    }

    private BudgetResponse toResponse(Budget budget) {
        return new BudgetResponse(
                budget.getId(),
                budget.getCategory().getId(),
                budget.getCategory().getName(),
                budget.getMonthRef(),
                budget.getAmount()
        );
    }
}
