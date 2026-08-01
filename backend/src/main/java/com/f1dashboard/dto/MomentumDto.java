package com.f1dashboard.dto;

import java.util.List;

public class MomentumDto {
    private DriverDto driver;
    private int score; // 0-100
    private String formTrend; // "HOT", "COLD", "NEUTRAL"
    private List<RaceMomentum> recentRaces;
    private List<LeaderboardEntry> leaderboard;

    public static class RaceMomentum {
        private String raceName;
        private int round;
        private int gridPosition;
        private int finishPosition;
        private int positionDelta;
        private double points;
        private double rollingAvgFinish;
        private double rollingAvgPoints;
        
        // Getters and Setters
        public String getRaceName() { return raceName; }
        public void setRaceName(String raceName) { this.raceName = raceName; }
        public int getRound() { return round; }
        public void setRound(int round) { this.round = round; }
        public int getGridPosition() { return gridPosition; }
        public void setGridPosition(int gridPosition) { this.gridPosition = gridPosition; }
        public int getFinishPosition() { return finishPosition; }
        public void setFinishPosition(int finishPosition) { this.finishPosition = finishPosition; }
        public int getPositionDelta() { return positionDelta; }
        public void setPositionDelta(int positionDelta) { this.positionDelta = positionDelta; }
        public double getPoints() { return points; }
        public void setPoints(double points) { this.points = points; }
        public double getRollingAvgFinish() { return rollingAvgFinish; }
        public void setRollingAvgFinish(double rollingAvgFinish) { this.rollingAvgFinish = rollingAvgFinish; }
        public double getRollingAvgPoints() { return rollingAvgPoints; }
        public void setRollingAvgPoints(double rollingAvgPoints) { this.rollingAvgPoints = rollingAvgPoints; }
    }

    public static class LeaderboardEntry {
        private DriverDto driver;
        private int score;
        
        public LeaderboardEntry(DriverDto driver, int score) {
            this.driver = driver;
            this.score = score;
        }
        
        public DriverDto getDriver() { return driver; }
        public void setDriver(DriverDto driver) { this.driver = driver; }
        public int getScore() { return score; }
        public void setScore(int score) { this.score = score; }
    }

    // Getters and Setters
    public DriverDto getDriver() { return driver; }
    public void setDriver(DriverDto driver) { this.driver = driver; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public String getFormTrend() { return formTrend; }
    public void setFormTrend(String formTrend) { this.formTrend = formTrend; }
    public List<RaceMomentum> getRecentRaces() { return recentRaces; }
    public void setRecentRaces(List<RaceMomentum> recentRaces) { this.recentRaces = recentRaces; }
    public List<LeaderboardEntry> getLeaderboard() { return leaderboard; }
    public void setLeaderboard(List<LeaderboardEntry> leaderboard) { this.leaderboard = leaderboard; }
}
