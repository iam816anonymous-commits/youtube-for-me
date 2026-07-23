# ADR-005: Postgres pgvector Selection for Semantics

## Status
Approved

## Context
Phase 2 introduces deep semantic search, transcript analysis, and script-outline generation. This requires a vector database to store and query high-dimensional embeddings (e.g., 1536-dimensional OpenAI embeddings). We evaluated dedicated vector databases (Pinecone, Milvus, Qdrant) versus the `pgvector` extension for PostgreSQL.

## Decision
We will use the PostgreSQL **pgvector** extension for Phase 1 and Phase 2 semantic vector operations.

## Consequences
* **Reduced Infrastructure Complexity:** No need to provision, manage, monitor, and pay for an independent specialized database cluster.
* **Single-Query Hybrid Searches:** We can write standard SQL queries that join relational metadata (e.g., dynasty, author, civilization tables) and compute vector cosine similarity in a single transaction.
* **Production-Grade Indexing:** pgvector supports modern HNSW (Hierarchical Navigable Small World) and IVFFlat indexes, which deliver sub-100ms response times for large scale data.
* **Future Migration Pathway:** If dataset size eventually exceeds hundreds of millions of embeddings, we can migrate to a dedicated cluster without changing the core AI service business logic.
