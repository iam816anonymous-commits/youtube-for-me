# ADR-018: Event Schema Registry Strategy

## Status
Approved

## Context
When microservices publish events over the Event Bus, changes to the event payload schema can break down-stream consumers. We need to guarantee schema validation and enforce backward compatibility.

## Decision
We will enforce an **Event Schema Registry** model:
*   All events must follow a standardized envelope structure containing metadata (UUID, Version, Timestamp, Tenant ID) and a defined payload body.
*   Every schema is versioned (e.g., `v1.0.0`, `v2.0.0`).
*   In early phases, schemas will be managed as shared JSON Schema files in the documentation/protobuf directory.
*   In later stages, we will migrate to a dedicated schema registry (e.g. Apicurio or Confluent) to enforce runtime schema verification.

## Consequences
*   Prevents silent failures on consumer services when publishers update payloads.
*   Simplifies generation of typescript and Go models directly from JSON schemas.
