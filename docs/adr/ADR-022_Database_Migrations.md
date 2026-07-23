# ADR-022: Automated Database Migration Selection

## Status
Approved

## Context
Manual database schema execution can lead to inconsistent database states between development, staging, and production environments. All database schema evolution must be versioned, automated, and audited.

## Decision
We will use automated migration engines integrated into our standard service pipelines:
*   **Node.js / TypeScript Services:** Prisma Migrate or Knex Migrations.
*   **Go Services:** `golang-migrate` or Goose.
*   **Java / Kotlin Services:** Liquibase or Flyway.

## Rules for Migrations
*   Migrations must be written inside the service repository and executed automatically during service container initialization before the application starts up.
*   Manual SQL updates to production tables are strictly prohibited.
