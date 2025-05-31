package com.zomato.opspro.controller;

import com.zomato.opspro.model.DeliveryPartner;
import com.zomato.opspro.service.DeliveryPartnerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/partners")
public class DeliveryPartnerController {

    @Autowired
    private DeliveryPartnerService deliveryPartnerService;

    @GetMapping
    public List<DeliveryPartner> getAllPartners() {
        return deliveryPartnerService.getAllPartners();
    }

    @GetMapping("/available")
    public List<DeliveryPartner> getAvailablePartners() {
        return deliveryPartnerService.getAvailablePartners();
    }

    @GetMapping("/{id}")
    public DeliveryPartner getPartnerById(@PathVariable Long id) {
        return deliveryPartnerService.getPartnerById(id);
    }

    @PostMapping
    public DeliveryPartner createPartner(@RequestBody DeliveryPartner partner) {
        return deliveryPartnerService.createPartner(partner);
    }

    @PutMapping("/{partnerId}/availability")
    public DeliveryPartner updateAvailability(
            @PathVariable Long partnerId,
            @RequestParam boolean isAvailable) {
        return deliveryPartnerService.updatePartnerAvailability(partnerId, isAvailable);
    }

    @PutMapping("/{partnerId}/eta")
    public DeliveryPartner updateEta(
            @PathVariable Long partnerId,
            @RequestParam Integer eta) {
        return deliveryPartnerService.updatePartnerEta(partnerId, eta);
    }
} 