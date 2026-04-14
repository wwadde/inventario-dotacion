package com.inventario.dotacion.item;

import java.util.List;
import java.util.UUID;

import com.inventario.dotacion.item.dto.ItemTypeResponse;
import com.inventario.dotacion.item.dto.ItemTypeUpsertRequest;
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
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemTypeController {

    private final ItemTypeService itemTypeService;

    @GetMapping
    public List<ItemTypeResponse> listItems(@RequestParam(defaultValue = "true") boolean activeOnly) {
        return itemTypeService.listItems(activeOnly);
    }

    @GetMapping("/{itemTypeId}")
    public ItemTypeResponse getItem(@PathVariable UUID itemTypeId) {
        return itemTypeService.getItem(itemTypeId);
    }

    @PostMapping
    public ResponseEntity<ItemTypeResponse> createItem(@Valid @RequestBody ItemTypeUpsertRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(itemTypeService.createItem(request));
    }

    @PutMapping("/{itemTypeId}")
    public ItemTypeResponse updateItem(@PathVariable UUID itemTypeId,
                                       @Valid @RequestBody ItemTypeUpsertRequest request) {
        return itemTypeService.updateItem(itemTypeId, request);
    }

    @DeleteMapping("/{itemTypeId}")
    public ResponseEntity<Void> deactivateItem(@PathVariable UUID itemTypeId) {
        itemTypeService.deactivateItem(itemTypeId);
        return ResponseEntity.noContent().build();
    }
}
