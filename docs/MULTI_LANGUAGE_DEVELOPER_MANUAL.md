# Multi-Language Microservices Developer Manual
## Architectural Standards & Polyglot Integration Framework

---

## 1. Executive Summary & Core Rules

This manual establishes concrete architectural standards, directory layouts, and API contract designs to support a multi-language (Polyglot) microservices development pipeline within the **Content Intelligence Platform (CIP)** ecosystem.

Whether developers build using **TypeScript/Node.js**, **Go**, or **Java Spring Boot**, every microservice **must** adhere to identical rules regarding Hexagonal boundaries, API gateway prefix routing, AMQP queue policies, and REST response shapes.

---

## 2. Standardized REST Response Envelope

Every microservice across all languages **must** return the exact same JSON payload envelope for all endpoints:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "total_records": 10
  },
  "errors": []
}
```

### 2.1 Standardized Error Response Envelope
```json
{
  "success": false,
  "data": null,
  "meta": {},
  "errors": [
    {
      "code": "INVALID_STATE_TRANSITION",
      "message": "Videos cannot transition from Published back to Ideation.",
      "field": "status"
    }
  ]
}
```

---

## 3. Directory Layout Standards (Hexagonal Architecture)

Every repository must keep business rules separated from external technological adapters (ports and adapters).

### 3.1 Node.js / Go Layout
```text
src/
├── domain/                  # Pure Business Logic (No HTTP/DB libraries allowed)
│   ├── models/              # Aggregates, Entities, Value Objects
│   └── services/            # Domain services / logic calculation
├── ports/                   # Boundaries
│   ├── inbound/             # Use cases, query interfaces
│   └── outbound/            # Repositories, publishers interfaces
└── adapters/                # Implementations
    ├── inbound/             # Controllers, AMQP listeners
    └── outbound/            # SQL drivers, RabbitMQ publishers, HTTP clients
```

### 3.2 Java Spring Boot Layout (The Spring Boot Standard)
```text
src/main/java/com/cip/service/
├── domain/                  # Pure Domain Core
│   ├── models/              # Plain Old Java Objects (POJOs)
│   └── services/            # Core business calculation logic
├── ports/                   # Port interfaces
│   ├── inbound/             # UseCase services interfaces
│   └── outbound/            # Repository and event interfaces
└── adapters/                # Technology implementation adapters
    ├── inbound/             # REST Controllers, AMQP Message Listeners
    │   ├── rest/            # @RestController endpoints
    │   └── mq/              # @RabbitListener event handlers
    └── outbound/            # JPA Data repositories, RabbitTemplate event dispatchers
        ├── jpa/             # @Repository configurations
        └── mq/              # Event dispatching adapters
```

---

## 4. Java Spring Boot Boilerplate Specification

Below is the authoritative, copy-pasteable blueprint for creating a new microservice (e.g., `CIP Analytics Engine`) using Java Spring Boot.

### 4.1 Maven Dependencies (`pom.xml`)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.cip</groupId>
    <artifactId>analytics-service</artifactId>
    <version>1.0.0</version>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.1.5</version>
        <relativePath/>
    </parent>

    <dependencies>
        <!-- Web MVC & Gateway Routing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <!-- Asynchronous Event Bus (RabbitMQ) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-amqp</artifactId>
        </dependency>

        <!-- Database Persistence (JPA + PostgreSQL) -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- Utilities -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</scope>
        </dependency>
    </dependencies>
</project>
```

### 4.2 Standardized REST Envelope Model (`ResponseEnvelope.java`)
```java
package com.cip.service.adapters.inbound.rest.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class ResponseEnvelope<T> {
    private boolean success;
    private T data;
    private Map<String, Object> meta;
    private List<ApiError> errors;

    @Data
    @Builder
    public static class ApiError {
        private String code;
        private String message;
        private String field;
    }
}
```

### 4.3 Standardized REST Controller (`AnalyticsController.java`)
```java
package com.cip.service.adapters.inbound.rest;

import com.cip.service.adapters.inbound.rest.dto.ResponseEnvelope;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/analytics")
public class AnalyticsController {

    @GetMapping("/snapshots/{id}")
    public ResponseEntity<ResponseEnvelope<Map<String, Object>>> getSnapshot(
            @PathVariable UUID id,
            @RequestHeader(value = "X-Tenant-Id", defaultValue = "00000000-0000-0000-0000-000000000000") UUID tenantId) {

        Map<String, Object> snapshotData = Map.of(
            "id", id,
            "tenant_id", tenantId,
            "views", 48240,
            "watch_time_minutes", 125004
        );

        ResponseEnvelope<Map<String, Object>> envelope = ResponseEnvelope.<Map<String, Object>>builder()
                .success(true)
                .data(snapshotData)
                .meta(Map.of("cached", true))
                .errors(List.of())
                .build();

        return ResponseEntity.ok(envelope);
    }
}
```

### 4.4 Standardized AMQP / Event-Bus Consumer (`RabbitEventListener.java`)
```java
package com.cip.service.adapters.inbound.mq;

import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class RabbitEventListener {

    // Processes completed youtube synchronizations
    @RabbitListener(queues = "queue.analytics.youtube_synced")
    public void handleYouTubeSyncCompleted(String eventPayload) {
        try {
            System.out.println("Processing event payload dynamically: " + eventPayload);
            // 1. Process and compute insights
            // 2. Acknowledge message delivery
        } catch (Exception e) {
            // Unhandled exceptions are automatically routed to 'dlq.analytics.youtube_synced'
            // after completing retry attempts.
            throw new AmqpRejectAndDontRequeueException(e);
        }
    }
}
```

---

## 5. Deployment, Ports & Gateway Configurations

Every microservice container must allocate separate host and container ports, routed explicitly through Kong declarative proxies (`kong.yml`) using the same version patterns:

*   **REST Route Matching:** `/api/v1/analytics/*` ──► `http://analytics-service:8087`
*   **W3C Trace Header Context:** `trace_id` propagated inside HTTP and MQ headers to track transactions end-to-end.
