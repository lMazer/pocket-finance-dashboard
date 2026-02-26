package com.pocketfinance.backend.api.controller;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.pocketfinance.backend.api.dto.CsvImportResponse;
import com.pocketfinance.backend.security.AppUserPrincipal;
import com.pocketfinance.backend.service.CsvService;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

@ExtendWith(MockitoExtension.class)
class ReportControllerTest {

    @Mock
    private CsvService csvService;

    private ReportController controller;
    private AppUserPrincipal principal;

    @BeforeEach
    void setUp() {
        controller = new ReportController(csvService);
        principal = new AppUserPrincipal(UUID.randomUUID(), "demo@pocket.local", "Demo User");
    }

    @Test
    void importCsvShouldDelegateToService() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "transactions.csv",
                "text/csv",
                "date,description,amount,type,category\n".getBytes(StandardCharsets.UTF_8)
        );
        CsvImportResponse expected = new CsvImportResponse(2, 1);

        when(csvService.importSimpleCsv(principal.getUserId(), file)).thenReturn(expected);

        CsvImportResponse response = controller.importCsv(principal, file);

        assertEquals(expected, response);
        verify(csvService).importSimpleCsv(principal.getUserId(), file);
    }

    @Test
    void exportCsvShouldReturnAttachmentResponseWithCsvHeaders() {
        UUID categoryId = UUID.randomUUID();
        byte[] payload = "date,description\n2026-02-26,Teste\n".getBytes(StandardCharsets.UTF_8);
        when(csvService.exportCsv(principal.getUserId(), "2026-02", categoryId)).thenReturn(payload);

        ResponseEntity<byte[]> response = controller.exportCsv(principal, "2026-02", categoryId);

        assertEquals(200, response.getStatusCode().value());
        assertEquals("text/csv", response.getHeaders().getContentType().toString());
        assertTrue(response.getHeaders().getFirst("Content-Disposition").contains("transactions.csv"));
        assertArrayEquals(payload, response.getBody());
        verify(csvService).exportCsv(principal.getUserId(), "2026-02", categoryId);
    }

    @Test
    void exportCsvShouldAllowNullFilters() {
        byte[] payload = "date,description\n".getBytes(StandardCharsets.UTF_8);
        when(csvService.exportCsv(principal.getUserId(), null, null)).thenReturn(payload);

        ResponseEntity<byte[]> response = controller.exportCsv(principal, null, null);

        assertEquals(200, response.getStatusCode().value());
        assertEquals("text/csv", response.getHeaders().getContentType().toString());
        assertArrayEquals(payload, response.getBody());
        verify(csvService).exportCsv(principal.getUserId(), null, null);
    }
}
