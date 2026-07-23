# ADR-003: Asynchronous Event Bus Architecture

## Status
Approved

## Context
In a microservices-based system, direct synchronous communications (HTTP/gRPC) can lead to tight coupling, cascaded service failures, high latencies, and hard synchronization bottlenecks. For example, when a video is imported, we must update metrics, update the roadmap, generate transcripts, index for search, and produce embeddings.

## Decision
We will use an **Asynchronous Event Bus** (initially Redis Pub/Sub / BullMQ in Docker Compose, transitioning to RabbitMQ or Apache Kafka in production) for all cross-service operations that do not require an immediate synchronous return payload.

## Consequences
* **Decoupled Services:** The Content Service does not need to know about the AI Service, Search Service, or Notification Service. It simply emits a `video.imported` event.
* **Fault Tolerance:** If the AI Service is down during a sync, the message broker retains the event until the service recovers.
* **Scalability:** Multiple consumers can subscribe to the same event, allowing independent scaling of background analysis workers.
* **Eventual Consistency:** System boundaries maintain consistency asynchronously, eliminating synchronous transactional locking.
