package com.inventario.dotacion.requirement;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeRequirementRepository extends JpaRepository<EmployeeRequirement, UUID> {

    @EntityGraph(attributePaths = {"employee", "itemType"})
    List<EmployeeRequirement> findAllByClosedFalseOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"employee", "itemType"})
    List<EmployeeRequirement> findAllByClosedTrueOrderByUpdatedAtDesc();

    @EntityGraph(attributePaths = {"employee", "itemType"})
    List<EmployeeRequirement> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = {"employee", "itemType"})
    List<EmployeeRequirement> findByEmployeeIdAndClosedFalseOrderByCreatedAtDesc(UUID employeeId);

    @EntityGraph(attributePaths = {"employee", "itemType"})
    List<EmployeeRequirement> findByEmployeeIdAndClosedTrueOrderByUpdatedAtDesc(UUID employeeId);

    @EntityGraph(attributePaths = {"employee", "itemType"})
    List<EmployeeRequirement> findByEmployeeIdOrderByCreatedAtDesc(UUID employeeId);

    @EntityGraph(attributePaths = {"employee", "itemType"})
    List<EmployeeRequirement> findByEmployeeIdInAndClosedFalse(Collection<UUID> employeeIds);

    @EntityGraph(attributePaths = {"employee", "itemType"})
    Optional<EmployeeRequirement> findByEmployeeIdAndItemTypeIdAndClosedFalse(UUID employeeId, UUID itemTypeId);

    Optional<EmployeeRequirement> findByIdAndClosedFalse(UUID requirementId);

    boolean existsByEmployeeIdAndItemTypeIdAndClosedFalse(UUID employeeId, UUID itemTypeId);
}
