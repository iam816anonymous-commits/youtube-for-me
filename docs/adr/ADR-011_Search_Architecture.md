# ADR-011: Hybrid Search Architecture Selection

## Status
Approved

## Context
Standard keyword search (BM25) fails to capture semantic meaning (context, synonyms), while pure vector search lacks exact keyword matching (for names, ISBNs, specific dates).

## Decision
We will build a **Hybrid Search Pipeline** combining keyword weightings with vector similarity rankings:
*   **Vector Search:** Calculated using `pgvector` with cosine similarity (`vector_cosine_ops`) over 1536-dimensional embeddings.
*   **Keyword Search:** Handled via standard PostgreSQL Full-Text Search configurations using GIN index structures.
*   **Ranking:** Results are fused using a **Reciprocal Rank Fusion (RRF)** scoring algorithm to yield the final relevance-ranked matching set.

## Consequences
*   Highly precise, context-aware queries that seamlessly handle both thematic exploration and exact-phrase retrieval.
*   Single-database architecture in early phases, avoiding the operational complexity of managing a separate Elastic/OpenSearch cluster until scaling demands it.
