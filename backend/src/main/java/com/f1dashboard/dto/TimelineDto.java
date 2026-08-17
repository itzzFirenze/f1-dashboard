package com.f1dashboard.dto;

import java.time.LocalDate;
import java.util.List;

public class TimelineDto {
   private List<TimelineEvent> events;
   private List<GapDataPoint> gapEvolution;

   public static class TimelineEvent {
      private int round;
      private String raceName;
      private String country;
      private LocalDate date;
      private String status;
      private String winner;
      private String winnerCode;
      private String winnerConstructor;
      private String winnerConstructorColor;
      private String championshipLeader;
      private String championshipLeaderCode;
      private double leaderPoints;
      private double gapToSecond;
      private boolean leadChanged;
      private List<String> keyEvents;

      // Getters and Setters
      public int getRound() {
         return round;
      }

      public void setRound(int round) {
         this.round = round;
      }

      public String getRaceName() {
         return raceName;
      }

      public void setRaceName(String raceName) {
         this.raceName = raceName;
      }

      public String getCountry() {
         return country;
      }

      public void setCountry(String country) {
         this.country = country;
      }

      public LocalDate getDate() {
         return date;
      }

      public void setDate(LocalDate date) {
         this.date = date;
      }

      public String getStatus() {
         return status;
      }

      public void setStatus(String status) {
         this.status = status;
      }

      public String getWinner() {
         return winner;
      }

      public void setWinner(String winner) {
         this.winner = winner;
      }

      public String getWinnerCode() {
         return winnerCode;
      }

      public void setWinnerCode(String winnerCode) {
         this.winnerCode = winnerCode;
      }

      public String getWinnerConstructor() {
         return winnerConstructor;
      }

      public void setWinnerConstructor(String winnerConstructor) {
         this.winnerConstructor = winnerConstructor;
      }

      public String getWinnerConstructorColor() {
         return winnerConstructorColor;
      }

      public void setWinnerConstructorColor(String winnerConstructorColor) {
         this.winnerConstructorColor = winnerConstructorColor;
      }

      public String getChampionshipLeader() {
         return championshipLeader;
      }

      public void setChampionshipLeader(String championshipLeader) {
         this.championshipLeader = championshipLeader;
      }

      public String getChampionshipLeaderCode() {
         return championshipLeaderCode;
      }

      public void setChampionshipLeaderCode(String championshipLeaderCode) {
         this.championshipLeaderCode = championshipLeaderCode;
      }

      public double getLeaderPoints() {
         return leaderPoints;
      }

      public void setLeaderPoints(double leaderPoints) {
         this.leaderPoints = leaderPoints;
      }

      public double getGapToSecond() {
         return gapToSecond;
      }

      public void setGapToSecond(double gapToSecond) {
         this.gapToSecond = gapToSecond;
      }

      public boolean isLeadChanged() {
         return leadChanged;
      }

      public void setLeadChanged(boolean leadChanged) {
         this.leadChanged = leadChanged;
      }

      public List<String> getKeyEvents() {
         return keyEvents;
      }

      public void setKeyEvents(List<String> keyEvents) {
         this.keyEvents = keyEvents;
      }
   }

   public static class GapDataPoint {
      private int round;
      private String raceName;
      private double gap;

      public int getRound() {
         return round;
      }

      public void setRound(int round) {
         this.round = round;
      }

      public String getRaceName() {
         return raceName;
      }

      public void setRaceName(String raceName) {
         this.raceName = raceName;
      }

      public double getGap() {
         return gap;
      }

      public void setGap(double gap) {
         this.gap = gap;
      }
   }

   // Getters and Setters
   public List<TimelineEvent> getEvents() {
      return events;
   }

   public void setEvents(List<TimelineEvent> events) {
      this.events = events;
   }

   public List<GapDataPoint> getGapEvolution() {
      return gapEvolution;
   }

   public void setGapEvolution(List<GapDataPoint> gapEvolution) {
      this.gapEvolution = gapEvolution;
   }
}