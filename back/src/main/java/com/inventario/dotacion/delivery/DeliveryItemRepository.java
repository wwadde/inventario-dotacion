package com.inventario.dotacion.delivery;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DeliveryItemRepository extends JpaRepository<DeliveryItem, UUID> {

    @Query("""
            select new com.inventario.dotacion.delivery.LastDeliverySnapshot(
                d.employee.id,
                di.itemType.id,
                max(d.deliveredAt)
            )
            from DeliveryItem di
            join di.delivery d
            where d.employee.id in :employeeIds
            group by d.employee.id, di.itemType.id
            """)
    List<LastDeliverySnapshot> findLatestDeliveriesByEmployeeIds(@Param("employeeIds") Collection<UUID> employeeIds);

    @Query(value = """
            select coalesce(sum(di.quantity * it.unit_cost), 0)
            from delivery_items di
            join deliveries d on d.id = di.delivery_id
            join item_types it on it.id = di.item_type_id
            where d.delivered_at between :startDate and :endDate
            """, nativeQuery = true)
    BigDecimal sumDeliveredCostBetween(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("""
            select distinct di.itemType.id
            from DeliveryItem di
            join di.delivery d
            where d.employee.id = :employeeId
              and di.itemType.id in :itemTypeIds
            """)
    Set<UUID> findDeliveredItemTypeIdsByEmployee(
            @Param("employeeId") UUID employeeId,
            @Param("itemTypeIds") Collection<UUID> itemTypeIds
    );

    @Query("""
            select coalesce(sum(di.quantity), 0)
            from DeliveryItem di
            join di.delivery d
            where d.employee.id = :employeeId
              and di.itemType.id = :itemTypeId
              and d.deliveryType = com.inventario.dotacion.delivery.DeliveryType.IMPLEMENTOS
            """)
    long sumDeliveredQuantityForImplementos(
            @Param("employeeId") UUID employeeId,
            @Param("itemTypeId") UUID itemTypeId
    );

    @Query("""
            select coalesce(sum(di.quantity), 0)
            from DeliveryItem di
            join di.delivery d
            where d.employee.id = :employeeId
              and di.itemType.id = :itemTypeId
              and d.deliveryType = com.inventario.dotacion.delivery.DeliveryType.IMPLEMENTOS
              and d.createdAt >= :sinceTimestamp
            """)
    long sumDeliveredQuantityForImplementosSinceTimestamp(
            @Param("employeeId") UUID employeeId,
            @Param("itemTypeId") UUID itemTypeId,
            @Param("sinceTimestamp") OffsetDateTime sinceTimestamp
    );

    @Query("""
            select new com.inventario.dotacion.delivery.EmployeeItemDeliveredSummary(
                d.employee.id,
                di.itemType.id,
                sum(di.quantity)
            )
            from DeliveryItem di
            join di.delivery d
            where d.employee.id in :employeeIds
              and d.deliveryType = com.inventario.dotacion.delivery.DeliveryType.IMPLEMENTOS
            group by d.employee.id, di.itemType.id
            """)
    List<EmployeeItemDeliveredSummary> sumDeliveredQuantitiesByEmployeesForImplementos(
            @Param("employeeIds") Collection<UUID> employeeIds
    );
}
