# ADR-019: Message Processing Idempotency Strategy

## Status
Approved

## Context
In an asynchronous event-driven network, message brokers guarantee **at-least-once** delivery. This means messages can be delivered multiple times due to networking glitches or client retries. If an event like `video.imported` is processed twice, it can duplicate analytics snapshots or AI recommendations.

## Decision
We will enforce strict **Idempotency** rules:
*   Every incoming event must contain a unique `event_id` (UUID).
*   Consumer services must record successfully processed `event_id` keys inside a dedicated local PostgreSQL/Redis table (`processed_events`) with a 7-day TTL.
*   If a duplicate `event_id` is received, the consumer must log the duplicate and skip processing immediately.

## Consequences
*   Zero duplicate database rows or double-processing errors.
*   Low-latency check (using Redis or primary key index lookup) before executing any heavy logic.
