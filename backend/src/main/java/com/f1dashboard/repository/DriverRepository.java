package com.f1dashboard.repository;

import com.f1dashboard.entity.Driver;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DriverRepository extends JpaRepository<Driver, Long> {

    /** Find all drivers ordered by championship position */
    List<Driver> findAllByOrderByChampionshipPositionAsc();

    /** Paginated drivers ordered by points descending */
    Page<Driver> findAllByOrderByPointsDesc(Pageable pageable);

    /** Search drivers by first or last name (case-insensitive) */
    @Query("SELECT d FROM Driver d WHERE " +
           "LOWER(d.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.code) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Driver> searchDrivers(@Param("query") String query);

    /** Find drivers by constructor */
    List<Driver> findByConstructorIdOrderByChampionshipPositionAsc(Long constructorId);

    /** Find the championship leader (driver with position 1) */
    Driver findByChampionshipPosition(Integer position);
    /** Find driver by driver reference slug */
    java.util.Optional<Driver> findByDriverRef(String driverRef);
}
