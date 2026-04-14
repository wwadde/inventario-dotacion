package com.inventario.dotacion.item;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ItemTypeRepository extends JpaRepository<ItemType, UUID> {

    List<ItemType> findAllByOrderByNameAsc();

    List<ItemType> findByActiveTrueOrderByNameAsc();

    Optional<ItemType> findByIdAndActiveTrue(UUID id);

        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("""
                        select i
                        from ItemType i
                        where i.id = :id
                            and i.active = true
                        """)
        Optional<ItemType> findByIdAndActiveTrueForUpdate(@Param("id") UUID id);

    Optional<ItemType> findByCodeIgnoreCase(String code);
}
