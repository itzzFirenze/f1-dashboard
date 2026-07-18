package com.f1dashboard.service;

import com.f1dashboard.dto.CircuitDto;
import com.f1dashboard.entity.Circuit;
import com.f1dashboard.exception.ResourceNotFoundException;
import com.f1dashboard.repository.CircuitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for circuit-related business logic.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CircuitService {

    private final CircuitRepository circuitRepository;

    /** Get all circuits */
    public List<CircuitDto> getAllCircuits() {
        return circuitRepository.findAll()
                .stream()
                .map(this::toDto)
                .toList();
    }

    /** Search circuits by name, country, or location */
    public List<CircuitDto> searchCircuits(String query) {
        return circuitRepository.searchCircuits(query)
                .stream()
                .map(this::toDto)
                .toList();
    }

    /** Get circuit by ID */
    public CircuitDto getCircuitById(Long id) {
        Circuit c = circuitRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Circuit", "id", id));
        return toDto(c);
    }

    private CircuitDto toDto(Circuit c) {
        return new CircuitDto(
            c.getId(), c.getName(), c.getCountry(), c.getLocation(),
            c.getLengthKm(), c.getCorners(), c.getLapRecord(),
            c.getLapRecordHolder(), c.getImageUrl(),
            c.getLatitude(), c.getLongitude()
        );
    }
}
