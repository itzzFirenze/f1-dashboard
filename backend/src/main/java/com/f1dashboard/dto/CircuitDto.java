package com.f1dashboard.dto;

/**
 * Circuit information DTO.
 */
public record CircuitDto(
    Long id,
    String name,
    String country,
    String location,
    Double lengthKm,
    Integer corners,
    String lapRecord,
    String lapRecordHolder,
    String imageUrl,
    Double latitude,
    Double longitude
) {}
