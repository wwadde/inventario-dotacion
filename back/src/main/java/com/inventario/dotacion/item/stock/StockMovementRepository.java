package com.inventario.dotacion.item.stock;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {

    @EntityGraph(attributePaths = {"itemType"})
    List<StockMovement> findTop200ByOrderByPerformedAtDesc();

    @EntityGraph(attributePaths = {"itemType"})
    List<StockMovement> findTop200ByItemTypeIdOrderByPerformedAtDesc(UUID itemTypeId);
}
