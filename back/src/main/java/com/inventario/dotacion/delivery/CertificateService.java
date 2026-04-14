package com.inventario.dotacion.delivery;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.time.format.DateTimeFormatter;

import gg.jte.TemplateEngine;
import gg.jte.output.StringOutput;
import lombok.RequiredArgsConstructor;
import org.openpdf.pdf.ITextRenderer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CertificateService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final TemplateEngine templateEngine;

    @Value("${app.company-name:Inventario Dotacion S.A.S.}")
    private String companyName;

    public byte[] generateCertificate(Delivery delivery) {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            String html = renderCertificateHtml(delivery);
            ITextRenderer renderer = ITextRenderer.fromString(html);
            renderer.layout();
            renderer.createPDF(outputStream);
            return outputStream.toByteArray();
        } catch (Exception ex) {
            throw new IllegalStateException("No fue posible generar el certificado PDF", ex);
        }
    }

    private String renderCertificateHtml(Delivery delivery) {
        List<CertificateItemRow> items = new ArrayList<>();
        for (DeliveryItem item : delivery.getItems()) {
            items.add(new CertificateItemRow(
                    item.getItemType().getCode(),
                    item.getItemType().getName(),
                    item.getQuantity()
            ));
        }

        Map<String, Object> model = new HashMap<>();
        model.put("companyName", companyName);
        model.put("certificateNumber", delivery.getCertificateNumber());
        model.put("deliveredAt", DATE_FORMATTER.format(delivery.getDeliveredAt()));
        model.put("deliveredBy", delivery.getDeliveredBy());
        model.put("employeeName", delivery.getEmployee().getFullName());
        model.put("employeeDocument", delivery.getEmployee().getDocumentNumber());
        model.put("signerName", delivery.getSignerName());
        model.put("notes", delivery.getNotes());
        model.put("signatureDataUrl", buildSignatureDataUrl(delivery.getSignatureImage()));
        model.put("items", items);

        StringOutput output = new StringOutput();
        templateEngine.render("certificates/delivery-certificate.jte", model, output);
        return output.toString();
    }

    private String buildSignatureDataUrl(byte[] signatureImage) {
        if (signatureImage == null || signatureImage.length == 0) {
            return null;
        }
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(signatureImage);
    }

    public record CertificateItemRow(String code, String name, int quantity) {}
}
