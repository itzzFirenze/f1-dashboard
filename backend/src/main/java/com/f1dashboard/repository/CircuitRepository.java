package com.f1dashboard.repository;

import com.f1dashboard.entity.Circuit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CircuitRepository extends JpaRepository<Circuit, Long> {

    /** Search circuits by name, country, or location */
    @Query("SELECT c FROM Circuit c WHERE " +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.country) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.location) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Circuit> searchCircuits(@Param("query") String query);
    /** Find circuit by its reference slug */
    java.util.Optional<Circuit> findByCircuitRef(String circuitRef);
}
