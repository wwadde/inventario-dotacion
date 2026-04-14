package com.inventario.dotacion.delivery;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

import com.inventario.dotacion.common.security.AccessControlService;
import com.inventario.dotacion.delivery.dto.DeliveryRequest;
import com.inventario.dotacion.delivery.dto.DeliveryResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/deliveries")
@RequiredArgsConstructor
public class DeliveryController {

    private static final DateTimeFormatter FILE_DATE_FORMATTER = DateTimeFormatter.BASIC_ISO_DATE;

    private final DeliveryService deliveryService;
    private final AccessControlService accessControlService;

    @GetMapping
    public List<DeliveryResponse> listDeliveries(@RequestParam(required = false) UUID employeeId) {
        return deliveryService.listDeliveries(employeeId, accessControlService.canViewSensitiveData());
    }

    @GetMapping("/{deliveryId}")
    public DeliveryResponse getDelivery(@PathVariable UUID deliveryId) {
        return deliveryService.getDelivery(deliveryId, accessControlService.canViewSensitiveData());
    }

    @PostMapping
    public ResponseEntity<DeliveryResponse> createDelivery(@Valid @RequestBody DeliveryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(deliveryService.createDelivery(request));
    }

    @GetMapping(value = "/{deliveryId}/certificate", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadCertificate(@PathVariable UUID deliveryId) {
        byte[] content = deliveryService.generateCertificatePdf(deliveryId);

        String filename = "certificado-"
                + FILE_DATE_FORMATTER.format(LocalDate.now())
                + "-"
                + deliveryId
                + ".pdf";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.inline().filename(filename).build());

        return ResponseEntity.ok().headers(headers).body(content);
    }

    @GetMapping(value = "/{deliveryId}/certificate/stream", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<StreamingResponseBody> streamCertificate(@PathVariable UUID deliveryId) {
        byte[] content = deliveryService.generateCertificatePdf(deliveryId);

        String filename = "certificado-"
                + FILE_DATE_FORMATTER.format(LocalDate.now())
                + "-"
                + deliveryId
                + ".pdf";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.inline().filename(filename).build());

        StreamingResponseBody stream = outputStream -> {
            outputStream.write(content);
            outputStream.flush();
        };

        return ResponseEntity.ok().headers(headers).body(stream);
    }

    @GetMapping(value = "/by-document/{documentNumber}/latest/certificate/stream", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<StreamingResponseBody> streamLatestCertificateByDocument(@PathVariable String documentNumber) {
        byte[] content = deliveryService.generateLatestCertificatePdfByEmployeeDocument(documentNumber);

        String filename = "certificado-"
                + FILE_DATE_FORMATTER.format(LocalDate.now())
                + "-"
                + documentNumber
                + ".pdf";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.inline().filename(filename).build());

        StreamingResponseBody stream = outputStream -> {
            outputStream.write(content);
            outputStream.flush();
        };

        return ResponseEntity.ok().headers(headers).body(stream);
    }
}
