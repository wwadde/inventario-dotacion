package com.inventario.dotacion.item.stock;

import java.util.List;
import java.util.UUID;

import com.inventario.dotacion.item.ItemType;
import com.inventario.dotacion.item.dto.StockMovementResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class StockMovementService {

    private final StockMovementRepository stockMovementRepository;

    @Transactional(readOnly = true)
    public List<StockMovementResponse> listMovements(UUID itemTypeId) {
        List<StockMovement> movements = itemTypeId == null
                ? stockMovementRepository.findTop200ByOrderByPerformedAtDesc()
                : stockMovementRepository.findTop200ByItemTypeIdOrderByPerformedAtDesc(itemTypeId);

        return movements.stream().map(this::toResponse).toList();
    }

    public void registerMovement(
            ItemType itemType,
            StockMovementType movementType,
            int quantity,
            int stockBefore,
            int stockAfter,
            String reason,
            String referenceType,
            UUID referenceId,
            String performedBy
    ) {
        StockMovement movement = new StockMovement();
        movement.setItemType(itemType);
        movement.setMovementType(movementType);
        movement.setQuantity(quantity);
        movement.setStockBefore(stockBefore);
        movement.setStockAfter(stockAfter);
        movement.setReason(normalizeNullable(reason));
        movement.setReferenceType(normalizeNullable(referenceType));
        movement.setReferenceId(referenceId);
        movement.setPerformedBy(StringUtils.hasText(performedBy) ? performedBy.trim() : "system");

        stockMovementRepository.save(movement);
    }

    private String normalizeNullable(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private StockMovementResponse toResponse(StockMovement movement) {
        return new StockMovementResponse(
                movement.getId(),
                movement.getItemType().getId(),
                movement.getItemType().getCode(),
                movement.getItemType().getName(),
                movement.getMovementType(),
                movement.getQuantity(),
                movement.getStockBefore(),
                movement.getStockAfter(),
                movement.getReason(),
                movement.getReferenceType(),
                movement.getReferenceId(),
                movement.getPerformedBy(),
                movement.getPerformedAt()
        );
    }
}
