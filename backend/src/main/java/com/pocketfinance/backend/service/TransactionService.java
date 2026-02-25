package com.pocketfinance.backend.service;

import com.pocketfinance.backend.api.dto.PageResponse;
import com.pocketfinance.backend.api.dto.TransactionCreateRequest;
import com.pocketfinance.backend.api.dto.TransactionResponse;
import com.pocketfinance.backend.api.dto.TransactionUpdateRequest;
import com.pocketfinance.backend.domain.model.Category;
import com.pocketfinance.backend.domain.model.FinanceTransaction;
import com.pocketfinance.backend.domain.model.TransactionType;
import com.pocketfinance.backend.domain.model.User;
import com.pocketfinance.backend.domain.repository.FinanceTransactionRepository;
import com.pocketfinance.backend.domain.repository.UserRepository;
import com.pocketfinance.backend.exception.NotFoundException;
import com.pocketfinance.backend.exception.UnauthorizedException;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TransactionService {

    private static final int DEFAULT_PAGE_SIZE = 20;

    private final FinanceTransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final CategoryService categoryService;
    private final MonthParser monthParser;

    public TransactionService(FinanceTransactionRepository transactionRepository,
                              UserRepository userRepository,
                              CategoryService categoryService,
                              MonthParser monthParser) {
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.categoryService = categoryService;
        this.monthParser = monthParser;
    }

    @Transactional(readOnly = true)
    public PageResponse<TransactionResponse> list(UUID userId,
                                                  String month,
                                                  UUID categoryId,
                                                  TransactionType type,
                                                  String q,
                                                  Integer page) {
        Pageable pageable = PageRequest.of(Math.max(page == null ? 0 : page, 0), DEFAULT_PAGE_SIZE,
                Sort.by(Sort.Order.desc("date"), Sort.Order.desc("createdAt")));

        Specification<FinanceTransaction> specification = buildSpecification(userId, month, categoryId, type, q);
        Page<FinanceTransaction> result = transactionRepository.findAll(specification, pageable);

        List<TransactionResponse> items = result.getContent().stream().map(this::toResponse).toList();
        return new PageResponse<>(items, result.getNumber(), result.getSize(), result.getTotalElements(),
                result.getTotalPages(), result.isLast());
    }

    public TransactionResponse create(UUID userId, TransactionCreateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Usuario nao encontrado."));
        Category category = categoryService.getByIdAndUser(request.categoryId(), userId);

        FinanceTransaction transaction = new FinanceTransaction();
        transaction.setUser(user);
        transaction.setCategory(category);
        transaction.setType(request.type());
        transaction.setDescription(request.description().trim());
        transaction.setAmount(request.amount());
        transaction.setDate(request.date());

        return toResponse(transactionRepository.save(transaction));
    }

    @Transactional(readOnly = true)
    public TransactionResponse getById(UUID userId, UUID id) {
        FinanceTransaction transaction = transactionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("Transacao nao encontrada."));
        return toResponse(transaction);
    }

    public TransactionResponse update(UUID userId, UUID id, TransactionUpdateRequest request) {
        FinanceTransaction transaction = transactionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("Transacao nao encontrada."));

        if (request.categoryId() != null) {
            Category category = categoryService.getByIdAndUser(request.categoryId(), userId);
            transaction.setCategory(category);
        }
        if (request.type() != null) {
            transaction.setType(request.type());
        }
        if (request.description() != null && !request.description().isBlank()) {
            transaction.setDescription(request.description().trim());
        }
        if (request.amount() != null) {
            transaction.setAmount(request.amount());
        }
        if (request.date() != null) {
            transaction.setDate(request.date());
        }

        return toResponse(transactionRepository.save(transaction));
    }

    public void delete(UUID userId, UUID id) {
        FinanceTransaction transaction = transactionRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException("Transacao nao encontrada."));
        transactionRepository.delete(transaction);
    }

    @Transactional(readOnly = true)
    public List<FinanceTransaction> findForExport(UUID userId, String month, UUID categoryId) {
        Specification<FinanceTransaction> specification = buildSpecification(userId, month, categoryId, null, null);
        return transactionRepository.findAll(specification, Sort.by(Sort.Order.desc("date"), Sort.Order.desc("createdAt")));
    }

    private Specification<FinanceTransaction> buildSpecification(UUID userId,
                                                                 String month,
                                                                 UUID categoryId,
                                                                 TransactionType type,
                                                                 String q) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(builder.equal(root.get("user").get("id"), userId));

            monthParser.parseOptionalMonth(month).ifPresent(monthRef -> {
                LocalDate start = monthRef;
                LocalDate end = monthRef.plusMonths(1).minusDays(1);
                predicates.add(builder.between(root.get("date"), start, end));
            });

            if (categoryId != null) {
                predicates.add(builder.equal(root.get("category").get("id"), categoryId));
            }

            if (type != null) {
                predicates.add(builder.equal(root.get("type"), type));
            }

            if (q != null && !q.isBlank()) {
                predicates.add(builder.like(builder.lower(root.get("description")), "%" + q.toLowerCase() + "%"));
            }

            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private TransactionResponse toResponse(FinanceTransaction transaction) {
        return new TransactionResponse(
                transaction.getId(),
                transaction.getCategory().getId(),
                transaction.getCategory().getName(),
                transaction.getType(),
                transaction.getDescription(),
                transaction.getAmount(),
                transaction.getDate(),
                transaction.getCreatedAt(),
                transaction.getUpdatedAt()
        );
    }
}
