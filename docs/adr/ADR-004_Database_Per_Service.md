# ADR-004: Database-per-Service Architecture Pattern

## Status
Approved

## Context
When microservices share a single central database, they become tightly coupled at the data schema layer. Changes to one service's tables can break another service, and scaling database resources independently becomes impossible.

## Decision
We will enforce a strict **Database-per-Service** pattern. No microservice is permitted to access another service's database tables or direct database connections.

## Consequences
* **Absolute Domain Isolation:** Services interact strictly via defined API contracts or the Event Bus.
* **Technology Independence:** The Analytics service can use partitioned tables or TimescaleDB, while the Knowledge service uses `pgvector`, and other services use standard PostgreSQL.
* **Independent Scalability:** We can scale, backup, restore, or migrate the database of a single microservice without affecting other services.
* **Distributed Challenges:** Requires managing distributed data aggregation (solved via the Event Bus and local materialized caches or the Intelligence Layer).
