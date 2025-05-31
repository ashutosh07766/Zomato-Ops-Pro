package com.zomato.opspro.service;

import com.zomato.opspro.model.DeliveryPartner;
import com.zomato.opspro.repository.DeliveryPartnerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DeliveryPartnerService {

    @Autowired
    private DeliveryPartnerRepository deliveryPartnerRepository;

    public List<DeliveryPartner> getAllPartners() {
        return deliveryPartnerRepository.findAll();
    }

    public List<DeliveryPartner> getAvailablePartners() {
        return deliveryPartnerRepository.findByIsAvailableTrue();
    }

    public DeliveryPartner getPartnerById(Long id) {
        return deliveryPartnerRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Delivery partner not found"));
    }

    @Transactional
    public DeliveryPartner createPartner(DeliveryPartner partner) {
        if (deliveryPartnerRepository.findByUsername(partner.getUsername()) != null) {
            throw new RuntimeException("Username already exists");
        }
        partner.setIsAvailable(true);
        return deliveryPartnerRepository.save(partner);
    }

    @Transactional
    public DeliveryPartner updatePartnerAvailability(Long partnerId, boolean isAvailable) {
        DeliveryPartner partner = deliveryPartnerRepository.findById(partnerId)
                .orElseThrow(() -> new RuntimeException("Delivery partner not found"));
        partner.setIsAvailable(isAvailable);
        return deliveryPartnerRepository.save(partner);
    }

    @Transactional
    public DeliveryPartner updatePartnerEta(Long partnerId, Integer eta) {
        DeliveryPartner partner = deliveryPartnerRepository.findById(partnerId)
                .orElseThrow(() -> new RuntimeException("Delivery partner not found"));
        partner.setEta(eta);
        return deliveryPartnerRepository.save(partner);
    }
} 