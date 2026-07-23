# ADR-012: Knowledge Graph Persistence Selection

## Status
Approved

## Context
The Public Portal (Phase 3) provides an interactive visual Knowledge Graph showing relationships between dynasties, locations, books, and videos. This requires a persistence model optimized for deep graph traversals.

## Decision
We will use **PostgreSQL with the Apache AGE** extension for early-phase graph persistence, maintaining a migration pathway to **Neo4j** if graph density scales past tens of thousands of deeply nested relationships in later phases.

## Consequences
*   **Unified Data Core:** Leverages existing PostgreSQL reliability, backups, and security policies.
*   **Cypher Query Support:** Apache AGE allows writing openCypher queries directly inside standard SQL commands.
*   **Low Operational Overhead:** Avoids managing a separate Neo4j cluster during initial development.
