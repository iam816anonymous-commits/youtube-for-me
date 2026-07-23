# Coding Standards and Conventions (CSC)
## For Content Intelligence Platform (CIP) Team

---

## 1. Document Purpose
This document establishes absolute coding standards, architectural layers, naming conventions, error-handling policies, and testing targets across all repositories and teams within the CIP ecosystem. Following these standards guarantees consistency, maintainability, and security across service codebases.

---

## 2. Directory Structure Conventions

Every backend microservice **shall** follow a strict **Hexagonal (Ports & Adapters)** directory layout to decouple business rules from external frameworks:

```text
src/
├── domain/                  # Pure Business Logic (No external framework imports)
│   ├── models/              # Aggregates, Entities, Value Objects
│   └── services/            # Domain Services / pure logic calculators
│
├── ports/                   # Boundary Interfaces (Ports)
│   ├── inbound/             # e.g., UseCases, QueryHandlers interfaces
│   └── outbound/            # e.g., IVideoRepository, IMessagePublisher interfaces
│
├── adapters/                # Technological Implementations (Adapters)
│   ├── inbound/             # Controllers, Event Listeners, gRPC Handlers
│   │   ├── http/
│   │   └── event/
│   │
│   └── outbound/            # Database queries, External API clients, Message publishers
│       ├── postgres/
│       └── messagebus/
│
└── config/                  # Server bootstrapper, dependency injection wiring
```

---

## 3. General Naming Conventions

*   **Files & Directories:** `kebab-case` for directories and files (e.g., `video-repository.ts`, `user-profile-controller.go`).
*   **Database Tables & Columns:** `snake_case` (e.g., `ct_videos`, `tenant_id`).
*   **Variable & Functions:** `camelCase` (e.g., `getVideoById()`).
*   **Classes, Structs & Interfaces:** `PascalCase` (e.g., `VideoService`). Interfaces should prefix with an `I` when applicable (e.g., `IVideoRepository`).

---

## 4. Error Handling Policies

No raw error traces or database exceptions **shall** ever be returned directly to the client layer.

*   **API Gateways:** Standardize error formats globally.
*   **Standard HTTP Error JSON Schema:**
    ```json
    {
      "error": {
        "code": "INVALID_STATE_TRANSITION",
        "message": "Video cannot transition from Published back to Ideation.",
        "details": [
          {
            "field": "status",
            "issue": "Published videos cannot be modified"
          }
        ],
        "timestamp": "2024-07-23T12:00:15Z"
      }
    }
    ```
*   **gRPC Status Codes:** Map business exceptions cleanly to standard gRPC codes (e.g., `NOT_FOUND` for missing rows, `INVALID_ARGUMENT` for bad payloads).

---

## 5. Structured Logging Guidelines

All logs **shall** be formatted as JSON and printed directly to standard output (`stdout`/`stderr`).

*   **Attributes required on every log statement:**
    *   `timestamp` (ISO-8601 date-time)
    *   `level` (DEBUG, INFO, WARN, ERROR, FATAL)
    *   `service_name` (e.g., `content-service`)
    *   `trace_id` (propagated from Kong Gateway via W3C HTTP headers)
*   **Example log record:**
    ```json
    {
      "timestamp": "2024-07-23T12:05:00.124Z",
      "level": "ERROR",
      "service_name": "analytics-service",
      "trace_id": "01-9fbc812aa31d4512-09bb01249f-01",
      "message": "Failed to connect to primary database replica",
      "meta": {
        "replica_host": "db-replica-1",
        "retry_attempt": 3
      }
    }
    ```

---

## 6. Dependency Injection (DI)

To promote decoupled modularity and verify testing:
*   Classes/structs **must not** instantiate their own dependencies or repositories.
*   All dependencies **must** be declared as Interfaces (Ports) and passed into constructors via constructor dependency injection.

---

## 7. Testing Standards

CIP enforces a rigorous progressive testing pyramid:
1.  **Unit Tests:** Must isolate domain services/use cases by mocking database (outbound) ports. Target coverage: **90%**.
2.  **Integration Tests:** Must execute actual SQL queries and pgvector indices on ephemeral PostgreSQL/Docker test instances. Target coverage: **75%**.
3.  **Contract Tests (API & Event):** Must execute Pact tests to ensure API gateway schemas and Event payloads do not drift across teams.

---

## 8. Versioning Conventions

### 8.1 API Versioning
*   All public REST paths must include the api version prefix (e.g., `/api/v1/videos`).
*   Incompatible, breaking changes require bumping the version path (e.g., `/api/v2/videos`).

### 8.2 Event Versioning
*   All events emitted to the message broker must include a version marker inside their metadata envelopes (e.g., `event_version: "1.0.0"`).
