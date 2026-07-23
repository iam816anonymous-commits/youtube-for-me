# ADR-015: File Storage Solution Selection

## Status
Approved

## Context
The platform must store and serve physical assets including PDFs, research papers, custom script drafts, thumbnail mockups, and exported transcripts.

## Decision
We will use **MinIO** (S3-compatible object storage) running inside our local Docker Compose environment, migrating to **Amazon S3** or **Supabase Storage** for production environments.

## Consequences
*   Standardized S3 API calls implemented inside the backend services.
*   Zero reliance on local container filesystems, ensuring services remain completely stateless.
*   Frictionless deployment migration to commercial cloud buckets (S3) by modifying endpoint configurations.
