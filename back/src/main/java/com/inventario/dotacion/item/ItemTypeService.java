package com.inventario.dotacion.item;

import java.util.List;
import java.util.UUID;

import com.inventario.dotacion.common.exception.BusinessException;
import com.inventario.dotacion.common.exception.ResourceNotFoundException;
import com.inventario.dotacion.item.dto.ItemTypeResponse;
import com.inventario.dotacion.item.dto.ItemTypeUpsertRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class ItemTypeService {

    private final ItemTypeRepository itemTypeRepository;

    @Transactional(readOnly = true)
    public List<ItemTypeResponse> listItems(boolean activeOnly) {
        List<ItemType> items = activeOnly
                ? itemTypeRepository.findByActiveTrueOrderByNameAsc()
                : itemTypeRepository.findAllByOrderByNameAsc();

        return items.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ItemTypeResponse getItem(UUID itemTypeId) {
        return toResponse(findById(itemTypeId));
    }

    @Transactional
    public ItemTypeResponse createItem(ItemTypeUpsertRequest request) {
        validateCodeUniqueness(request.code(), null);

        ItemType itemType = new ItemType();
        apply(itemType, request);
        itemType.setActive(request.active() == null || request.active());

        return toResponse(itemTypeRepository.save(itemType));
    }

    @Transactional
    public ItemTypeResponse updateItem(UUID itemTypeId, ItemTypeUpsertRequest request) {
        ItemType itemType = findById(itemTypeId);
        validateCodeUniqueness(request.code(), itemTypeId);

        apply(itemType, request);
        itemType.setActive(request.active() == null || request.active());

        return toResponse(itemTypeRepository.save(itemType));
    }

    @Transactional
    public void deactivateItem(UUID itemTypeId) {
        ItemType itemType = findById(itemTypeId);
        itemType.setActive(false);
        itemTypeRepository.save(itemType);
    }

    public ItemType findById(UUID itemTypeId) {
        return itemTypeRepository.findById(itemTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("No existe el implemento solicitado."));
    }

    public ItemType findActiveById(UUID itemTypeId) {
        return itemTypeRepository.findByIdAndActiveTrue(itemTypeId)
                .orElseThrow(() -> new BusinessException(HttpStatus.BAD_REQUEST,
                        "El implemento seleccionado no existe o esta inactivo."));
    }

    private void validateCodeUniqueness(String code, UUID itemTypeIdToSkip) {
        boolean duplicated = itemTypeRepository.findByCodeIgnoreCase(code)
                .map(existing -> itemTypeIdToSkip == null || !existing.getId().equals(itemTypeIdToSkip))
                .orElse(false);

        if (duplicated) {
            throw new BusinessException(HttpStatus.CONFLICT, "Ya existe un implemento con ese codigo.");
        }
    }

    private void apply(ItemType itemType, ItemTypeUpsertRequest request) {
        itemType.setCode(request.code().trim().toUpperCase());
        itemType.setName(request.name().trim());
        itemType.setCategory(request.category());
        itemType.setDescription(normalizeNullable(request.description()));
        itemType.setDefaultPeriodicityMonths(request.defaultPeriodicityMonths());
    }

    private String normalizeNullable(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        return value.trim();
    }

    private ItemTypeResponse toResponse(ItemType itemType) {
        return new ItemTypeResponse(
                itemType.getId(),
                itemType.getCode(),
                itemType.getName(),
                itemType.getCategory(),
                itemType.getDescription(),
                itemType.getDefaultPeriodicityMonths(),
                itemType.isActive(),
                itemType.getCreatedAt(),
                itemType.getUpdatedAt()
        );
    }
}
