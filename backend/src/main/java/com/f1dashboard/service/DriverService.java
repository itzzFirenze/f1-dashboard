package com.f1dashboard.service;

import com.f1dashboard.dto.DriverDto;
import com.f1dashboard.dto.DriverDetailDto;
import com.f1dashboard.entity.Driver;
import com.f1dashboard.exception.ResourceNotFoundException;
import com.f1dashboard.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for driver-related business logic.
 * Maps entities to DTOs and handles search/pagination.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DriverService {

    private final DriverRepository driverRepository;

    /** Get all drivers ordered by championship position */
    public List<DriverDto> getAllDrivers() {
        return driverRepository.findAllByOrderByChampionshipPositionAsc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    /** Get drivers with pagination, ordered by points */
    public Page<DriverDto> getDriversPaginated(Pageable pageable) {
        return driverRepository.findAllByOrderByPointsDesc(pageable)
                .map(this::toDto);
    }

    /** Search drivers by name or code */
    public List<DriverDto> searchDrivers(String query) {
        return driverRepository.searchDrivers(query)
                .stream()
                .map(this::toDto)
                .toList();
    }

    /** Get detailed driver info by ID */
    public DriverDetailDto getDriverById(Long id) {
        Driver driver = driverRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Driver", "id", id));
        return toDetailDto(driver);
    }

    /** Get the championship leader */
    public DriverDto getChampionshipLeader() {
        Driver leader = driverRepository.findByChampionshipPosition(1);
        return leader != null ? toDto(leader) : null;
    }

    // ---- Mapping methods ----

    private DriverDto toDto(Driver d) {
        return new DriverDto(
            d.getId(),
            d.getCode(),
            d.getFirstName(),
            d.getLastName(),
            d.getNumber(),
            d.getNationality(),
            d.getImageUrl(),
            d.getPoints(),
            d.getWins(),
            d.getPodiums(),
            d.getChampionshipPosition(),
            d.getConstructor() != null ? d.getConstructor().getName() : null,
            d.getConstructor() != null ? d.getConstructor().getColor() : null
        );
    }

    private DriverDetailDto toDetailDto(Driver d) {
        return new DriverDetailDto(
            d.getId(),
            d.getCode(),
            d.getFirstName(),
            d.getLastName(),
            d.getNumber(),
            d.getDateOfBirth(),
            d.getNationality(),
            d.getImageUrl(),
            d.getPoints(),
            d.getWins(),
            d.getPodiums(),
            d.getChampionshipPosition(),
            d.getConstructor() != null ? d.getConstructor().getName() : null,
            d.getConstructor() != null ? d.getConstructor().getColor() : null,
            d.getConstructor() != null ? d.getConstructor().getId() : null
        );
    }
}
