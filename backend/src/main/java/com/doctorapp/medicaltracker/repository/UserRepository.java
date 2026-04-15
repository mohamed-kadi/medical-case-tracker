package com.doctorapp.medicaltracker.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.doctorapp.medicaltracker.model.User;
import com.doctorapp.medicaltracker.model.UserRole;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByRole(UserRole role);

    List<User> findByRoleOrderByUsernameAsc(UserRole role);

    List<User> findByRoleInOrderByRoleAscUsernameAsc(Collection<UserRole> roles);
}
