# ADR-002: Relational PostgreSQL Engine Selection

## Status
Approved

## Context
The domain model of the Content Intelligence Platform contains highly structured, deeply interconnected relational entities (e.g., `Video` links to multiple `Series`, which links to `Roadmaps`, which map to physical `ResearchItems`, `Quotes`, `Civilizations`, and `Dynasties`). We evaluated MongoDB (document database) against PostgreSQL (relational database).

## Decision
We will use **PostgreSQL** as the primary relational database and persistence engine for the structured microservices (Identity, Content, Roadmap, Planner, and Knowledge).

## Consequences
* **Referential Integrity:** Native FOREIGN KEY constraints and transactional guarantees (ACID) prevent dangling links between videos, series, and research.
* **Complex Joins and Graph Traversals:** Built-in Common Table Expressions (CTEs) enable hierarchical roadmap and entity relationships.
* **Extensibility:** The PostgreSQL ecosystem natively supports vector data (`pgvector`) and graph processing (`Apache AGE`), allowing the team to defer expensive specialized databases until later stages.
* **Performance:** Highly optimized index structures (B-Tree, HNSW) for efficient retrieval.
