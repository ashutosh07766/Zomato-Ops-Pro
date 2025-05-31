package com.zomato.opspro.service;

import com.zomato.opspro.model.Order;
import com.zomato.opspro.model.OrderStatus;
import com.zomato.opspro.model.DeliveryPartner;
import com.zomato.opspro.repository.OrderRepository;
import com.zomato.opspro.repository.DeliveryPartnerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.List;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private DeliveryPartnerRepository deliveryPartnerRepository;

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public List<Order> getOrdersByStatus(OrderStatus status) {
        return orderRepository.findByStatus(status);
    }

    @Transactional
    public Order createOrder(Order order) {
        if (order.getPrepTime() == null) {
            throw new RuntimeException("Prep time is required");
        }
        
        // Calculate initial dispatch time based on prep time
        LocalDateTime dispatchTime = LocalDateTime.now().plusMinutes(order.getPrepTime());
        order.setDispatchTime(dispatchTime);
        order.setStatus(OrderStatus.PREP);
        return orderRepository.save(order);
    }

    @Transactional
    public Order assignDeliveryPartner(Long orderId, Long partnerId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        DeliveryPartner partner = deliveryPartnerRepository.findById(partnerId)
                .orElseThrow(() -> new RuntimeException("Delivery partner not found"));

        if (!partner.getIsAvailable()) {
            throw new RuntimeException("Delivery partner is not available");
        }

        if (order.getAssignedPartner() != null) {
            throw new RuntimeException("Order is already assigned to a partner");
        }

        // Allow assignment only in PREP or READY state
        if (order.getStatus() != OrderStatus.PREP && order.getStatus() != OrderStatus.READY) {
            throw new RuntimeException("Can only assign partner when order is in PREP or READY state");
        }

        // Update dispatch time to include partner's ETA
        if (partner.getEta() != null) {
            LocalDateTime currentDispatchTime = order.getDispatchTime();
            if (currentDispatchTime == null) {
                currentDispatchTime = LocalDateTime.now();
            }
            order.setDispatchTime(currentDispatchTime.plusMinutes(partner.getEta()));
        }

        order.setAssignedPartner(partner);
        partner.setIsAvailable(false);

        deliveryPartnerRepository.save(partner);
        return orderRepository.save(order);
    }

    @Transactional
    public Order updateOrderStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Validate status transition
        if (!isValidStatusTransition(order.getStatus(), newStatus)) {
            throw new RuntimeException("Invalid status transition");
        }

        // Check if order can be marked as ready
        if (newStatus == OrderStatus.READY) {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime minReadyTime = order.getCreatedAt().plusMinutes(order.getPrepTime());
            
            if (now.isBefore(minReadyTime)) {
                Duration remainingTime = Duration.between(now, minReadyTime);
                long remainingMinutes = remainingTime.toMinutes();
                throw new RuntimeException(
                    String.format("Order cannot be marked as ready yet. Please wait %d more minutes.", remainingMinutes)
                );
            }
        }

        order.setStatus(newStatus);

        // If order is delivered, make partner available again
        if (newStatus == OrderStatus.DELIVERED && order.getAssignedPartner() != null) {
            DeliveryPartner partner = order.getAssignedPartner();
            partner.setIsAvailable(true);
            deliveryPartnerRepository.save(partner);
        }

        return orderRepository.save(order);
    }

    private boolean isValidStatusTransition(OrderStatus currentStatus, OrderStatus newStatus) {
        switch (currentStatus) {
            case PREP:
                return newStatus == OrderStatus.READY;
            case READY:
                return newStatus == OrderStatus.PICKED;
            case PICKED:
                return newStatus == OrderStatus.ON_ROUTE;
            case ON_ROUTE:
                return newStatus == OrderStatus.DELIVERED;
            default:
                return false;
        }
    }
} 