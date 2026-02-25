package com.pocketfinance.backend.api.controller;

import com.pocketfinance.backend.api.dto.CsvImportResponse;
import com.pocketfinance.backend.security.AppUserPrincipal;
import com.pocketfinance.backend.service.CsvService;
import java.util.UUID;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping
public class ReportController {

    private final CsvService csvService;

    public ReportController(CsvService csvService) {
        this.csvService = csvService;
    }

    @PostMapping(value = "/import/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CsvImportResponse importCsv(@AuthenticationPrincipal AppUserPrincipal principal,
                                       @RequestPart("file") MultipartFile file) {
        return csvService.importSimpleCsv(principal.getUserId(), file);
    }

    @GetMapping(value = "/export/csv", produces = "text/csv")
    public ResponseEntity<byte[]> exportCsv(@AuthenticationPrincipal AppUserPrincipal principal,
                                            @RequestParam(required = false) String month,
                                            @RequestParam(required = false) UUID category) {
        byte[] payload = csvService.exportCsv(principal.getUserId(), month, category);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDisposition(ContentDisposition.attachment().filename("transactions.csv").build());

        return ResponseEntity.ok()
                .headers(headers)
                .body(payload);
    }
}
