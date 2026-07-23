# ADR-001: Next.js Frontend Framework Selection

## Status
Approved

## Context
The Content Intelligence Platform (CIP) requires a highly responsive, interactive, and visually rich user interface for the Admin Command Center (Phase 1) and the Public Portal (Phases 2 & 3). The team considered split architectural configurations (e.g., separate Single Page Applications using React/Vite paired with independent backend proxies) versus a modern meta-framework approach using Next.js.

## Decision
We will use **Next.js** as the core web application framework for both the Admin Workspace and the Public Portal.

## Consequences
* **Unified Development Experience:** Developers use a single codebase, language, and deployment pipeline for both frontend UI components and server-side operations (SSR / ISR).
* **Hybrid Rendering:** Public Portal (Phase 3) benefits from high-performance Server-Side Rendering (SSR) and Incremental Static Regeneration (ISR) to optimize Core Web Vitals and SEO.
* **Serverless and Edge Readiness:** Out-of-the-box support for serverless execution and edge caching networks ensures scalability.
* **API Routes & Gateway Proxying:** Next.js API Routes will act as a lightweight middleware proxy layer routing requests cleanly to the backend API Gateway.
