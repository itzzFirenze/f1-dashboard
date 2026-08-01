package com.f1dashboard.dto;

import java.time.LocalDate;
import java.util.List;

public class WeekendWeatherDto {
    private Long raceId;
    private String raceName;
    private String country;
    private LocalDate raceDate;
    private List<SessionWeather> sessions;

    public static class SessionWeather {
        private String sessionName; // FP1, FP2, FP3, Qualifying, Race
        private Double temperature;
        private Integer rainProbability;
        private Double windSpeed;
        private Integer humidity;
        private String condition; // Sunny, Cloudy, Rain, Overcast, Partly Cloudy, Thunderstorm
        private Double trackTemperature;

        // Getters and Setters
        public String getSessionName() { return sessionName; }
        public void setSessionName(String sessionName) { this.sessionName = sessionName; }
        public Double getTemperature() { return temperature; }
        public void setTemperature(Double temperature) { this.temperature = temperature; }
        public Integer getRainProbability() { return rainProbability; }
        public void setRainProbability(Integer rainProbability) { this.rainProbability = rainProbability; }
        public Double getWindSpeed() { return windSpeed; }
        public void setWindSpeed(Double windSpeed) { this.windSpeed = windSpeed; }
        public Integer getHumidity() { return humidity; }
        public void setHumidity(Integer humidity) { this.humidity = humidity; }
        public String getCondition() { return condition; }
        public void setCondition(String condition) { this.condition = condition; }
        public Double getTrackTemperature() { return trackTemperature; }
        public void setTrackTemperature(Double trackTemperature) { this.trackTemperature = trackTemperature; }
    }

    // Getters and Setters
    public Long getRaceId() { return raceId; }
    public void setRaceId(Long raceId) { this.raceId = raceId; }
    public String getRaceName() { return raceName; }
    public void setRaceName(String raceName) { this.raceName = raceName; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public LocalDate getRaceDate() { return raceDate; }
    public void setRaceDate(LocalDate raceDate) { this.raceDate = raceDate; }
    public List<SessionWeather> getSessions() { return sessions; }
    public void setSessions(List<SessionWeather> sessions) { this.sessions = sessions; }
}
