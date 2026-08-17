package com.f1dashboard.dto;

import java.util.List;

public class RecordsDto {
   private List<DriverRecord> mostWinsDriver;
   private List<DriverRecord> mostPodiumsDriver;
   private List<DriverRecord> mostPointsDriver;
   private List<DriverRecord> highestWinRateDriver;

   private List<ConstructorRecord> mostWinsConstructor;
   private List<ConstructorRecord> mostPodiumsConstructor;
   private List<ConstructorRecord> mostPointsConstructor;

   public static class DriverRecord {
      private String driverCode;
      private String driverName;
      private String constructorName;
      private String constructorColor;
      private double value;
      private String displayValue;

      // Getters and Setters
      public String getDriverCode() {
         return driverCode;
      }

      public void setDriverCode(String driverCode) {
         this.driverCode = driverCode;
      }

      public String getDriverName() {
         return driverName;
      }

      public void setDriverName(String driverName) {
         this.driverName = driverName;
      }

      public String getConstructorName() {
         return constructorName;
      }

      public void setConstructorName(String constructorName) {
         this.constructorName = constructorName;
      }

      public String getConstructorColor() {
         return constructorColor;
      }

      public void setConstructorColor(String constructorColor) {
         this.constructorColor = constructorColor;
      }

      public double getValue() {
         return value;
      }

      public void setValue(double value) {
         this.value = value;
      }

      public String getDisplayValue() {
         return displayValue;
      }

      public void setDisplayValue(String displayValue) {
         this.displayValue = displayValue;
      }
   }

   public static class ConstructorRecord {
      private String constructorName;
      private String constructorColor;
      private double value;
      private String displayValue;

      // Getters and Setters
      public String getConstructorName() {
         return constructorName;
      }

      public void setConstructorName(String constructorName) {
         this.constructorName = constructorName;
      }

      public String getConstructorColor() {
         return constructorColor;
      }

      public void setConstructorColor(String constructorColor) {
         this.constructorColor = constructorColor;
      }

      public double getValue() {
         return value;
      }

      public void setValue(double value) {
         this.value = value;
      }

      public String getDisplayValue() {
         return displayValue;
      }

      public void setDisplayValue(String displayValue) {
         this.displayValue = displayValue;
      }
   }

   // Getters and Setters
   public List<DriverRecord> getMostWinsDriver() {
      return mostWinsDriver;
   }

   public void setMostWinsDriver(List<DriverRecord> mostWinsDriver) {
      this.mostWinsDriver = mostWinsDriver;
   }

   public List<DriverRecord> getMostPodiumsDriver() {
      return mostPodiumsDriver;
   }

   public void setMostPodiumsDriver(List<DriverRecord> mostPodiumsDriver) {
      this.mostPodiumsDriver = mostPodiumsDriver;
   }

   public List<DriverRecord> getMostPointsDriver() {
      return mostPointsDriver;
   }

   public void setMostPointsDriver(List<DriverRecord> mostPointsDriver) {
      this.mostPointsDriver = mostPointsDriver;
   }

   public List<DriverRecord> getHighestWinRateDriver() {
      return highestWinRateDriver;
   }

   public void setHighestWinRateDriver(List<DriverRecord> highestWinRateDriver) {
      this.highestWinRateDriver = highestWinRateDriver;
   }

   public List<ConstructorRecord> getMostWinsConstructor() {
      return mostWinsConstructor;
   }

   public void setMostWinsConstructor(List<ConstructorRecord> mostWinsConstructor) {
      this.mostWinsConstructor = mostWinsConstructor;
   }

   public List<ConstructorRecord> getMostPodiumsConstructor() {
      return mostPodiumsConstructor;
   }

   public void setMostPodiumsConstructor(List<ConstructorRecord> mostPodiumsConstructor) {
      this.mostPodiumsConstructor = mostPodiumsConstructor;
   }

   public List<ConstructorRecord> getMostPointsConstructor() {
      return mostPointsConstructor;
   }

   public void setMostPointsConstructor(List<ConstructorRecord> mostPointsConstructor) {
      this.mostPointsConstructor = mostPointsConstructor;
   }
}