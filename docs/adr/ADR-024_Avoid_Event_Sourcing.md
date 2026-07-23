# ADR-024: Rejection of Event Sourcing Pattern

## Status
Approved

## Context
While the system is event-driven, the team evaluated whether we should implement full **Event Sourcing** (where the database stores only immutable events, and state is computed dynamically by replaying them) instead of standard state tracking.

## Decision
We will **NOT** use Event Sourcing. We will persist current state inside relational tables and emit transactional events over the Event Bus.

## Consequences
*   **Reduced Complexity:** Event Sourcing introduces extreme programming overhead (handling projections, read model replication, event schema versioning, and complex queries).
*   **Easier Maintenance:** Standard CRUD and relational logic is much easier to maintain, debug, and query using standard SQL.
*   **Clear Evolution:** Decoupling databases-per-service and using the Event Bus gives us all the scalability advantages of event-driven design without the complexity of event-sourcing engines.
