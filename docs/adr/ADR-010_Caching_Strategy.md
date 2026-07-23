# ADR-010: Centralized Caching Strategy

## Status
Approved

## Context
Executing repeated database operations, complex vector embeddings lookups, and token validation checks can slow down the system and stress database nodes.

## Decision
We will use **Redis** as a unified distributed cache and session store.

## Rules for Caching
*   **Active OAuth Sessions & JWT Blacklists:** Cached with a strict 15-minute TTL to match token lifespan.
*   **Analytics Aggregate Performance Metrics:** Daily snapshots cached with a 6-hour TTL (refreshed during YouTube synchronization events).
*   **Semantic Search Vector Embeddings:** High-frequency query matches cached with a 1-hour TTL.
*   **AI Generated Script Outlines:** Cached with a 24-hour TTL, explicitly invalidated when the corresponding draft script is modified.

## Invalidation Rules
Write operations to a resource **shall** trigger an immediate cache invalidation event over the Event Bus, maintaining consistency across cache clusters.
