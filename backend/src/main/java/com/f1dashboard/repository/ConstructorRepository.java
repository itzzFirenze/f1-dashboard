package com.f1dashboard.repository;

import com.f1dashboard.entity.Constructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConstructorRepository extends JpaRepository<Constructor, Long> {

    /** Find all constructors ordered by championship position */
    List<Constructor> findAllByOrderByChampionshipPositionAsc();

    /** Find the championship leader */
    Constructor findByChampionshipPosition(Integer position);
    /** Find constructor by constructor reference slug */
    java.util.Optional<Constructor> findByConstructorRef(String constructorRef);
}
