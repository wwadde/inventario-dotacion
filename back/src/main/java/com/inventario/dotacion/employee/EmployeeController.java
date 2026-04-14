package com.inventario.dotacion.employee;

import java.util.List;
import java.util.UUID;

import com.inventario.dotacion.common.security.AccessControlService;
import com.inventario.dotacion.employee.dto.EmployeeResponse;
import com.inventario.dotacion.employee.dto.EmployeeUpsertRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;
    private final AccessControlService accessControlService;

    @GetMapping
    public List<EmployeeResponse> listEmployees(@RequestParam(defaultValue = "true") boolean activeOnly) {
        return employeeService.listEmployees(activeOnly, accessControlService.canViewSensitiveData());
    }

    @GetMapping("/{employeeId}")
    public EmployeeResponse getEmployee(@PathVariable UUID employeeId) {
        return employeeService.getEmployee(employeeId, accessControlService.canViewSensitiveData());
    }

    @PostMapping
    public ResponseEntity<EmployeeResponse> createEmployee(@Valid @RequestBody EmployeeUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(employeeService.createEmployee(request));
    }

    @PutMapping("/{employeeId}")
    public EmployeeResponse updateEmployee(@PathVariable UUID employeeId,
                                           @Valid @RequestBody EmployeeUpsertRequest request) {
        return employeeService.updateEmployee(employeeId, request);
    }

    @DeleteMapping("/{employeeId}")
    public ResponseEntity<Void> deactivateEmployee(@PathVariable UUID employeeId) {
        employeeService.deactivateEmployee(employeeId);
        return ResponseEntity.noContent().build();
    }
}
