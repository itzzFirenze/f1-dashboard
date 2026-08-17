package com.f1dashboard.repository;

import com.f1dashboard.entity.Constructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConstructorRepository extends JpaRepository<Constructor, Long> {

   List<Constructor> findAllByOrderByChampionshipPositionAsc();

   Constructor findByChampionshipPosition(Integer position);

   java.util.Optional<Constructor> findByConstructorRef(String constructorRef);
}
