package com.f1dashboard.dto;

import java.time.LocalDate;
import java.util.List;

public class WeekendWeatherDto {
   private Long raceId;
   private String raceName;
   private String country;
   private LocalDate raceDate;
   private String circuitName;
   private String locality;
   private Double latitude;
   private Double longitude;
   private Boolean isRealData;
   private String source;
   private CurrentTrackWeather currentWeather;
   private List<SessionWeather> sessions;

   public static class CurrentTrackWeather {
      private Double temperature;
      private Integer humidity;
      private Double windSpeed;
      private Integer rainProbability;
      private String condition;
      private Double trackTemperature;
      private Double surfacePressure;
      private String lastUpdated;

      public Double getTemperature() { return temperature; }
      public void setTemperature(Double temperature) { this.temperature = temperature; }

      public Integer getHumidity() { return humidity; }
      public void setHumidity(Integer humidity) { this.humidity = humidity; }

      public Double getWindSpeed() { return windSpeed; }
      public void setWindSpeed(Double windSpeed) { this.windSpeed = windSpeed; }

      public Integer getRainProbability() { return rainProbability; }
      public void setRainProbability(Integer rainProbability) { this.rainProbability = rainProbability; }

      public String getCondition() { return condition; }
      public void setCondition(String condition) { this.condition = condition; }

      public Double getTrackTemperature() { return trackTemperature; }
      public void setTrackTemperature(Double trackTemperature) { this.trackTemperature = trackTemperature; }

      public Double getSurfacePressure() { return surfacePressure; }
      public void setSurfacePressure(Double surfacePressure) { this.surfacePressure = surfacePressure; }

      public String getLastUpdated() { return lastUpdated; }
      public void setLastUpdated(String lastUpdated) { this.lastUpdated = lastUpdated; }
   }

   public static class SessionWeather {
      private String sessionName;
      private Double temperature;
      private Integer rainProbability;
      private Double windSpeed;
      private Integer humidity;
      private String condition;
      private Double trackTemperature;
      private String sessionDate;

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

      public String getSessionDate() { return sessionDate; }
      public void setSessionDate(String sessionDate) { this.sessionDate = sessionDate; }
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

   public String getCircuitName() { return circuitName; }
   public void setCircuitName(String circuitName) { this.circuitName = circuitName; }

   public String getLocality() { return locality; }
   public void setLocality(String locality) { this.locality = locality; }

   public Double getLatitude() { return latitude; }
   public void setLatitude(Double latitude) { this.latitude = latitude; }

   public Double getLongitude() { return longitude; }
   public void setLongitude(Double longitude) { this.longitude = longitude; }

   public Boolean getIsRealData() { return isRealData; }
   public void setIsRealData(Boolean isRealData) { this.isRealData = isRealData; }

   public String getSource() { return source; }
   public void setSource(String source) { this.source = source; }

   public CurrentTrackWeather getCurrentWeather() { return currentWeather; }
   public void setCurrentWeather(CurrentTrackWeather currentWeather) { this.currentWeather = currentWeather; }

   public List<SessionWeather> getSessions() { return sessions; }
   public void setSessions(List<SessionWeather> sessions) { this.sessions = sessions; }
}