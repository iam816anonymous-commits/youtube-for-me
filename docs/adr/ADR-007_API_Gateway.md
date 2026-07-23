# ADR-007: API Gateway Solution Selection

## Status
Approved

## Context
Microservices need a central gateway proxy that acts as a single point of entry, routing requests, offloading authentication (JWT verification), enforcing rate limits, and implementing TLS Termination. We evaluated Kong, Traefik, Envoy, and NGINX.

## Decision
We will use **Kong API Gateway** (community edition initially) built on top of NGINX.

## Consequences
*   **High Performance:** Sub-millisecond routing latency, extremely low overhead.
*   **Extensible Plugin Ecosystem:** Ready-to-use plug-ins for JWT verification, rate-limiting, CORS control, and Prometheus logging.
*   **Declarative Configuration:** Can be configured easily using declarative YAML files, fitting perfectly with our DevOps / Docker-based environment.
*   **Future SaaS scaling:** Naturally routes multitenant request contexts based on domain paths or headers.
