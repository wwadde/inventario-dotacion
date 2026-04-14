package com.inventario.dotacion.delivery;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeliveryRepository extends JpaRepository<Delivery, UUID> {

    @EntityGraph(attributePaths = {"employee", "items", "items.itemType"})
    List<Delivery> findTop200ByOrderByDeliveredAtDescCreatedAtDesc();

    @EntityGraph(attributePaths = {"employee", "items", "items.itemType"})
    List<Delivery> findByEmployeeIdOrderByDeliveredAtDescCreatedAtDesc(UUID employeeId);

    @Override
    @EntityGraph(attributePaths = {"employee", "items", "items.itemType"})
    Optional<Delivery> findById(UUID deliveryId);

    @EntityGraph(attributePaths = {"employee", "items", "items.itemType"})
    Optional<Delivery> findTopByEmployeeDocumentNumberIgnoreCaseOrderByDeliveredAtDescCreatedAtDesc(String documentNumber);

    long countByDeliveredAtBetween(LocalDate start, LocalDate end);
}
