package com.f1dashboard.controller;

import com.f1dashboard.dto.ApiResponse;
import com.f1dashboard.dto.CircuitDto;
import com.f1dashboard.service.CircuitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/circuits")
@RequiredArgsConstructor
@Tag(name = "Circuits", description = "Circuit database and details")
public class CircuitController {

    private final CircuitService circuitService;

    @GetMapping
    @Operation(summary = "Get all circuits", description = "Supports search via ?search= query param")
    public ResponseEntity<ApiResponse<List<CircuitDto>>> getAllCircuits(
            @RequestParam(required = false) String search) {
        List<CircuitDto> circuits = (search != null && !search.isBlank())
                ? circuitService.searchCircuits(search)
                : circuitService.getAllCircuits();
        return ResponseEntity.ok(ApiResponse.success(circuits));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get circuit details")
    public ResponseEntity<ApiResponse<CircuitDto>> getCircuitById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(circuitService.getCircuitById(id)));
    }
}
