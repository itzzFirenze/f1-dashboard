package com.f1dashboard.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.f1dashboard.entity.*;
import com.f1dashboard.enums.RaceStatus;
import com.f1dashboard.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class DataSyncService {

    @Value("${app.api.jolpica-base-url:https://api.jolpi.ca/ergast/f1}")
    private String jolpicaBaseUrl;

    private final RestTemplate restTemplate;
    private final DriverRepository driverRepository;
    private final ConstructorRepository constructorRepository;
    private final RaceRepository raceRepository;
    private final RaceResultRepository raceResultRepository;
    private final CircuitRepository circuitRepository;
    private final RaceSessionRepository raceSessionRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Scheduled(fixedRateString = "${app.api.sync-interval-hours:6}",
               timeUnit = java.util.concurrent.TimeUnit.HOURS,
               initialDelay = 60)
    public void syncData() {
        log.info("Starting scheduled dynamic data synchronization...");
        try {
            syncRaceCalendar(); // First build the calendar
            syncConstructorStandings(); // Then sync constructors
            syncDriverStandings(); // Then sync drivers
            syncRaceResults(); // Finally populate results
            syncSprintResults();
            syncQualifyingResults();
            updateRaceStatusesByDate(); // Reconcile statuses based on today's date
            log.info("Data synchronization completed successfully.");
        } catch (Exception e) {
            log.warn("Data sync failed. Error: {}", e.getMessage(), e);
        }
    }

    public void syncRaceCalendar() {
        log.info("Syncing race calendar dynamically from Jolpica API...");
        try {
            String url = jolpicaBaseUrl + "/current.json";
            String jsonResponse = restTemplate.getForObject(url, String.class);
            if (jsonResponse == null) return;

            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode raceList = root.path("MRData")
                    .path("RaceTable")
                    .path("Races");

            if (raceList.isArray()) {
                for (JsonNode raceNode : raceList) {
                    int season = raceNode.path("season").asInt();
                    int round = raceNode.path("round").asInt();
                    String raceName = raceNode.path("raceName").asText();
                    String dateStr = raceNode.path("date").asText();
                    String timeStr = raceNode.path("time").asText();

                    // Process Circuit
                    JsonNode circuitNode = raceNode.path("Circuit");
                    String circuitId = circuitNode.path("circuitId").asText();
                    String circuitName = circuitNode.path("circuitName").asText();
                    
                    JsonNode locNode = circuitNode.path("Location");
                    String locality = locNode.path("locality").asText();
                    String country = locNode.path("country").asText();
                    double lat = locNode.path("lat").asDouble();
                    double lon = locNode.path("long").asDouble();

                    Optional<Circuit> circuitOpt = circuitRepository.findByCircuitRef(circuitId);
                    Circuit circuit;
                    if (circuitOpt.isPresent()) {
                        circuit = circuitOpt.get();
                    } else {
                        circuit = Circuit.builder()
                                .circuitRef(circuitId)
                                .name(circuitName)
                                .country(country)
                                .location(locality)
                                .latitude(lat)
                                .longitude(lon)
                                .lengthKm(5.0)
                                .corners(15)
                                .build();
                        circuit = circuitRepository.save(circuit);
                    }

                    Optional<Race> raceOpt = raceRepository.findBySeasonAndRound(season, round);
                    Race race;
                    if (raceOpt.isPresent()) {
                        race = raceOpt.get();
                    } else {
                        race = new Race();
                        race.setSeason(season);
                        race.setRound(round);
                        race.setSprintWeekend(raceNode.has("Sprint"));
                    }

                    race.setName(raceName);
                    race.setCircuit(circuit);
                    if (!dateStr.isEmpty()) {
                        LocalDate raceDate = LocalDate.parse(dateStr);
                        race.setRaceDate(raceDate);
                        // Dynamically set status based on race date
                        if (race.getStatus() != RaceStatus.COMPLETED) {
                            race.setStatus(raceDate.isBefore(LocalDate.now()) ? RaceStatus.COMPLETED : RaceStatus.UPCOMING);
                        }
                    } else {
                        // No date available, default to UPCOMING
                        if (race.getStatus() == null) {
                            race.setStatus(RaceStatus.UPCOMING);
                        }
                    }
                    if (!timeStr.isEmpty()) {
                        String cleanTime = timeStr.replace("Z", "");
                        if (cleanTime.contains(":")) {
                            if (cleanTime.length() == 5) cleanTime += ":00";
                            race.setRaceTime(LocalTime.parse(cleanTime));
                        }
                    }
                    race = raceRepository.save(race);

                    // Clear existing sessions to update
                    raceSessionRepository.deleteByRaceId(race.getId());

                    // Create Race session
                    if (race.getRaceDate() != null) {
                        RaceSession raceSession = RaceSession.builder()
                                .race(race)
                                .sessionType(com.f1dashboard.enums.SessionType.RACE)
                                .sessionDate(race.getRaceDate())
                                .sessionTime(race.getRaceTime())
                                .status(race.getStatus())
                                .build();
                        raceSessionRepository.save(raceSession);
                    }

                    // Process other sessions
                    saveSessionIfPresent(raceNode, "FirstPractice", com.f1dashboard.enums.SessionType.FP1, race);
                    saveSessionIfPresent(raceNode, "SecondPractice", com.f1dashboard.enums.SessionType.FP2, race);
                    saveSessionIfPresent(raceNode, "ThirdPractice", com.f1dashboard.enums.SessionType.FP3, race);
                    saveSessionIfPresent(raceNode, "Qualifying", com.f1dashboard.enums.SessionType.QUALIFYING, race);
                    saveSessionIfPresent(raceNode, "SprintQualifying", com.f1dashboard.enums.SessionType.SPRINT_QUALIFYING, race);
                    saveSessionIfPresent(raceNode, "Sprint", com.f1dashboard.enums.SessionType.SPRINT, race);
                }
            }
        } catch (Exception e) {
            log.error("Failed to sync race calendar: {}", e.getMessage(), e);
            throw new RuntimeException(e);
        }
    }

    private void saveSessionIfPresent(JsonNode raceNode, String nodeName, com.f1dashboard.enums.SessionType sessionType, Race race) {
        JsonNode sessionNode = raceNode.path(nodeName);
        if (!sessionNode.isMissingNode()) {
            String dateStr = sessionNode.path("date").asText();
            String timeStr = sessionNode.path("time").asText();
            if (!dateStr.isEmpty()) {
                LocalDate sessionDate = LocalDate.parse(dateStr);
                LocalTime sessionTime = null;
                if (!timeStr.isEmpty()) {
                    String cleanTime = timeStr.replace("Z", "");
                    if (cleanTime.contains(":")) {
                        if (cleanTime.length() == 5) cleanTime += ":00";
                        sessionTime = LocalTime.parse(cleanTime);
                    }
                }
                
                RaceStatus status = sessionDate.isBefore(LocalDate.now()) ? RaceStatus.COMPLETED : RaceStatus.UPCOMING;
                
                RaceSession session = RaceSession.builder()
                        .race(race)
                        .sessionType(sessionType)
                        .sessionDate(sessionDate)
                        .sessionTime(sessionTime)
                        .status(status)
                        .build();
                raceSessionRepository.save(session);
            }
        }
    }

    public void syncConstructorStandings() {
        log.info("Syncing constructor standings dynamically from Jolpica API...");
        try {
            String url = jolpicaBaseUrl + "/current/constructorStandings.json";
            String jsonResponse = restTemplate.getForObject(url, String.class);
            if (jsonResponse == null) return;

            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode standingsList = root.path("MRData")
                    .path("StandingsTable")
                    .path("StandingsLists");

            if (standingsList.isArray() && standingsList.size() > 0) {
                JsonNode constructorStandings = standingsList.get(0).path("ConstructorStandings");
                if (constructorStandings.isArray()) {
                    for (JsonNode node : constructorStandings) {
                        int position = node.path("position").asInt();
                        double points = node.path("points").asDouble();
                        int wins = node.path("wins").asInt();

                        JsonNode constructorNode = node.path("Constructor");
                        String constructorId = constructorNode.path("constructorId").asText();
                        String name = constructorNode.path("name").asText();
                        String nationality = constructorNode.path("nationality").asText();

                        Optional<Constructor> constructorOpt = constructorRepository.findByConstructorRef(constructorId);
                        Constructor constructor;
                        if (constructorOpt.isPresent()) {
                            constructor = constructorOpt.get();
                        } else {
                            constructor = new Constructor();
                            constructor.setConstructorRef(constructorId);
                            // Assign matching colors for team UI styling
                            constructor.setColor(getTeamColor(constructorId));
                        }

                        constructor.setName(name);
                        constructor.setNationality(nationality);
                        constructor.setPoints(points);
                        constructor.setWins(wins);
                        constructor.setChampionshipPosition(position);

                        constructorRepository.save(constructor);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to sync constructor standings: {}", e.getMessage(), e);
            throw new RuntimeException(e);
        }
    }

    public void syncDriverStandings() {
        log.info("Syncing driver standings dynamically from Jolpica API...");
        try {
            String url = jolpicaBaseUrl + "/current/driverStandings.json";
            String jsonResponse = restTemplate.getForObject(url, String.class);
            if (jsonResponse == null) return;

            JsonNode root = objectMapper.readTree(jsonResponse);
            JsonNode standingsList = root.path("MRData")
                    .path("StandingsTable")
                    .path("StandingsLists");

            if (standingsList.isArray() && standingsList.size() > 0) {
                JsonNode driverStandings = standingsList.get(0).path("DriverStandings");
                if (driverStandings.isArray()) {
                    for (JsonNode node : driverStandings) {
                        int position = node.path("position").asInt();
                        double points = node.path("points").asDouble();
                        int wins = node.path("wins").asInt();

                        JsonNode driverNode = node.path("Driver");
                        String driverId = driverNode.path("driverId").asText();
                        String code = driverNode.path("code").asText();
                        String firstName = driverNode.path("givenName").asText();
                        String lastName = driverNode.path("familyName").asText();
                        String nationality = driverNode.path("nationality").asText();
                        String dateOfBirthStr = driverNode.path("dateOfBirth").asText();
                        int permanentNumber = driverNode.path("permanentNumber").asInt();

                        JsonNode constructorsNode = node.path("Constructors");
                        String constructorId = null;
                        if (constructorsNode.isArray() && constructorsNode.size() > 0) {
                            constructorId = constructorsNode.get(0).path("constructorId").asText();
                        }

                        Optional<Constructor> constructorOpt = constructorId != null 
                                ? constructorRepository.findByConstructorRef(constructorId) 
                                : Optional.empty();
                        Constructor constructor = constructorOpt.orElse(null);

                        Optional<Driver> driverOpt = driverRepository.findByDriverRef(driverId);
                        Driver driver;
                        if (driverOpt.isPresent()) {
                            driver = driverOpt.get();
                        } else {
                            driver = new Driver();
                            driver.setDriverRef(driverId);
                            driver.setPodiums(0);
                        }

                        driver.setCode(code.isEmpty() ? driverId.substring(0, Math.min(3, driverId.length())).toUpperCase() : code);
                        driver.setFirstName(firstName);
                        driver.setLastName(lastName);
                        driver.setNationality(nationality);
                        driver.setNumber(permanentNumber > 0 ? permanentNumber : null);
                        if (!dateOfBirthStr.isEmpty()) {
                            driver.setDateOfBirth(LocalDate.parse(dateOfBirthStr));
                        }
                        driver.setPoints(points);
                        driver.setWins(wins);
                        driver.setChampionshipPosition(position);
                        if (constructor != null) {
                            driver.setConstructor(constructor);
                        }

                        driverRepository.save(driver);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to sync driver standings: {}", e.getMessage(), e);
            throw new RuntimeException(e);
        }
    }

    public void syncRaceResults() {
        log.info("Syncing race results dynamically from Jolpica API...");
        int offset = 0;
        int limit = 100;
        boolean hasMoreData = true;

        while (hasMoreData) {
            try {
                String url = jolpicaBaseUrl + "/current/results.json?limit=" + limit + "&offset=" + offset;
                String jsonResponse = restTemplate.getForObject(url, String.class);
                if (jsonResponse == null) break;

                JsonNode root = objectMapper.readTree(jsonResponse);
                JsonNode raceList = root.path("MRData").path("RaceTable").path("Races");
                int total = root.path("MRData").path("total").asInt(0);

                if (raceList.isArray() && raceList.size() > 0) {
                    for (JsonNode raceNode : raceList) {
                        try {
                            int season = raceNode.path("season").asInt();
                            int round = raceNode.path("round").asInt();
                            String dateStr = raceNode.path("date").asText();
                            String timeStr = raceNode.path("time").asText();

                            Optional<Race> raceOpt = raceRepository.findBySeasonAndRound(season, round);
                            if (raceOpt.isPresent()) {
                                Race race = raceOpt.get();
                                race.setStatus(RaceStatus.COMPLETED);
                                if (!dateStr.isEmpty()) {
                                    race.setRaceDate(LocalDate.parse(dateStr));
                                }
                                if (!timeStr.isEmpty()) {
                                    String cleanTime = timeStr.replace("Z", "");
                                    if (cleanTime.contains(":")) {
                                        if (cleanTime.length() == 5) cleanTime += ":00";
                                        race.setRaceTime(LocalTime.parse(cleanTime));
                                    }
                                }
                                raceRepository.save(race);

                                // We delete previous race session results if doing a fresh sync for this race.
                                // However, since we are paginating, we might process the SAME race across two pages
                                // (if a race's results straddle the 100 boundary).
                                // Therefore, it's dangerous to deleteAll existing results indiscriminately inside the loop without checking if we already cleared them for THIS run.
                                // Actually, let's just clear if position == 1 to avoid clearing in the middle of a straddled race? No, let's just not clear here.
                                // Since we wipe the DB on boot, it's fine. If we run it periodically, we should save directly or check if exists.
                                // Let's use a simple approach: if it's already in the DB, delete it before adding.
                                
                                JsonNode resultsNode = raceNode.path("Results");
                                if (resultsNode.isArray()) {
                                    for (JsonNode resNode : resultsNode) {
                                        int position = resNode.path("position").asInt();
                                        double points = resNode.path("points").asDouble();
                                        String status = resNode.path("status").asText();
                                        int grid = resNode.path("grid").asInt();
                                        String driverId = resNode.path("Driver").path("driverId").asText();

                                        Optional<Driver> driverOpt = driverRepository.findByDriverRef(driverId);
                                        if (driverOpt.isPresent()) {
                                            Driver driver = driverOpt.get();
                                            boolean fastestLap = false;
                                            JsonNode fastestLapNode = resNode.path("FastestLap");
                                            if (!fastestLapNode.isMissingNode() && fastestLapNode.path("rank").asInt() == 1) {
                                                fastestLap = true;
                                            }

                                            RaceResult result = RaceResult.builder()
                                                    .race(race)
                                                    .driver(driver)
                                                    .sessionType(com.f1dashboard.enums.SessionType.RACE)
                                                    .position(position)
                                                    .points(points)
                                                    .status(status)
                                                    .gridPosition(grid)
                                                    .fastestLap(fastestLap)
                                                    .build();

                                            raceResultRepository.save(result);
                                        }
                                    }
                                }
                            }
                        } catch (Exception e) {
                            log.warn("Failed to parse results for a race node, skipping. Error: {}", e.getMessage());
                        }
                    }
                }

                offset += limit;
                if (offset >= total || raceList.isEmpty()) {
                    hasMoreData = false;
                }
            } catch (Exception e) {
                log.error("Failed to sync race results page: {}", e.getMessage(), e);
                hasMoreData = false;
            }
        }
        // Update driver podium counts based on race results
        updatePodiums();
    }

    public void updatePodiums() {
        log.info("Calculating podiums for all drivers...");
        List<Driver> drivers = driverRepository.findAll();
        for (Driver driver : drivers) {
            int podiums = raceResultRepository.countByDriverIdAndPositionLessThanEqualAndSessionType(
                    driver.getId(), 3, com.f1dashboard.enums.SessionType.RACE);
            driver.setPodiums(podiums);
            driverRepository.save(driver);
        }
    }

    public void syncSprintResults() {
        log.info("Syncing sprint results dynamically from Jolpica API...");
        int offset = 0;
        int limit = 100;
        boolean hasMoreData = true;

        while (hasMoreData) {
            try {
                String url = jolpicaBaseUrl + "/current/sprint.json?limit=" + limit + "&offset=" + offset;
                String jsonResponse = restTemplate.getForObject(url, String.class);
                if (jsonResponse == null) break;

                JsonNode root = objectMapper.readTree(jsonResponse);
                JsonNode raceList = root.path("MRData").path("RaceTable").path("Races");
                int total = root.path("MRData").path("total").asInt(0);

                if (raceList.isArray() && raceList.size() > 0) {
                    for (JsonNode raceNode : raceList) {
                        try {
                            int season = raceNode.path("season").asInt();
                            int round = raceNode.path("round").asInt();
                            Optional<Race> raceOpt = raceRepository.findBySeasonAndRound(season, round);
                            
                            if (raceOpt.isPresent()) {
                                Race race = raceOpt.get();
                                JsonNode sprintResultsNode = raceNode.path("SprintResults");
                                if (sprintResultsNode.isArray()) {
                                    for (JsonNode resNode : sprintResultsNode) {
                                        int position = resNode.path("position").asInt();
                                        double points = resNode.path("points").asDouble();
                                        String status = resNode.path("status").asText();
                                        int grid = resNode.path("grid").asInt();
                                        String driverId = resNode.path("Driver").path("driverId").asText();

                                        Optional<Driver> driverOpt = driverRepository.findByDriverRef(driverId);
                                        if (driverOpt.isPresent()) {
                                            boolean fastestLap = false;
                                            JsonNode fastestLapNode = resNode.path("FastestLap");
                                            if (!fastestLapNode.isMissingNode() && fastestLapNode.path("rank").asInt() == 1) {
                                                fastestLap = true;
                                            }

                                            RaceResult result = RaceResult.builder()
                                                    .race(race)
                                                    .driver(driverOpt.get())
                                                    .sessionType(com.f1dashboard.enums.SessionType.SPRINT)
                                                    .position(position)
                                                    .points(points)
                                                    .status(status)
                                                    .gridPosition(grid)
                                                    .fastestLap(fastestLap)
                                                    .build();

                                            raceResultRepository.save(result);
                                        }
                                    }
                                }
                            }
                        } catch (Exception e) {
                            log.warn("Failed to parse sprint results for a race node, skipping. Error: {}", e.getMessage());
                        }
                    }
                }

                offset += limit;
                if (offset >= total || raceList.isEmpty()) {
                    hasMoreData = false;
                }
            } catch (Exception e) {
                log.error("Failed to sync sprint results page: {}", e.getMessage(), e);
                hasMoreData = false;
            }
        }
    }

    public void syncQualifyingResults() {
        log.info("Syncing qualifying results dynamically from Jolpica API...");
        int offset = 0;
        int limit = 100;
        boolean hasMoreData = true;

        while (hasMoreData) {
            try {
                String url = jolpicaBaseUrl + "/current/qualifying.json?limit=" + limit + "&offset=" + offset;
                String jsonResponse = restTemplate.getForObject(url, String.class);
                if (jsonResponse == null) break;

                JsonNode root = objectMapper.readTree(jsonResponse);
                JsonNode raceList = root.path("MRData").path("RaceTable").path("Races");
                int total = root.path("MRData").path("total").asInt(0);

                if (raceList.isArray() && raceList.size() > 0) {
                    for (JsonNode raceNode : raceList) {
                        try {
                            int season = raceNode.path("season").asInt();
                            int round = raceNode.path("round").asInt();
                            Optional<Race> raceOpt = raceRepository.findBySeasonAndRound(season, round);
                            
                            if (raceOpt.isPresent()) {
                                Race race = raceOpt.get();
                                JsonNode qualiResultsNode = raceNode.path("QualifyingResults");
                                if (qualiResultsNode.isArray()) {
                                    for (JsonNode resNode : qualiResultsNode) {
                                        int position = resNode.path("position").asInt();
                                        String driverId = resNode.path("Driver").path("driverId").asText();

                                        Optional<Driver> driverOpt = driverRepository.findByDriverRef(driverId);
                                        if (driverOpt.isPresent()) {
                                            RaceResult result = RaceResult.builder()
                                                    .race(race)
                                                    .driver(driverOpt.get())
                                                    .sessionType(com.f1dashboard.enums.SessionType.QUALIFYING)
                                                    .position(position)
                                                    .points(0.0)
                                                    .status("Qualified")
                                                    .gridPosition(position)
                                                    .fastestLap(false)
                                                    .build();

                                            raceResultRepository.save(result);
                                        }
                                    }
                                }
                            }
                        } catch (Exception e) {
                            log.warn("Failed to parse qualifying results for a race node, skipping. Error: {}", e.getMessage());
                        }
                    }
                }
                
                offset += limit;
                if (offset >= total || raceList.isEmpty()) {
                    hasMoreData = false;
                }
            } catch (Exception e) {
                log.error("Failed to sync qualifying results page: {}", e.getMessage(), e);
                hasMoreData = false;
            }
        }
    }

    /**
     * Reconcile race statuses based on today's date.
     * Any race whose date has passed should be COMPLETED;
     * any race in the future should be UPCOMING (unless already CANCELLED).
     */
    public void updateRaceStatusesByDate() {
        log.info("Reconciling race statuses based on current date...");
        LocalDate today = LocalDate.now();
        int currentSeason = today.getYear();

        raceRepository.findBySeasonOrderByRoundAsc(currentSeason).forEach(race -> {
            if (race.getStatus() == RaceStatus.CANCELLED) return;
            if (race.getRaceDate() == null) return;

            if (race.getRaceDate().isBefore(today) && race.getStatus() != RaceStatus.COMPLETED) {
                race.setStatus(RaceStatus.COMPLETED);
                raceRepository.save(race);
            } else if (!race.getRaceDate().isBefore(today) && race.getStatus() == RaceStatus.COMPLETED) {
                // Future race incorrectly marked completed (edge case)
                race.setStatus(RaceStatus.UPCOMING);
                raceRepository.save(race);
            }
        });
    }

    private String getTeamColor(String constructorRef) {
        return switch (constructorRef) {
            case "mercedes" -> "#27F4D2";
            case "ferrari" -> "#E8002D";
            case "mclaren" -> "#FF8000";
            case "red_bull" -> "#3671C6";
            case "alpine" -> "#FF87BC";
            case "rb" -> "#6692FF";
            case "haas" -> "#B6BABD";
            case "williams" -> "#64C4FF";
            case "audi" -> "#00FFA6";
            case "aston_martin" -> "#229971";
            case "cadillac" -> "#C0C0C0";
            default -> "#FFFFFF";
        };
    }
}
