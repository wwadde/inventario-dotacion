package com.inventario.dotacion.delivery;

import java.util.Collection;
import java.util.List;
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
}
