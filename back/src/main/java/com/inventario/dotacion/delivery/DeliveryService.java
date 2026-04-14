package com.inventario.dotacion.delivery;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import com.inventario.dotacion.common.exception.BusinessException;
import com.inventario.dotacion.common.exception.ResourceNotFoundException;
import com.inventario.dotacion.common.security.AccessControlService;
import com.inventario.dotacion.common.security.DataPrivacyService;
import com.inventario.dotacion.delivery.dto.DeliveryItemRequest;
import com.inventario.dotacion.delivery.dto.DeliveryItemResponse;
import com.inventario.dotacion.delivery.dto.DeliveryRequest;
import com.inventario.dotacion.delivery.dto.DeliveryResponse;
import com.inventario.dotacion.employee.Employee;
import com.inventario.dotacion.employee.EmployeeService;
import com.inventario.dotacion.item.ItemCategory;
import com.inventario.dotacion.item.ItemType;
import com.inventario.dotacion.item.ItemTypeService;
import com.inventario.dotacion.item.stock.StockMovementService;
import com.inventario.dotacion.item.stock.StockMovementType;
import com.inventario.dotacion.requirement.EmployeeRequirement;
import com.inventario.dotacion.requirement.EmployeeRequirementRepository;
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
    private final DeliveryItemRepository deliveryItemRepository;
    private final EmployeeService employeeService;
    private final ItemTypeService itemTypeService;
    private final StockMovementService stockMovementService;
    private final AccessControlService accessControlService;
    private final CertificateService certificateService;
    private final DataPrivacyService dataPrivacyService;
    private final EmployeeRequirementRepository requirementRepository;

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

        DeliveryType deliveryType = request.deliveryType() == null
                ? DeliveryType.IMPLEMENTOS
                : request.deliveryType();

        String performedBy = accessControlService.currentUsernameOrSystem();
        record StockChange(ItemType itemType, int quantity, int stockBefore, int stockAfter) {}
        Map<UUID, StockChange> stockChanges = new HashMap<>();

        Map<UUID, Integer> requestedQuantityByItemType = new HashMap<>();
        for (DeliveryItemRequest itemRequest : request.items()) {
            requestedQuantityByItemType.merge(itemRequest.itemTypeId(), itemRequest.quantity(), Integer::sum);
        }

        Set<UUID> requestedItemTypeIds = new HashSet<>(requestedQuantityByItemType.keySet());
        Set<UUID> duplicateItemTypeIds = requestedItemTypeIds.isEmpty()
            ? Set.of()
            : deliveryItemRepository.findDeliveredItemTypeIdsByEmployee(employee.getId(), requestedItemTypeIds);

        boolean duplicateAcknowledged = Boolean.TRUE.equals(request.duplicateAcknowledged());
        if (!duplicateItemTypeIds.isEmpty() && !duplicateAcknowledged) {
            List<String> duplicatedCodes = duplicateItemTypeIds.stream()
                .map(itemTypeService::findActiveById)
                .map(ItemType::getCode)
                .sorted()
                .toList();

            throw new BusinessException(HttpStatus.BAD_REQUEST,
                "Entrega duplicada detectada para: " + String.join(", ", duplicatedCodes)
                    + ". Debe marcar la confirmacion explicita para continuar.");
        }

        for (Map.Entry<UUID, Integer> requestedEntry : requestedQuantityByItemType.entrySet()) {
            UUID itemTypeId = requestedEntry.getKey();
            int requestedQuantity = requestedEntry.getValue();

            ItemType itemTypeForStock = itemTypeService.findActiveByIdForUpdate(itemTypeId);
                ItemCategory expectedCategory = deliveryType == DeliveryType.REGALOS
                    ? ItemCategory.REGALO
                    : ItemCategory.DOTACION;

                if (itemTypeForStock.getCategory() != expectedCategory) {
                throw new BusinessException(HttpStatus.BAD_REQUEST,
                    "El item " + itemTypeForStock.getCode()
                        + " no corresponde al tipo de entrega actual. Solo se permiten items de categoria "
                        + expectedCategory + ".");
                }

                if (deliveryType == DeliveryType.IMPLEMENTOS) {
                EmployeeRequirement requirement = requirementRepository
                    .findByEmployeeIdAndItemTypeIdAndClosedFalse(employee.getId(), itemTypeId)
                    .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST,
                        "No existe una solicitud activa para el implemento " + itemTypeForStock.getCode()
                            + " en este empleado."));

                long deliveredQuantity = deliveryItemRepository
                    .sumDeliveredQuantityForImplementosSinceTimestamp(
                            employee.getId(),
                            itemTypeId,
                        requirement.getCreatedAt()
                    );
                long pendingQuantity = Math.max(0L, (long) requirement.getRequestedQuantity() - deliveredQuantity);

                if (pendingQuantity <= 0 && !duplicateAcknowledged) {
                    throw new BusinessException(HttpStatus.BAD_REQUEST,
                        "La solicitud del implemento " + itemTypeForStock.getCode()
                            + " ya esta completamente atendida. Marca confirmacion de duplicado para continuar.");
                }

                if (requestedQuantity > pendingQuantity && pendingQuantity > 0 && !duplicateAcknowledged) {
                    throw new BusinessException(HttpStatus.BAD_REQUEST,
                        "La cantidad solicitada para " + itemTypeForStock.getCode()
                            + " excede lo pendiente por entregar. Pendiente actual: " + pendingQuantity + ".");
                }
                }

            int stockBefore = itemTypeForStock.getAvailableStock();
            if (itemTypeForStock.getAvailableStock() < requestedQuantity) {
                throw new BusinessException(HttpStatus.BAD_REQUEST,
                        "Stock insuficiente para el implemento " + itemTypeForStock.getCode() + ". Disponible: "
                                + itemTypeForStock.getAvailableStock() + ", solicitado: " + requestedQuantity + ".");
            }

            int stockAfter = stockBefore - requestedQuantity;
            itemTypeForStock.setAvailableStock(stockAfter);
            stockChanges.put(itemTypeId, new StockChange(itemTypeForStock, requestedQuantity, stockBefore, stockAfter));
        }

        Delivery delivery = new Delivery();
        delivery.setEmployee(employee);
        delivery.setDeliveryType(deliveryType);
        delivery.setDeliveredAt(request.deliveredAt() == null ? LocalDate.now() : request.deliveredAt());
        delivery.setDeliveredBy(request.deliveredBy().trim());
        delivery.setSignerName(normalizeNullable(request.signerName()));
        delivery.setNotes(normalizeNullable(request.notes()));
        delivery.setDuplicateAcknowledged(!duplicateItemTypeIds.isEmpty() && duplicateAcknowledged);
        delivery.setCertificateNumber(buildCertificateNumber());
        delivery.setSignatureImage(decodeSignature(request.signatureDataUrl()));

        for (DeliveryItemRequest itemRequest : request.items()) {
            ItemType itemType = itemTypeService.findActiveById(itemRequest.itemTypeId());

            DeliveryItem item = new DeliveryItem();
            item.setItemType(itemType);
            item.setQuantity(itemRequest.quantity());

            delivery.addItem(item);
        }

        Delivery savedDelivery = deliveryRepository.save(delivery);

        for (StockChange stockChange : stockChanges.values()) {
            stockMovementService.registerMovement(
                    stockChange.itemType(),
                    StockMovementType.OUTBOUND,
                    stockChange.quantity(),
                    stockChange.stockBefore(),
                    stockChange.stockAfter(),
                    "Salida por entrega a " + employee.getFullName(),
                    "DELIVERY",
                    savedDelivery.getId(),
                    performedBy
            );
        }

        if (deliveryType == DeliveryType.IMPLEMENTOS) {
            closeFulfilledRequirements(employee.getId(), requestedQuantityByItemType.keySet(), performedBy);
        }

        return toResponse(savedDelivery, true);
    }

    private void closeFulfilledRequirements(UUID employeeId, Set<UUID> deliveredItemTypeIds, String performedBy) {
        for (UUID itemTypeId : deliveredItemTypeIds) {
            EmployeeRequirement requirement = requirementRepository
                    .findByEmployeeIdAndItemTypeIdAndClosedFalse(employeeId, itemTypeId)
                    .orElse(null);

            if (requirement == null) {
                continue;
            }

            long deliveredQuantity = deliveryItemRepository
                    .sumDeliveredQuantityForImplementosSinceTimestamp(
                        employeeId,
                        itemTypeId,
                        requirement.getCreatedAt()
                    );

            if (deliveredQuantity < requirement.getRequestedQuantity()) {
                continue;
            }

            requirement.setClosed(true);
            requirement.setClosedAt(OffsetDateTime.now());
            requirement.setClosedBy(performedBy);
            requirementRepository.save(requirement);
        }
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
            delivery.getDeliveryType(),
                delivery.getCertificateNumber(),
                delivery.getDeliveredAt(),
                delivery.getDeliveredBy(),
                delivery.getSignerName(),
                delivery.getNotes(),
                delivery.isDuplicateAcknowledged(),
                delivery.getSignatureImage() != null && delivery.getSignatureImage().length > 0,
                items,
                delivery.getCreatedAt(),
                delivery.getUpdatedAt()
        );
    }
}
