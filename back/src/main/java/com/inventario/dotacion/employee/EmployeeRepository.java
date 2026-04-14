package com.inventario.dotacion.employee;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {

    List<Employee> findAllByOrderByLastNameAscFirstNameAsc();

    List<Employee> findByActiveTrueOrderByLastNameAscFirstNameAsc();

    boolean existsByDocumentNumberIgnoreCase(String documentNumber);

    Optional<Employee> findByDocumentNumberIgnoreCase(String documentNumber);

    long countByActiveTrue();

    @Query(value = """
            select *
            from employees e
            where e.active = true
              and e.email is not null
              and e.birth_date is not null
              and extract(month from e.birth_date) = :monthValue
              and extract(day from e.birth_date) = :dayValue
            order by e.last_name asc, e.first_name asc
            """, nativeQuery = true)
    List<Employee> findActiveEmployeesWithBirthday(
            @Param("monthValue") int monthValue,
            @Param("dayValue") int dayValue
    );

    @Query(value = """
            select count(*)
            from employees e
            where e.active = true
              and e.birth_date is not null
              and extract(month from e.birth_date) = :monthValue
              and extract(day from e.birth_date) = :dayValue
            """, nativeQuery = true)
    long countActiveEmployeesWithBirthday(
            @Param("monthValue") int monthValue,
            @Param("dayValue") int dayValue
    );
}
