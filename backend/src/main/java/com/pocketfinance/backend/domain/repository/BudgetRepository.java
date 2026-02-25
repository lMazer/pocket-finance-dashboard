package com.pocketfinance.backend.domain.repository;

import com.pocketfinance.backend.domain.model.Budget;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BudgetRepository extends JpaRepository<Budget, UUID> {

    List<Budget> findByUserIdAndMonthRefOrderByCategoryNameAsc(UUID userId, LocalDate monthRef);

    Optional<Budget> findByIdAndUserId(UUID id, UUID userId);

    boolean existsByUserIdAndMonthRefAndCategoryId(UUID userId, LocalDate monthRef, UUID categoryId);
}
