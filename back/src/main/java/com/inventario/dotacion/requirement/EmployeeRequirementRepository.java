package com.inventario.dotacion.requirement;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeRequirementRepository extends JpaRepository<EmployeeRequirement, UUID> {

    @EntityGraph(attributePaths = {"employee", "itemType"})
    List<EmployeeRequirement> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"employee", "itemType"})
    List<EmployeeRequirement> findByEmployeeIdOrderByCreatedAtDesc(UUID employeeId);

    boolean existsByEmployeeIdAndItemTypeId(UUID employeeId, UUID itemTypeId);

    @EntityGraph(attributePaths = {"employee", "itemType"})
    List<EmployeeRequirement> findByEmployeeIdIn(Collection<UUID> employeeIds);
}
