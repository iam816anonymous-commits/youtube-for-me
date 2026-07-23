# ADR-016: Service Discovery Strategy

## Status
Approved

## Context
In a distributed microservice network, individual services must know the network locations (IP and port) of other services to establish gRPC and HTTP connections. We evaluated hardcoded endpoints, Consul, and DNS-based service discovery.

## Decision
We will use:
*   **Phase 1 & 2 (Docker Compose):** Built-in **Docker DNS-based Service Discovery** where service names act as hostnames (e.g., `http://content-service:8080`).
*   **Phase 3 & 4 (Kubernetes):** Native **Kubernetes CoreDNS** service routing mechanisms.

## Consequences
*   No need to deploy or configure a dedicated service discovery cluster (e.g. Consul) in early phases.
*   Moving to Kubernetes in production works out-of-the-box by matching service names inside namespaces.
