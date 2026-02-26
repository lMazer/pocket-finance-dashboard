package com.pocketfinance.backend.service;

import com.pocketfinance.backend.api.dto.CsvImportResponse;
import com.pocketfinance.backend.domain.model.Category;
import com.pocketfinance.backend.domain.model.FinanceTransaction;
import com.pocketfinance.backend.domain.model.TransactionType;
import com.pocketfinance.backend.domain.model.User;
import com.pocketfinance.backend.domain.repository.FinanceTransactionRepository;
import com.pocketfinance.backend.domain.repository.UserRepository;
import com.pocketfinance.backend.exception.BadRequestException;
import com.pocketfinance.backend.exception.UnauthorizedException;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.CSVRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional
public class CsvService {
    private static final Logger log = LoggerFactory.getLogger(CsvService.class);

    private final UserRepository userRepository;
    private final CategoryService categoryService;
    private final FinanceTransactionRepository transactionRepository;
    private final TransactionService transactionService;

    public CsvService(UserRepository userRepository,
                      CategoryService categoryService,
                      FinanceTransactionRepository transactionRepository,
                      TransactionService transactionService) {
        this.userRepository = userRepository;
        this.categoryService = categoryService;
        this.transactionRepository = transactionRepository;
        this.transactionService = transactionService;
    }

    public CsvImportResponse importSimpleCsv(UUID userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Arquivo CSV obrigatorio.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Usuario nao encontrado."));

        int skipped = 0;
        List<FinanceTransaction> toSave = new java.util.ArrayList<>();
        Map<String, Category> categoryCache = new HashMap<>();

        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setHeader("date", "description", "amount", "type", "category")
                .setSkipHeaderRecord(true)
                .setIgnoreHeaderCase(true)
                .setIgnoreEmptyLines(true)
                .setTrim(true)
                .build();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8));
             CSVParser parser = format.parse(reader)) {

            for (CSVRecord record : parser) {
                try {
                    LocalDate date = LocalDate.parse(requiredColumn(record, "date"));
                    String description = requiredColumn(record, "description");
                    BigDecimal amount = new BigDecimal(requiredColumn(record, "amount"));
                    TransactionType type = TransactionType.valueOf(requiredColumn(record, "type").toUpperCase());
                    String categoryName = requiredColumn(record, "category");

                    String normalizedCategoryKey = categoryName.trim().toLowerCase();
                    Category category = categoryCache.computeIfAbsent(normalizedCategoryKey,
                            key -> categoryService.findOrCreateByName(userId, categoryName.trim(), colorFromName(categoryName)));

                    FinanceTransaction transaction = new FinanceTransaction();
                    transaction.setUser(user);
                    transaction.setCategory(category);
                    transaction.setType(type);
                    transaction.setDescription(description.trim());
                    transaction.setAmount(amount);
                    transaction.setDate(date);
                    toSave.add(transaction);
                } catch (Exception ex) {
                    log.warn("CSV import skipped row {}: {}", record.getRecordNumber(), ex.getMessage());
                    skipped++;
                }
            }
        } catch (IOException ex) {
            throw new BadRequestException("Nao foi possivel ler o arquivo CSV.");
        }

        if (!toSave.isEmpty()) {
            transactionRepository.saveAll(toSave);
        }

        return new CsvImportResponse(toSave.size(), skipped);
    }

    @Transactional(readOnly = true)
    public byte[] exportCsv(UUID userId, String month, UUID categoryId) {
        List<FinanceTransaction> transactions = transactionService.findForExport(userId, month, categoryId);
        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setHeader("date", "description", "amount", "type", "category")
                .build();

        try (StringWriter writer = new StringWriter(); CSVPrinter printer = new CSVPrinter(writer, format)) {
            for (FinanceTransaction transaction : transactions) {
                printer.printRecord(
                        transaction.getDate(),
                        transaction.getDescription(),
                        transaction.getAmount(),
                        transaction.getType(),
                        transaction.getCategory().getName()
                );
            }
            printer.flush();
            return writer.toString().getBytes(StandardCharsets.UTF_8);
        } catch (IOException ex) {
            throw new BadRequestException("Falha ao gerar CSV.");
        }
    }

    private String requiredColumn(CSVRecord record, String column) {
        String value = record.isMapped(column) ? record.get(column) : null;
        if (value == null || value.isBlank()) {
            throw new BadRequestException("Coluna obrigatoria ausente: " + column);
        }
        return value;
    }

    private String colorFromName(String name) {
        int hash = Math.abs(name.hashCode());
        int r = (hash % 128) + 64;
        int g = ((hash / 7) % 128) + 64;
        int b = ((hash / 13) % 128) + 64;
        return String.format("#%02X%02X%02X", r, g, b);
    }
}
