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

   List<Driver> findAllByOrderByChampionshipPositionAsc();

   Page<Driver> findAllByOrderByPointsDesc(Pageable pageable);

   @Query("SELECT d FROM Driver d WHERE " +
         "LOWER(d.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
         "LOWER(d.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
         "LOWER(d.code) LIKE LOWER(CONCAT('%', :query, '%'))")
   List<Driver> searchDrivers(@Param("query") String query);

   List<Driver> findByConstructorIdOrderByChampionshipPositionAsc(Long constructorId);

   Driver findByChampionshipPosition(Integer position);

   java.util.Optional<Driver> findByDriverRef(String driverRef);
}