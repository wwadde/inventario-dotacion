package com.inventario.dotacion.requirement;

import java.util.List;
import java.util.UUID;

import com.inventario.dotacion.common.exception.BusinessException;
import com.inventario.dotacion.common.exception.ResourceNotFoundException;
import com.inventario.dotacion.common.security.DataPrivacyService;
import com.inventario.dotacion.employee.Employee;
import com.inventario.dotacion.employee.EmployeeService;
import com.inventario.dotacion.item.ItemType;
import com.inventario.dotacion.item.ItemTypeService;
import com.inventario.dotacion.requirement.dto.RequirementResponse;
import com.inventario.dotacion.requirement.dto.RequirementUpsertRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class RequirementService {

    private final EmployeeRequirementRepository requirementRepository;
    private final EmployeeService employeeService;
    private final ItemTypeService itemTypeService;
    private final DataPrivacyService dataPrivacyService;

    @Transactional(readOnly = true)
    public List<RequirementResponse> listRequirements(UUID employeeId, boolean includeSensitiveData) {
        List<EmployeeRequirement> requirements = employeeId == null
                ? requirementRepository.findAllByOrderByCreatedAtDesc()
                : requirementRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId);

        return requirements.stream().map(requirement -> toResponse(requirement, includeSensitiveData)).toList();
    }

    @Transactional
    public RequirementResponse createRequirement(RequirementUpsertRequest request) {
        if (requirementRepository.existsByEmployeeIdAndItemTypeId(request.employeeId(), request.itemTypeId())) {
            throw new BusinessException(HttpStatus.CONFLICT,
                    "Ya existe un requerimiento para este empleado e implemento.");
        }

        Employee employee = employeeService.findById(request.employeeId());
        ItemType itemType = itemTypeService.findById(request.itemTypeId());

        EmployeeRequirement requirement = new EmployeeRequirement();
        requirement.setEmployee(employee);
        requirement.setItemType(itemType);
        apply(requirement, request);

        return toResponse(requirementRepository.save(requirement), true);
    }

    @Transactional
    public RequirementResponse updateRequirement(UUID requirementId, RequirementUpsertRequest request) {
        EmployeeRequirement requirement = findById(requirementId);

        UUID previousEmployeeId = requirement.getEmployee().getId();
        UUID previousItemTypeId = requirement.getItemType().getId();

        boolean changedEmployeeOrItem = !previousEmployeeId.equals(request.employeeId())
                || !previousItemTypeId.equals(request.itemTypeId());

        if (changedEmployeeOrItem
                && requirementRepository.existsByEmployeeIdAndItemTypeId(request.employeeId(), request.itemTypeId())) {
            throw new BusinessException(HttpStatus.CONFLICT,
                    "Ya existe un requerimiento para este empleado e implemento.");
        }

        requirement.setEmployee(employeeService.findById(request.employeeId()));
        requirement.setItemType(itemTypeService.findById(request.itemTypeId()));
        apply(requirement, request);

        return toResponse(requirementRepository.save(requirement), true);
    }

    @Transactional
    public void deleteRequirement(UUID requirementId) {
        EmployeeRequirement requirement = findById(requirementId);
        requirementRepository.delete(requirement);
    }

    private EmployeeRequirement findById(UUID requirementId) {
        return requirementRepository.findById(requirementId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el requerimiento solicitado."));
    }

    private void apply(EmployeeRequirement requirement, RequirementUpsertRequest request) {
        requirement.setPeriodicityMonths(request.periodicityMonths());
        requirement.setEffectiveFrom(request.effectiveFrom());
        requirement.setNotes(normalizeNullable(request.notes()));
    }

    private String normalizeNullable(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private RequirementResponse toResponse(EmployeeRequirement requirement, boolean includeSensitiveData) {
        String employeeDocument = includeSensitiveData
                ? requirement.getEmployee().getDocumentNumber()
                : dataPrivacyService.maskDocument(requirement.getEmployee().getDocumentNumber());

        return new RequirementResponse(
                requirement.getId(),
                requirement.getEmployee().getId(),
                requirement.getEmployee().getFullName(),
                employeeDocument,
                requirement.getItemType().getId(),
                requirement.getItemType().getCode(),
                requirement.getItemType().getName(),
                requirement.getPeriodicityMonths(),
                requirement.getEffectiveFrom(),
                requirement.getNotes(),
                requirement.getCreatedAt(),
                requirement.getUpdatedAt()
        );
    }
}
