# ADR-008: Progressive Container Platform Selection

## Status
Approved

## Context
Deploying multiple microservices, a database per service, a message broker, and routing gateways requires a standardized container orchestration strategy. We evaluated running raw binaries, deploying via Docker Compose, and deploying on Kubernetes (K8s).

## Decision
We will use **Docker Compose** for Phase 1 and Phase 2 development and initial single-admin production hosting, with a planned progressive migration to **Kubernetes** during Phase 3 and Phase 4.

## Consequences
*   **Minimal Initial Overhead:** No need to configure ingress controllers, Helm charts, pod disruption budgets, or storage classes on day one.
*   **Simple Local Replication:** Local developers can boot the entire stack with a single `docker compose up -d` command.
*   **Clean Migration Path:** Since each microservice is strictly containerized (packaged with a standard Dockerfile), migrating to Kubernetes later requires only writing Kubernetes manifest templates (YAML), keeping application code unchanged.
