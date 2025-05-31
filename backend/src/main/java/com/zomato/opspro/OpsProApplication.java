package com.zomato.opspro;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;

@SpringBootApplication
@OpenAPIDefinition(
    info = @Info(
        title = "Zomato Ops Pro API",
        version = "1.0",
        description = "Logistics Coordination Platform API"
    )
)
public class OpsProApplication {
    public static void main(String[] args) {
        SpringApplication.run(OpsProApplication.class, args);
    }
} 