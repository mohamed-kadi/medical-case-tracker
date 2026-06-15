package com.doctorapp.medicaltracker.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @Query("""
            select u from User u
            where u.role = com.doctorapp.medicaltracker.model.UserRole.PATIENT
              and u.enabled = true
              and (
                lower(u.username) like lower(concat('%', :query, '%'))
                or lower(u.email) like lower(concat('%', :query, '%'))
              )
            order by u.username asc
            """)
    List<User> searchEnabledPatientAccounts(@Param("query") String query);
}
