package com.pocketfinance.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pocketfinance.backend.api.dto.CsvImportResponse;
import com.pocketfinance.backend.domain.model.Category;
import com.pocketfinance.backend.domain.model.FinanceTransaction;
import com.pocketfinance.backend.domain.model.TransactionType;
import com.pocketfinance.backend.domain.model.User;
import com.pocketfinance.backend.domain.repository.FinanceTransactionRepository;
import com.pocketfinance.backend.domain.repository.UserRepository;
import com.pocketfinance.backend.exception.BadRequestException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

@ExtendWith(MockitoExtension.class)
class CsvServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private CategoryService categoryService;
    @Mock
    private FinanceTransactionRepository transactionRepository;
    @Mock
    private TransactionService transactionService;

    private CsvService csvService;
    private UUID userId;
    private User user;

    @BeforeEach
    void setUp() {
        csvService = new CsvService(userRepository, categoryService, transactionRepository, transactionService);
        userId = UUID.randomUUID();
        user = new User();
        user.setId(userId);
    }

    @Test
    void importSimpleCsvShouldAcceptReorderedHeadersByName() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        Category category = new Category();
        category.setId(UUID.randomUUID());
        category.setName("Alimentacao");
        category.setColor("#33CCAA");
        when(categoryService.findOrCreateByName(eq(userId), eq("Alimentacao"), anyString())).thenReturn(category);

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "transactions.csv",
                "text/csv",
                """
                amount,date,category,type,description
                123.45,2026-02-26,Alimentacao,expense,Supermercado
                """.getBytes()
        );

        CsvImportResponse response = csvService.importSimpleCsv(userId, file);

        assertEquals(1, response.imported());
        assertEquals(0, response.skipped());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<FinanceTransaction>> captor = ArgumentCaptor.forClass(List.class);
        verify(transactionRepository).saveAll(captor.capture());

        FinanceTransaction saved = captor.getValue().getFirst();
        assertEquals(user, saved.getUser());
        assertEquals(category, saved.getCategory());
        assertEquals(TransactionType.EXPENSE, saved.getType());
        assertEquals("Supermercado", saved.getDescription());
        assertEquals(new BigDecimal("123.45"), saved.getAmount());
        assertEquals(LocalDate.of(2026, 2, 26), saved.getDate());
    }

    @Test
    void importSimpleCsvShouldFailWhenRequiredHeaderIsMissing() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "invalid.csv",
                "text/csv",
                """
                date,description,amount,type
                2026-02-26,Sem categoria,10.00,EXPENSE
                """.getBytes()
        );

        BadRequestException exception = assertThrows(BadRequestException.class, () -> csvService.importSimpleCsv(userId, file));
        assertEquals("CSV invalido. Cabecalho obrigatorio ausente: category", exception.getMessage());
        verify(transactionRepository, never()).saveAll(anyList());
    }
}
