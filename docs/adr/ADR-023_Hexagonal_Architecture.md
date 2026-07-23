# ADR-023: Hexagonal Architecture (Ports & Adapters)

## Status
Approved

## Context
As codebases grow, business logic frequently becomes mixed with database access code, framework routing logic, or third-party client integrations. This makes testing hard and limits long-term maintainability.

## Decision
We will standardize on **Hexagonal Architecture (Ports & Adapters)** for all core CIP microservices.

## Architecture Layers
*   **Domain Core:** Contains pure business logic, aggregates, entities, and value objects (no database or HTTP dependencies).
*   **Ports (Interfaces):** Defines input ports (e.g., Use Cases, Query Handlers) and output ports (e.g., Repository interfaces, Message publisher interfaces).
*   **Adapters (Implementation):** Plugs into Ports. Input adapters (e.g., HTTP Controllers, Event Listeners) and Output adapters (e.g., PostgreSQL repositories, RabbitMQ publishers).

## Consequences
*   Highly testable domain logic. We can test business logic without spinning up database servers or network endpoints.
*   Framework independence. We can swap databases, routing frameworks, or message brokers by altering only the adapters, keeping domain logic intact.
