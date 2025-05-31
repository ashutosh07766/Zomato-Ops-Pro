package com.zomato.opspro.repository;

import com.zomato.opspro.model.DeliveryPartner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeliveryPartnerRepository extends JpaRepository<DeliveryPartner, Long> {
    List<DeliveryPartner> findByIsAvailableTrue();
    DeliveryPartner findByUsername(String username);
    boolean existsByPhoneNumber(String phoneNumber);
} 