# ADR-021: Distributed Saga Pattern Selection

## Status
Approved

## Context
When a complex operation spans multiple microservices (e.g., deleting a video requires removing content rows, clearing analytics snapshots, removing search indexes, updating roadmap links, and resetting calendar dates), traditional ACID transactions cannot be used.

## Decision
We will use the **Saga Pattern (Choreography-based)** to coordinate multi-service workflows:
*   Instead of synchronous distributed transactions, each service completes its local transaction and publishes an event.
*   Other services listen to this event and execute their local updates.
*   If a step fails, compensation events are published to rollback previous steps (eventual consistency).

## Consequences
*   No database locking across service networks.
*   Services remain highly decoupled, executing their local logic independently.
