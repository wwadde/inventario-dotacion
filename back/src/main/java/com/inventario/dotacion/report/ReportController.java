package com.inventario.dotacion.report;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import com.inventario.dotacion.common.security.AccessControlService;
import com.inventario.dotacion.report.dto.ComplianceRowResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private static final DateTimeFormatter FILE_DATE_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;

    private final ComplianceService complianceService;
    private final AccessControlService accessControlService;

    @GetMapping("/compliance")
    public List<ComplianceRowResponse> getCompliance(@RequestParam(defaultValue = "ALL") ComplianceStatus status) {
        return complianceService.getComplianceRows(status, accessControlService.canViewSensitiveData());
    }

    @GetMapping(value = "/compliance/export", produces =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    public ResponseEntity<byte[]> exportCompliance() {
        byte[] fileContent = complianceService.exportComplianceExcel(accessControlService.canViewSensitiveData());

        String filename = "reporte-dotacion-" + FILE_DATE_FORMATTER.format(LocalDate.now()) + ".xlsx";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));

        return ResponseEntity.ok().headers(headers).body(fileContent);
    }

    @GetMapping(value = "/compliance/export/stream", produces =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    public ResponseEntity<StreamingResponseBody> streamComplianceExport() {
        byte[] fileContent = complianceService.exportComplianceExcel(accessControlService.canViewSensitiveData());

        String filename = "reporte-dotacion-" + FILE_DATE_FORMATTER.format(LocalDate.now()) + ".xlsx";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));

        StreamingResponseBody stream = outputStream -> {
            outputStream.write(fileContent);
            outputStream.flush();
        };

        return ResponseEntity.ok().headers(headers).body(stream);
    }
}
