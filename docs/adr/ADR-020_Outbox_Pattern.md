# ADR-020: Transactional Outbox Pattern Selection

## Status
Approved

## Context
When a service persists data to its database and immediately publishes an event to the Event Bus, there is a risk of inconsistency. If the database save succeeds but the Event Bus is unreachable, or vice versa, data becomes out of sync across services.

## Decision
We will adopt the **Transactional Outbox Pattern**:
*   Instead of publishing events directly to the message broker inside business code, services write the event payload to an `outbox` database table within the same local transaction as the business operation.
*   A lightweight background polling process (or Debezium CDC listener in later phases) reads events from the `outbox` table, publishes them to the Event Bus, and marks them as `processed`.

## Consequences
*   **Guaranteed Event Delivery:** Events are never lost due to connection drops or broker downtime.
*   No distributed 2-Phase commits required, keeping databases highly responsive.
