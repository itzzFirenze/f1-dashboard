package com.f1dashboard.dto;

import java.util.List;

public class ConstructorComparisonDto {
    private ConstructorDto teamA;
    private ConstructorDto teamB;
    
    private List<DriverPointSplit> driverSplitA;
    private List<DriverPointSplit> driverSplitB;
    
    private List<RoundComparison> rounds;

    public static class DriverPointSplit {
        private DriverDto driver;
        private double points;
        private double percentage;
        private double avgQuali;
        private double avgRace;
        
        // getters and setters
        public DriverDto getDriver() { return driver; }
        public void setDriver(DriverDto driver) { this.driver = driver; }
        public double getPoints() { return points; }
        public void setPoints(double points) { this.points = points; }
        public double getPercentage() { return percentage; }
        public void setPercentage(double percentage) { this.percentage = percentage; }
        public double getAvgQuali() { return avgQuali; }
        public void setAvgQuali(double avgQuali) { this.avgQuali = avgQuali; }
        public double getAvgRace() { return avgRace; }
        public void setAvgRace(double avgRace) { this.avgRace = avgRace; }
    }
    
    public static class RoundComparison {
        private String raceName;
        private int round;
        
        private double pointsA;
        private double pointsB;
        
        private double cumulativePointsA;
        private double cumulativePointsB;
        
        private double gap; // cumulativePointsA - cumulativePointsB
        
        // Detailed points per driver for stacked bar
        private List<DriverPoints> driverPointsA;
        private List<DriverPoints> driverPointsB;

        // getters and setters
        public String getRaceName() { return raceName; }
        public void setRaceName(String raceName) { this.raceName = raceName; }
        public int getRound() { return round; }
        public void setRound(int round) { this.round = round; }
        public double getPointsA() { return pointsA; }
        public void setPointsA(double pointsA) { this.pointsA = pointsA; }
        public double getPointsB() { return pointsB; }
        public void setPointsB(double pointsB) { this.pointsB = pointsB; }
        public double getCumulativePointsA() { return cumulativePointsA; }
        public void setCumulativePointsA(double cumulativePointsA) { this.cumulativePointsA = cumulativePointsA; }
        public double getCumulativePointsB() { return cumulativePointsB; }
        public void setCumulativePointsB(double cumulativePointsB) { this.cumulativePointsB = cumulativePointsB; }
        public double getGap() { return gap; }
        public void setGap(double gap) { this.gap = gap; }
        public List<DriverPoints> getDriverPointsA() { return driverPointsA; }
        public void setDriverPointsA(List<DriverPoints> driverPointsA) { this.driverPointsA = driverPointsA; }
        public List<DriverPoints> getDriverPointsB() { return driverPointsB; }
        public void setDriverPointsB(List<DriverPoints> driverPointsB) { this.driverPointsB = driverPointsB; }
    }

    public static class DriverPoints {
        private String driverCode;
        private double points;
        
        public DriverPoints(String driverCode, double points) {
            this.driverCode = driverCode;
            this.points = points;
        }
        
        public String getDriverCode() { return driverCode; }
        public void setDriverCode(String driverCode) { this.driverCode = driverCode; }
        public double getPoints() { return points; }
        public void setPoints(double points) { this.points = points; }
    }

    // getters and setters
    public ConstructorDto getTeamA() { return teamA; }
    public void setTeamA(ConstructorDto teamA) { this.teamA = teamA; }
    public ConstructorDto getTeamB() { return teamB; }
    public void setTeamB(ConstructorDto teamB) { this.teamB = teamB; }
    public List<DriverPointSplit> getDriverSplitA() { return driverSplitA; }
    public void setDriverSplitA(List<DriverPointSplit> driverSplitA) { this.driverSplitA = driverSplitA; }
    public List<DriverPointSplit> getDriverSplitB() { return driverSplitB; }
    public void setDriverSplitB(List<DriverPointSplit> driverSplitB) { this.driverSplitB = driverSplitB; }
    public List<RoundComparison> getRounds() { return rounds; }
    public void setRounds(List<RoundComparison> rounds) { this.rounds = rounds; }
}
