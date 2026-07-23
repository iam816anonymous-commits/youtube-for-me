# ADR-006: API Communication Style Selection

## Status
Approved

## Context
A modern microservice architecture requires efficient, predictable, and scalable APIs. We evaluated REST, GraphQL, and gRPC patterns for external consumer client queries and internal inter-service synchronous calls.

## Decision
We will adopt a hybrid approach:
*   **External APIs:** RESTful JSON endpoints (documented via OpenAPI 3.1) routed through the API Gateway for both web client and integration plugins.
*   **Internal Synchronous Communications:** gRPC for high-performance, strongly typed synchronous queries between services.
*   **Asynchronous Communications:** Event Bus messaging (via RabbitMQ) for transactional side effects, background processing, and eventual consistency hooks.

## Consequences
*   Standardized and easily consumable external API interface.
*   Low latency, compressed payloads, and strict client contract validation internally (gRPC).
*   Eventual consistency modeling throughout long-running operations.
