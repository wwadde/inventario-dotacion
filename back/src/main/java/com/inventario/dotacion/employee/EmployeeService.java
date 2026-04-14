package com.inventario.dotacion.employee;

import java.util.List;
import java.util.UUID;

import com.inventario.dotacion.common.exception.BusinessException;
import com.inventario.dotacion.common.exception.ResourceNotFoundException;
import com.inventario.dotacion.common.security.DataPrivacyService;
import com.inventario.dotacion.employee.dto.EmployeeResponse;
import com.inventario.dotacion.employee.dto.EmployeeUpsertRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DataPrivacyService dataPrivacyService;

    @Transactional(readOnly = true)
    public List<EmployeeResponse> listEmployees(boolean activeOnly, boolean includeSensitiveData) {
        List<Employee> employees = activeOnly
                ? employeeRepository.findByActiveTrueOrderByLastNameAscFirstNameAsc()
                : employeeRepository.findAllByOrderByLastNameAscFirstNameAsc();

        return employees.stream().map(employee -> toResponse(employee, includeSensitiveData)).toList();
    }

    @Transactional(readOnly = true)
    public EmployeeResponse getEmployee(UUID employeeId, boolean includeSensitiveData) {
        return toResponse(findById(employeeId), includeSensitiveData);
    }

    @Transactional
    public EmployeeResponse createEmployee(EmployeeUpsertRequest request) {
        validateDocumentUniqueness(request.documentNumber(), null);

        Employee employee = new Employee();
        apply(employee, request);
        employee.setActive(request.active() == null || request.active());

        return toResponse(employeeRepository.save(employee), true);
    }

    @Transactional
    public EmployeeResponse updateEmployee(UUID employeeId, EmployeeUpsertRequest request) {
        Employee employee = findById(employeeId);
        validateDocumentUniqueness(request.documentNumber(), employeeId);

        apply(employee, request);
        employee.setActive(request.active() == null || request.active());

        return toResponse(employeeRepository.save(employee), true);
    }

    @Transactional
    public void deactivateEmployee(UUID employeeId) {
        Employee employee = findById(employeeId);
        employee.setActive(false);
        employeeRepository.save(employee);
    }

    public Employee findById(UUID employeeId) {
        return employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el empleado solicitado."));
    }

    private void validateDocumentUniqueness(String documentNumber, UUID employeeIdToSkip) {
        boolean duplicated = employeeRepository.findByDocumentNumberIgnoreCase(documentNumber)
                .map(existing -> employeeIdToSkip == null || !existing.getId().equals(employeeIdToSkip))
                .orElse(false);

        if (duplicated) {
            throw new BusinessException(HttpStatus.CONFLICT, "Ya existe un empleado con ese documento.");
        }
    }

    private void apply(Employee employee, EmployeeUpsertRequest request) {
        employee.setDocumentNumber(request.documentNumber().trim());
        employee.setFirstName(request.firstName().trim());
        employee.setLastName(request.lastName().trim());
        employee.setEmail(normalizeNullable(request.email()));
        employee.setPhone(normalizeNullable(request.phone()));
        employee.setArea(normalizeNullable(request.area()));
        employee.setPosition(normalizeNullable(request.position()));
        employee.setBirthDate(request.birthDate());
    }

    private String normalizeNullable(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

        private EmployeeResponse toResponse(Employee employee, boolean includeSensitiveData) {
        String documentNumber = includeSensitiveData
            ? employee.getDocumentNumber()
            : dataPrivacyService.maskDocument(employee.getDocumentNumber());

        String email = includeSensitiveData
            ? employee.getEmail()
            : dataPrivacyService.maskEmail(employee.getEmail());

        String phone = includeSensitiveData
            ? employee.getPhone()
            : dataPrivacyService.maskPhone(employee.getPhone());

        return new EmployeeResponse(
                employee.getId(),
            documentNumber,
                employee.getFirstName(),
                employee.getLastName(),
                employee.getFullName(),
            email,
            phone,
                employee.getArea(),
                employee.getPosition(),
                employee.getBirthDate(),
                employee.isActive(),
                employee.getCreatedAt(),
                employee.getUpdatedAt()
        );
    }
}
