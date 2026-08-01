package com.f1dashboard.dto;

import java.util.List;
import java.util.Map;

public class DriverComparisonDto {
    private DriverDto driverA;
    private DriverDto driverB;
    
    // Aggregate stats
    private ComparisonStats statsA;
    private ComparisonStats statsB;
    
    // Head to Head
    private int headToHeadQualiA;
    private int headToHeadQualiB;
    private int headToHeadRaceA;
    private int headToHeadRaceB;

    // Race-by-race data for charts
    private List<RaceComparisonDto> races;

    public static class ComparisonStats {
        private double points;
        private int wins;
        private int podiums;
        private double avgGrid;
        private double avgFinish;
        private int dnfs;
        
        // getters and setters
        public double getPoints() { return points; }
        public void setPoints(double points) { this.points = points; }
        public int getWins() { return wins; }
        public void setWins(int wins) { this.wins = wins; }
        public int getPodiums() { return podiums; }
        public void setPodiums(int podiums) { this.podiums = podiums; }
        public double getAvgGrid() { return avgGrid; }
        public void setAvgGrid(double avgGrid) { this.avgGrid = avgGrid; }
        public double getAvgFinish() { return avgFinish; }
        public void setAvgFinish(double avgFinish) { this.avgFinish = avgFinish; }
        public int getDnfs() { return dnfs; }
        public void setDnfs(int dnfs) { this.dnfs = dnfs; }
    }

    public static class RaceComparisonDto {
        private String raceName;
        private int round;
        
        private Integer posA;
        private Integer posB;
        
        private double cumulativePointsA;
        private double cumulativePointsB;
        
        // getters and setters
        public String getRaceName() { return raceName; }
        public void setRaceName(String raceName) { this.raceName = raceName; }
        public int getRound() { return round; }
        public void setRound(int round) { this.round = round; }
        public Integer getPosA() { return posA; }
        public void setPosA(Integer posA) { this.posA = posA; }
        public Integer getPosB() { return posB; }
        public void setPosB(Integer posB) { this.posB = posB; }
        public double getCumulativePointsA() { return cumulativePointsA; }
        public void setCumulativePointsA(double cumulativePointsA) { this.cumulativePointsA = cumulativePointsA; }
        public double getCumulativePointsB() { return cumulativePointsB; }
        public void setCumulativePointsB(double cumulativePointsB) { this.cumulativePointsB = cumulativePointsB; }
    }

    // getters and setters
    public DriverDto getDriverA() { return driverA; }
    public void setDriverA(DriverDto driverA) { this.driverA = driverA; }
    public DriverDto getDriverB() { return driverB; }
    public void setDriverB(DriverDto driverB) { this.driverB = driverB; }
    public ComparisonStats getStatsA() { return statsA; }
    public void setStatsA(ComparisonStats statsA) { this.statsA = statsA; }
    public ComparisonStats getStatsB() { return statsB; }
    public void setStatsB(ComparisonStats statsB) { this.statsB = statsB; }
    public int getHeadToHeadQualiA() { return headToHeadQualiA; }
    public void setHeadToHeadQualiA(int headToHeadQualiA) { this.headToHeadQualiA = headToHeadQualiA; }
    public int getHeadToHeadQualiB() { return headToHeadQualiB; }
    public void setHeadToHeadQualiB(int headToHeadQualiB) { this.headToHeadQualiB = headToHeadQualiB; }
    public int getHeadToHeadRaceA() { return headToHeadRaceA; }
    public void setHeadToHeadRaceA(int headToHeadRaceA) { this.headToHeadRaceA = headToHeadRaceA; }
    public int getHeadToHeadRaceB() { return headToHeadRaceB; }
    public void setHeadToHeadRaceB(int headToHeadRaceB) { this.headToHeadRaceB = headToHeadRaceB; }
    public List<RaceComparisonDto> getRaces() { return races; }
    public void setRaces(List<RaceComparisonDto> races) { this.races = races; }
}
