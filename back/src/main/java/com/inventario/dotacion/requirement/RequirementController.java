package com.inventario.dotacion.requirement;

import java.util.List;
import java.util.UUID;

import com.inventario.dotacion.common.security.AccessControlService;
import com.inventario.dotacion.requirement.dto.RequirementResponse;
import com.inventario.dotacion.requirement.dto.RequirementUpsertRequest;
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
@RequestMapping("/api/requirements")
@RequiredArgsConstructor
public class RequirementController {

    private final RequirementService requirementService;
    private final AccessControlService accessControlService;

    @GetMapping
    public List<RequirementResponse> listRequirements(@RequestParam(required = false) UUID employeeId) {
        return requirementService.listRequirements(employeeId, accessControlService.canViewSensitiveData());
    }

    @PostMapping
    public ResponseEntity<RequirementResponse> createRequirement(@Valid @RequestBody RequirementUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(requirementService.createRequirement(request));
    }

    @PutMapping("/{requirementId}")
    public RequirementResponse updateRequirement(@PathVariable UUID requirementId,
                                                 @Valid @RequestBody RequirementUpsertRequest request) {
        return requirementService.updateRequirement(requirementId, request);
    }

    @DeleteMapping("/{requirementId}")
    public ResponseEntity<Void> deleteRequirement(@PathVariable UUID requirementId) {
        requirementService.deleteRequirement(requirementId);
        return ResponseEntity.noContent().build();
    }
}
