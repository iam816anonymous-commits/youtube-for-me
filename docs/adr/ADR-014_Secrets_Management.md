# ADR-014: Secrets Management Framework

## Status
Approved

## Context
Hardcoded credentials (API keys, database passwords, OAuth secrets) pose a severe security threat. We must prevent them from being committed to the codebase.

## Decision
We will use **Environment Variables** loaded into the Docker container context during Phase 1 and 2, migrating to **HashiCorp Vault** or **AWS Secrets Manager** in Phase 3 and 4 production environments.

## Consequences
*   Zero credentials are committed to version control.
*   System administrators can rotate secrets without altering container code.
*   Standardized `.env.example` configurations provided across all services to guide development.
