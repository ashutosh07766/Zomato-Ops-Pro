package com.zomato.opspro.repository;

import com.zomato.opspro.model.Order;
import com.zomato.opspro.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByStatus(OrderStatus status);
    List<Order> findByAssignedPartnerId(Long partnerId);
    boolean existsByAssignedPartnerIdAndStatusNot(Long partnerId, OrderStatus status);
} 