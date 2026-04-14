package com.inventario.dotacion.employee;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

    List<Employee> findAllByOrderByLastNameAscFirstNameAsc();

    List<Employee> findByActiveTrueOrderByLastNameAscFirstNameAsc();

    boolean existsByDocumentNumberIgnoreCase(String documentNumber);

    Optional<Employee> findByDocumentNumberIgnoreCase(String documentNumber);

    long countByActiveTrue();
}
