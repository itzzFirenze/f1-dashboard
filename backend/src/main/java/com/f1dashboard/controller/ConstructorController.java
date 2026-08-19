package com.f1dashboard.controller;

import com.f1dashboard.dto.ApiResponse;
import com.f1dashboard.dto.ConstructorDetailDto;
import com.f1dashboard.dto.ConstructorDto;
import com.f1dashboard.service.ConstructorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/constructors")
@RequiredArgsConstructor
@Tag(name = "Constructors", description = "Constructor standings and team details")
public class ConstructorController {

   private final ConstructorService constructorService;

   @GetMapping
   @Operation(summary = "Get constructor standings", description = "Returns constructor standings, optionally filtered by season")
   public ResponseEntity<ApiResponse<List<ConstructorDto>>> getAllConstructors(
         @RequestParam(required = false) Integer season) {
      return ResponseEntity.ok(ApiResponse.success(constructorService.getAllConstructors(season)));
   }

   @GetMapping("/{id}")
   @Operation(summary = "Get constructor details with driver lineup")
   public ResponseEntity<ApiResponse<ConstructorDetailDto>> getConstructorById(@PathVariable Long id) {
      return ResponseEntity.ok(ApiResponse.success(constructorService.getConstructorById(id)));
   }
}