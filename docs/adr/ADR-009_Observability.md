# ADR-009: Observability Suite Selection

## Status
Approved

## Context
Operating multiple decoupled microservices introduces distributed tracing and log collation challenges. When an error occurs, we must trace it across the entire stack.

## Decision
We will standardize on a unified LGTM stack paired with OpenTelemetry:
*   **Metrics:** Prometheus for scraping service `/metrics` endpoints.
*   **Dashboards:** Grafana for visualizing system metrics.
*   **Logs:** Loki for centralized log collation from Docker containers.
*   **Traces:** Jaeger / Tempo for distributed transaction tracing using W3C Trace Context headers.
*   **Instrumentation:** OpenTelemetry libraries integrated into each microservice.

## Consequences
*   Sub-millisecond latency issues can be traced down to specific SQL statements across services.
*   Standardized metrics and logs format across all services.
*   Prometheus targets can be monitored easily, raising automated alerts if a health endpoint fails.
