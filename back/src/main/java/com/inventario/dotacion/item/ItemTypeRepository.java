package com.inventario.dotacion.item;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ItemTypeRepository extends JpaRepository<ItemType, UUID> {

    List<ItemType> findAllByOrderByNameAsc();

    List<ItemType> findByActiveTrueOrderByNameAsc();

    Optional<ItemType> findByIdAndActiveTrue(UUID id);

    Optional<ItemType> findByCodeIgnoreCase(String code);
}
