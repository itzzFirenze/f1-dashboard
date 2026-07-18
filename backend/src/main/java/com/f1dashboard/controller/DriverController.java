package com.f1dashboard.controller;

import com.f1dashboard.dto.ApiResponse;
import com.f1dashboard.dto.DriverDetailDto;
import com.f1dashboard.dto.DriverDto;
import com.f1dashboard.service.DriverService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
@Tag(name = "Drivers", description = "Driver standings and details")
public class DriverController {

    private final DriverService driverService;

    @GetMapping
    @Operation(summary = "Get all drivers", description = "Returns driver standings. Supports search via ?search= query param.")
    public ResponseEntity<ApiResponse<List<DriverDto>>> getAllDrivers(
            @RequestParam(required = false) String search) {
        List<DriverDto> drivers = (search != null && !search.isBlank())
                ? driverService.searchDrivers(search)
                : driverService.getAllDrivers();
        return ResponseEntity.ok(ApiResponse.success(drivers));
    }

    @GetMapping("/paginated")
    @Operation(summary = "Get drivers with pagination")
    public ResponseEntity<ApiResponse<Page<DriverDto>>> getDriversPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(
            ApiResponse.success(driverService.getDriversPaginated(PageRequest.of(page, size)))
        );
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get driver details", description = "Returns detailed driver profile by ID")
    public ResponseEntity<ApiResponse<DriverDetailDto>> getDriverById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(driverService.getDriverById(id)));
    }
}
