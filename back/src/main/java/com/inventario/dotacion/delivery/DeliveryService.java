package com.inventario.dotacion.delivery;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

import com.inventario.dotacion.common.exception.BusinessException;
import com.inventario.dotacion.common.exception.ResourceNotFoundException;
import com.inventario.dotacion.common.security.DataPrivacyService;
import com.inventario.dotacion.delivery.dto.DeliveryItemRequest;
import com.inventario.dotacion.delivery.dto.DeliveryItemResponse;
import com.inventario.dotacion.delivery.dto.DeliveryRequest;
import com.inventario.dotacion.delivery.dto.DeliveryResponse;
import com.inventario.dotacion.employee.Employee;
import com.inventario.dotacion.employee.EmployeeService;
import com.inventario.dotacion.item.ItemType;
import com.inventario.dotacion.item.ItemTypeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class DeliveryService {

    private static final DateTimeFormatter CERTIFICATE_DATE_FORMAT = DateTimeFormatter.BASIC_ISO_DATE;

    private final DeliveryRepository deliveryRepository;
    private final EmployeeService employeeService;
    private final ItemTypeService itemTypeService;
    private final CertificateService certificateService;
    private final DataPrivacyService dataPrivacyService;

    @Transactional(readOnly = true)
    public List<DeliveryResponse> listDeliveries(UUID employeeId, boolean includeSensitiveData) {
        List<Delivery> deliveries = employeeId == null
                ? deliveryRepository.findTop200ByOrderByDeliveredAtDescCreatedAtDesc()
                : deliveryRepository.findByEmployeeIdOrderByDeliveredAtDescCreatedAtDesc(employeeId);

        return deliveries.stream().map(delivery -> toResponse(delivery, includeSensitiveData)).toList();
    }

    @Transactional(readOnly = true)
    public DeliveryResponse getDelivery(UUID deliveryId, boolean includeSensitiveData) {
        return toResponse(findById(deliveryId), includeSensitiveData);
    }

    @Transactional
    public DeliveryResponse createDelivery(DeliveryRequest request) {
        Employee employee = employeeService.findById(request.employeeId());
        if (!employee.isActive()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST,
                    "No se puede registrar una entrega para un empleado inactivo.");
        }

        Delivery delivery = new Delivery();
        delivery.setEmployee(employee);
        delivery.setDeliveredAt(request.deliveredAt() == null ? LocalDate.now() : request.deliveredAt());
        delivery.setDeliveredBy(request.deliveredBy().trim());
        delivery.setSignerName(normalizeNullable(request.signerName()));
        delivery.setNotes(normalizeNullable(request.notes()));
        delivery.setCertificateNumber(buildCertificateNumber());
        delivery.setSignatureImage(decodeSignature(request.signatureDataUrl()));

        for (DeliveryItemRequest itemRequest : request.items()) {
            ItemType itemType = itemTypeService.findActiveById(itemRequest.itemTypeId());

            DeliveryItem item = new DeliveryItem();
            item.setItemType(itemType);
            item.setQuantity(itemRequest.quantity());
            delivery.addItem(item);
        }

        return toResponse(deliveryRepository.save(delivery), true);
    }

    @Transactional(readOnly = true)
    public byte[] generateCertificatePdf(UUID deliveryId) {
        Delivery delivery = findById(deliveryId);
        return certificateService.generateCertificate(delivery);
    }

    @Transactional(readOnly = true)
    public byte[] generateLatestCertificatePdfByEmployeeDocument(String documentNumber) {
        if (!StringUtils.hasText(documentNumber)) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Debe enviar un numero de documento valido.");
        }

        Delivery delivery = deliveryRepository
                .findTopByEmployeeDocumentNumberIgnoreCaseOrderByDeliveredAtDescCreatedAtDesc(documentNumber.trim())
                .orElseThrow(() -> new ResourceNotFoundException("No existe una entrega para el documento indicado."));

        return certificateService.generateCertificate(delivery);
    }

    private Delivery findById(UUID deliveryId) {
        return deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe la entrega solicitada."));
    }

    private String buildCertificateNumber() {
        String datePart = CERTIFICATE_DATE_FORMAT.format(LocalDate.now());
        String randomPart = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return "CERT-" + datePart + "-" + randomPart;
    }

    private byte[] decodeSignature(String signatureDataUrl) {
        if (!StringUtils.hasText(signatureDataUrl)) {
            return null;
        }

        String[] parts = signatureDataUrl.split(",", 2);
        if (parts.length != 2 || !parts[0].contains("base64")) {
            throw new BusinessException(HttpStatus.BAD_REQUEST,
                    "El formato de la firma no es valido. Debe enviarse en base64.");
        }

        try {
            return Base64.getDecoder().decode(parts[1]);
        } catch (IllegalArgumentException ex) {
            throw new BusinessException(HttpStatus.BAD_REQUEST,
                    "No fue posible decodificar la firma enviada.");
        }
    }

    private String normalizeNullable(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private DeliveryResponse toResponse(Delivery delivery, boolean includeSensitiveData) {
        List<DeliveryItemResponse> items = delivery.getItems().stream()
                .map(item -> new DeliveryItemResponse(
                        item.getId(),
                        item.getItemType().getId(),
                        item.getItemType().getCode(),
                        item.getItemType().getName(),
                        item.getItemType().getCategory(),
                        item.getQuantity()
                ))
                .toList();

            String employeeDocument = includeSensitiveData
                ? delivery.getEmployee().getDocumentNumber()
                : dataPrivacyService.maskDocument(delivery.getEmployee().getDocumentNumber());

        return new DeliveryResponse(
                delivery.getId(),
                delivery.getEmployee().getId(),
                delivery.getEmployee().getFullName(),
                employeeDocument,
                delivery.getCertificateNumber(),
                delivery.getDeliveredAt(),
                delivery.getDeliveredBy(),
                delivery.getSignerName(),
                delivery.getNotes(),
                delivery.getSignatureImage() != null && delivery.getSignatureImage().length > 0,
                items,
                delivery.getCreatedAt(),
                delivery.getUpdatedAt()
        );
    }
}
