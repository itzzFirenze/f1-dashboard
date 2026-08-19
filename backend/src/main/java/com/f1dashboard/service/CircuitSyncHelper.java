package com.f1dashboard.service;

import com.f1dashboard.entity.Circuit;
import com.f1dashboard.repository.CircuitRepository;
import com.f1dashboard.util.CircuitDataSeeder;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CircuitSyncHelper {

   private final CircuitRepository circuitRepository;

   /**
    * Inserts a new circuit in its own transaction (REQUIRES_NEW), so that if
    * a concurrent sync run already inserted the same circuit_ref and this
    * insert hits the unique constraint, only THIS transaction rolls back —
    * not the caller's outer sync transaction.
    */
   @Transactional(propagation = Propagation.REQUIRES_NEW)
   public Circuit createCircuit(String circuitId, String name, String country, String locality,
         double lat, double lon, CircuitDataSeeder.CircuitStats stats) {
      Circuit circuit = Circuit.builder()
            .circuitRef(circuitId)
            .name(name)
            .country(country)
            .location(locality)
            .latitude(lat)
            .longitude(lon)
            .lengthKm(stats.getLengthKm())
            .corners(stats.getCorners())
            .lapRecord(stats.getLapRecord())
            .lapRecordHolder(stats.getLapRecordHolder())
            .build();
      return circuitRepository.saveAndFlush(circuit);
   }
}