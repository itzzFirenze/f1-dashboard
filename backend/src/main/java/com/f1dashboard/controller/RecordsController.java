package com.f1dashboard.controller;

import com.f1dashboard.dto.ApiResponse;
import com.f1dashboard.dto.RecordsDto;
import com.f1dashboard.service.RecordsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/records")
@RequiredArgsConstructor
public class RecordsController {

   private final RecordsService recordsService;

   @GetMapping
   public ResponseEntity<ApiResponse<RecordsDto>> getRecords(
         @RequestParam(required = false) Integer season) {
      return ResponseEntity.ok(ApiResponse.success(recordsService.getHistoricalRecords(season)));
   }
}