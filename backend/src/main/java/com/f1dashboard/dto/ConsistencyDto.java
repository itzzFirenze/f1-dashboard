package com.f1dashboard.dto;

import java.util.List;
import java.util.Map;

public class ConsistencyDto {
   private List<String> races;
   private List<DriverConsistency> drivers;

   public static class DriverConsistency {
      private DriverDto driver;
      private double pointsFinishRate;
      private double avgFinishPosition;
      private double stdDevPosition;

      private Map<String, String> resultsByRace;

      public DriverDto getDriver() {
         return driver;
      }

      public void setDriver(DriverDto driver) {
         this.driver = driver;
      }

      public double getPointsFinishRate() {
         return pointsFinishRate;
      }

      public void setPointsFinishRate(double pointsFinishRate) {
         this.pointsFinishRate = pointsFinishRate;
      }

      public double getAvgFinishPosition() {
         return avgFinishPosition;
      }

      public void setAvgFinishPosition(double avgFinishPosition) {
         this.avgFinishPosition = avgFinishPosition;
      }

      public double getStdDevPosition() {
         return stdDevPosition;
      }

      public void setStdDevPosition(double stdDevPosition) {
         this.stdDevPosition = stdDevPosition;
      }

      public Map<String, String> getResultsByRace() {
         return resultsByRace;
      }

      public void setResultsByRace(Map<String, String> resultsByRace) {
         this.resultsByRace = resultsByRace;
      }
   }

   public List<String> getRaces() {
      return races;
   }

   public void setRaces(List<String> races) {
      this.races = races;
   }

   public List<DriverConsistency> getDrivers() {
      return drivers;
   }

   public void setDrivers(List<DriverConsistency> drivers) {
      this.drivers = drivers;
   }
}