package com.f1dashboard.service;

import com.f1dashboard.dto.ConstructorDto;
import com.f1dashboard.dto.ConstructorDetailDto;
import com.f1dashboard.dto.DriverDto;
import com.f1dashboard.entity.Constructor;
import com.f1dashboard.exception.ResourceNotFoundException;
import com.f1dashboard.repository.ConstructorRepository;
import com.f1dashboard.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for constructor-related business logic.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ConstructorService {

    private final ConstructorRepository constructorRepository;
    private final DriverRepository driverRepository;

    /** Get all constructors ordered by championship position */
    public List<ConstructorDto> getAllConstructors() {
        return constructorRepository.findAllByOrderByChampionshipPositionAsc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    /** Get detailed constructor with driver lineup */
    public ConstructorDetailDto getConstructorById(Long id) {
        Constructor c = constructorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Constructor", "id", id));

        List<DriverDto> drivers = driverRepository
                .findByConstructorIdOrderByChampionshipPositionAsc(id)
                .stream()
                .map(d -> new DriverDto(
                    d.getId(), d.getCode(), d.getFirstName(), d.getLastName(),
                    d.getNumber(), d.getNationality(), d.getImageUrl(),
                    d.getPoints(), d.getWins(), d.getPodiums(),
                    d.getChampionshipPosition(),
                    c.getName(), c.getColor()
                ))
                .toList();

        return new ConstructorDetailDto(
            c.getId(), c.getName(), c.getNationality(),
            c.getLogoUrl(), c.getColor(), c.getPoints(),
            c.getWins(), c.getChampionshipPosition(), drivers
        );
    }

    /** Get the constructor championship leader */
    public ConstructorDto getChampionshipLeader() {
        Constructor leader = constructorRepository.findByChampionshipPosition(1);
        return leader != null ? toDto(leader) : null;
    }

    private ConstructorDto toDto(Constructor c) {
        return new ConstructorDto(
            c.getId(), c.getName(), c.getNationality(),
            c.getLogoUrl(), c.getColor(), c.getPoints(),
            c.getWins(), c.getChampionshipPosition()
        );
    }
}
