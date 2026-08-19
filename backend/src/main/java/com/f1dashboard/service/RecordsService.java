package com.f1dashboard.service;

import com.f1dashboard.dto.RecordsDto;
import com.f1dashboard.entity.Constructor;
import com.f1dashboard.entity.Driver;
import com.f1dashboard.entity.RaceResult;
import com.f1dashboard.enums.SessionType;
import com.f1dashboard.repository.ConstructorRepository;
import com.f1dashboard.repository.DriverRepository;
import com.f1dashboard.repository.RaceResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RecordsService {

    private final DriverRepository driverRepository;
    private final ConstructorRepository constructorRepository;
    private final RaceResultRepository raceResultRepository;

    public RecordsDto getHistoricalRecords() {
        return getHistoricalRecords(null);
    }

    public RecordsDto getHistoricalRecords(Integer season) {
        RecordsDto dto = new RecordsDto();
        
        List<Driver> drivers = driverRepository.findAll();
        List<Constructor> constructors = constructorRepository.findAll();
        List<RaceResult> results = (season != null
                ? raceResultRepository.findByRaceSeasonAndSessionTypeOrderByRaceRoundAsc(season, SessionType.RACE)
                : raceResultRepository.findAll().stream()
                        .filter(r -> r.getSessionType() == SessionType.RACE)
                        .toList());

        // 1. Most Wins (Driver)
        dto.setMostWinsDriver(drivers.stream()
                .map(d -> {
                    long wins = results.stream().filter(r -> r.getDriver() != null && r.getDriver().getId().equals(d.getId()) && r.getPosition() != null && r.getPosition() == 1).count();
                    return createDriverRecord(d, wins, wins + " Wins");
                })
                .sorted(Comparator.comparingDouble(RecordsDto.DriverRecord::getValue).reversed())
                .limit(10).toList());

        // 2. Most Podiums (Driver)
        dto.setMostPodiumsDriver(drivers.stream()
                .map(d -> {
                    long podiums = results.stream().filter(r -> r.getDriver() != null && r.getDriver().getId().equals(d.getId()) && r.getPosition() != null && r.getPosition() <= 3).count();
                    return createDriverRecord(d, podiums, podiums + " Podiums");
                })
                .sorted(Comparator.comparingDouble(RecordsDto.DriverRecord::getValue).reversed())
                .limit(10).toList());

        // 3. Most Points (Driver)
        dto.setMostPointsDriver(drivers.stream()
                .map(d -> {
                    double points = results.stream().filter(r -> r.getDriver() != null && r.getDriver().getId().equals(d.getId())).mapToDouble(r -> r.getPoints() != null ? r.getPoints() : 0).sum();
                    return createDriverRecord(d, points, String.format("%.0f Pts", points));
                })
                .sorted(Comparator.comparingDouble(RecordsDto.DriverRecord::getValue).reversed())
                .limit(10).toList());

        // 4. Highest Win Rate (Driver)
        dto.setHighestWinRateDriver(drivers.stream()
                .map(d -> {
                    long races = results.stream().filter(r -> r.getDriver() != null && r.getDriver().getId().equals(d.getId())).count();
                    long wins = results.stream().filter(r -> r.getDriver() != null && r.getDriver().getId().equals(d.getId()) && r.getPosition() != null && r.getPosition() == 1).count();
                    double rate = races > 0 ? ((double) wins / races) * 100 : 0;
                    return createDriverRecord(d, rate, String.format("%.1f%% (%d/%d)", rate, wins, races));
                })
                .filter(r -> r.getValue() > 0) // only drivers with at least 1 win
                .sorted(Comparator.comparingDouble(RecordsDto.DriverRecord::getValue).reversed())
                .limit(10).toList());

        // 5. Most Wins (Constructor)
        dto.setMostWinsConstructor(constructors.stream()
                .map(c -> {
                    long wins = results.stream().filter(r -> r.getDriver() != null && r.getDriver().getConstructor() != null && r.getDriver().getConstructor().getId().equals(c.getId()) && r.getPosition() != null && r.getPosition() == 1).count();
                    return createConstructorRecord(c, wins, wins + " Wins");
                })
                .sorted(Comparator.comparingDouble(RecordsDto.ConstructorRecord::getValue).reversed())
                .limit(10).toList());

        // 6. Most Podiums (Constructor)
        dto.setMostPodiumsConstructor(constructors.stream()
                .map(c -> {
                    long podiums = results.stream().filter(r -> r.getDriver() != null && r.getDriver().getConstructor() != null && r.getDriver().getConstructor().getId().equals(c.getId()) && r.getPosition() != null && r.getPosition() <= 3).count();
                    return createConstructorRecord(c, podiums, podiums + " Podiums");
                })
                .sorted(Comparator.comparingDouble(RecordsDto.ConstructorRecord::getValue).reversed())
                .limit(10).toList());

        // 7. Most Points (Constructor)
        dto.setMostPointsConstructor(constructors.stream()
                .map(c -> {
                    double points = results.stream().filter(r -> r.getDriver() != null && r.getDriver().getConstructor() != null && r.getDriver().getConstructor().getId().equals(c.getId())).mapToDouble(r -> r.getPoints() != null ? r.getPoints() : 0).sum();
                    return createConstructorRecord(c, points, String.format("%.0f Pts", points));
                })
                .sorted(Comparator.comparingDouble(RecordsDto.ConstructorRecord::getValue).reversed())
                .limit(10).toList());

        return dto;
    }

    private RecordsDto.DriverRecord createDriverRecord(Driver d, double value, String displayValue) {
        RecordsDto.DriverRecord dr = new RecordsDto.DriverRecord();
        dr.setDriverCode(d.getCode());
        dr.setDriverName(d.getFirstName() + " " + d.getLastName());
        dr.setConstructorName(d.getConstructor() != null ? d.getConstructor().getName() : "Unknown");
        dr.setConstructorColor(d.getConstructor() != null ? d.getConstructor().getColor() : "#E10600");
        dr.setValue(value);
        dr.setDisplayValue(displayValue);
        return dr;
    }

    private RecordsDto.ConstructorRecord createConstructorRecord(Constructor c, double value, String displayValue) {
        RecordsDto.ConstructorRecord cr = new RecordsDto.ConstructorRecord();
        cr.setConstructorName(c.getName());
        cr.setConstructorColor(c.getColor());
        cr.setValue(value);
        cr.setDisplayValue(displayValue);
        return cr;
    }
}
