# Software Architecture Document (SAD)
## For Content Intelligence Platform (CIP)

---

## 1. Architectural Style & Design Principles

The Content Intelligence Platform (CIP) is designed as a modular, **Event-Driven Microservices Architecture** based on the principles of **Domain-Driven Design (DDD)** and organized through the **C4 model representation**.

### 1.1 Core Architectural Principles
* **Loose Coupling:** Individual microservices possess distinct responsibilities and have zero direct access to foreign databases (the **Database-per-Service** pattern).
* **Asynchronous Event-Driven Messaging:** Long-running, multi-domain interactions (such as video imports triggering AI categorization, semantic embedding creation, and index updates) are coordinated via an asynchronous **Event Bus**.
* **API Gateway Pattern:** External client layers (Admin Dashboard and Public Portal) interface exclusively with a unified **API Gateway**, obscuring the underlying service network layout and providing a single entry point for routing, authentication, and rate limiting.
* **CQRS (Command Query Responsibility Segregation) Readiness:** Database architectures segregate state-mutating actions (e.g., adding research items, modifying video status) from intensive read actions (e.g., pulling metrics dashboard matrices or querying semantic vectors) to optimize scale and performance.
* **Multi-tenant Readiness:** Every persistence layer schema integrates `tenant_id` partitions, ensuring frictionless transformation to a multi-user SaaS structure without architectural redesign.
* **Intelligence Reasoning Layer:** Rather than simple CRUD operations over database entries, a dedicated intelligence reasoning layer exists to consume events and aggregate metrics, answering strategic questions such as what content should be created next or which roadmap pillars are falling behind.

---

## 2. C4 Model Architecture

### 2.1 Level 1: System Context Diagram
The System Context Diagram shows how the Content Intelligence Platform interfaces with external actors, Google ecosystems, and LLM services.

```text
┌────────────────────────┐           ┌─────────────────────────────────────────────────┐
│     Content Creator    │           │                  Google YouTube                 │
│      (Admin User)      │           │              (OAuth 2.0 / Data API)             │
└───────────┬────────────┘           └────────────────────────┬────────────────────────┘
            │                                                 ▲
            │ (HTTPS)                                         │ (API Requests / Sync)
            ▼                                                 ▼
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                      Content Intelligence Platform (CIP) System                      │
│                                                                                      │
│   Provides centralized planning, metrics analysis, deep research indexing,            │
│   semantic AI script assistance, and interactive audience visualizations.            │
└───────────────────┬─────────────────────────────────────────┬────────────────────────┘
                    │                                         │
                    │ (Vector/LLM Queries)                    │ (HTTPS / Public Reads)
                    ▼                                         ▼
┌────────────────────────┐                            ┌────────────────────────┐
│     OpenAI / Anthropic │                            │     Public Visitor     │
│       (LLM Providers)  │                            │     (Audience User)    │
└────────────────────────┘                            └────────────────────────┘
```

### 2.2 Level 2: Container Diagram
The Container Diagram expands the CIP System, illustrating the frontends, API Gateway, individual Microservices, the Event Bus, and their dedicated storage containers.

```text
                                  Internet
                                     │
                                     ▼
                     ┌───────────────────────────────┐
                     │     Kong API Gateway (Proxy)  │
                     └───────┬───────────────┬───────┘
                             │               │
                             ▼               ▼
         ┌───────────────────────────────────────────────────────┐
         │       Next.js Web Frontend Container Applications     │
         │  - Admin Workspace Component                          │
         │  - Audience Public Portal Component                   │
         └───────────┬───────────────────────────────┬───────────┘
                     │                               │
                     ▼                               ▼
     ┌───────────────────────────────┐ ┌───────────────────────────────┐
     │   Identity Service Container  │ │   Public Portal Service       │
     │   - Node.js / Go (OAuth / JWT)│ │   - Node.js / SSR Reader API  │
     └───────────────┬───────────────┘ └───────────────┬───────────────┘
                     │                               │
                     ▼                               ▼
       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ Event Bus (RabbitMQ) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        │           │           │           │           │           │           │
        ▼           ▼           ▼           ▼           ▼           ▼           ▼
   [Content]    [Roadmap]   [Planner]  [Analytics] [Knowledge]     [AI]    [Search]
    Service      Service     Service     Service     Service     Service    Service
        │           │           │           │           │           │           │
        ▼           ▼           ▼           ▼           ▼           ▼           ▼
   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
   │Postgres │ │Postgres │ │Postgres │ │Postgres │ │Postgres │ │Postgres │ │Postgres │
   │  (SQL)  │ │  (SQL)  │ │  (SQL)  │ │(Part'd) │ │+pgvector│ │ (Cache) │ │+pgvector│
   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

### 2.3 Level 3: Component Diagram (Content & Roadmap Services)
Focusing on the internal components of the **Content Service** and **Roadmap Service** showing boundaries.

```text
                           API Gateway Requests
                                    │
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │                 Content Service (REST)                  │
       │                                                         │
       │  ┌───────────────────────┐   ┌────────────────────────┐ │
       │  │    Video Controller   │   │   Series Controller    │ │
       │  └───────────┬───────────┘   └───────────┬────────────┘ │
       │              ▼                           ▼              │
       │  ┌───────────────────────┐   ┌────────────────────────┐ │
       │  │   Video Domain Logic  │   │   Series Domain Logic  │ │
       │  └───────────┬───────────┘   └───────────┬────────────┘ │
       │              ▼                           ▼              │
       │  ┌────────────────────────────────────────────────────┐ │
       │  │         Content Database Repository (SQL)          │ │
       │  └────────────────────────────────────────────────────┘ │
       └────────────────────────────┬────────────────────────────┘
                                    │ Emits events
                                    ▼
       ┌─────────────────────────────────────────────────────────┐
       │                Roadmap Service (REST)                   │
       │                                                         │
       │  ┌───────────────────────┐   ┌────────────────────────┐ │
       │  │   Roadmap Controller  │   │  Milestone Controller  │ │
       │  └───────────┬───────────┘   └───────────┬────────────┘ │
       │              ▼                           ▼              │
       │  ┌───────────────────────┐   ┌────────────────────────┐ │
       │  │  Roadmap Domain Logic │   │  Milestone Domain Logic│ │
       │  └───────────┬───────────┘   └───────────┬────────────┘ │
       │              ▼                           ▼              │
       │  ┌────────────────────────────────────────────────────┐ │
       │  │         Roadmap Database Repository (SQL)          │ │
       │  └────────────────────────────────────────────────────┘ │
       └─────────────────────────────────────────────────────────┘
```

---

## 3. Core System Workflows (Sequence Diagrams)

### 3.1 Admin Login Sequence
How an administrator authenticates via Google OAuth, registers, and obtains a secure JWT session.

```text
Browser               Gateway                Identity Service               Google OAuth
   │                     │                          │                             │
   │─── 1. Login ────────►                          │                             │
   │                     │─── 2. Redirect URL ─────►│                             │
   │                     │◄── 3. Return URL ────────│                             │
   │◄── 4. Redirect ─────│                          │                             │
   │                                                                              │
   │─── 5. Authenticate with Google ─────────────────────────────────────────────►│
   │◄── 6. Return Auth Code ──────────────────────────────────────────────────────│
   │
   │─── 7. Submit Code ──►                          │                             │
   │                     │─── 8. Exchange Code ────►│                             │
   │                     │                          │─── 9. Exchange for Profile ►│
   │                     │                          │◄── 10. Return Profile ──────│
   │                     │                          │                             │
   │                     │                          │─── 11. Create/Find User ────┐
   │                     │                          │◄────────────────────────────┘
   │                     │                          │
   │                     │                          │─── 12. Sign JWT ────────────┐
   │                     │                          │◄────────────────────────────┘
   │                     │◄── 13. Return JWT Token ─│
   │◄── 14. Set Cookie ──│
```

### 3.2 Video Synchronization, AI Embedding, & Search Index Pipeline
The asynchronous event pipeline triggered when a new video is discovered on YouTube.

```text
YT-Sync-Worker          Event Bus          Content Service          AI Service          Search Service
      │                     │                     │                     │                     │
      │── 1. Video Found ──►│                     │                     │                     │
      │                     │── 2. Import Video ─►│                     │                     │
      │                     │                     │── 3. Persist SQL ──┐│                     │
      │                     │                     │◄───────────────────┘│                     │
      │                     │◄─ 4. Emit Imported ─│                     │                     │
      │                     │                     │                     │                     │
      │                     │── 5. Notify Imported ────────────────────►│                     │
      │                     │                                           │── 6. Get Transcrpt ─┐
      │                     │                                           │◄────────────────────┘
      │                     │                                           │
      │                     │                                           │── 7. Call LLM Embed ┐
      │                     │                                           │◄────────────────────┘
      │                     │                                           │
      │                     │◄── 8. Emit Embedding Generated ───────────│                     │
      │                     │                                                                 │
      │                     │── 9. Notify Index Update ──────────────────────────────────────►│
      │                     │                                                                 │── 10. Index Vector
```

### 3.3 Intelligence & Recommendation Pipeline
How the Intelligence Layer synthesizes analytical and knowledge markers to offer active visual recommendations.

```text
Browser                 Gateway              Intelligence Layer             Analytics             Roadmap
   │                       │                         │                          │                    │
   │── 1. Get Recommend ──►│                         │                          │                    │
   │                       │── 2. Run Assessment ───►│                          │                    │
   │                       │                         │── 3. Query Snapshots ───►│                    │
   │                       │                         │◄─ 4. Return Views/Ret ───│                    │
   │                       │                         │                                               │
   │                       │                         │── 5. Query Goals ────────────────────────────►│
   │                       │                         │◄─ 6. Return Deadlines ────────────────────────│
   │                       │                         │
   │                       │                         │── 7. Evaluate Performance ──┐
   │                       │                         │◄────────────────────────────┘
   │                       │                         │
   │                       │                         │── 8. Cache Results ─────────┐
   │                       │                         │◄────────────────────────────┘
   │                       │◄─ 9. JSON Payload ──────│
   │◄─ 10. Render Cards ───│
```

---

## 4. Deconstructed Microservices Boundaries

To ensure absolute system cohesion and prevent future overengineering, the platform's services are defined as follows:

```text
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                  PRESENTATION LAYER                                       │
│                Next.js Admin Workspace  │  Next.js Public Portal Component                │
└─────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                    API GATEWAY                                            │
│                       Kong API Routing and Policy Gateway (TLS/JWT)                       │
└─────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                    MICROSERVICES LAYER                                    │
│   ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐ │
│   │ Identity Service  │ │  Content Service  │ │  Roadmap Service  │ │  Planner Service  │ │
│   └───────────────────┘ └───────────────────┘ └───────────────────┘ └───────────────────┘ │
│   ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐ │
│   │ Analytics Service │ │ Knowledge Service │ │    AI Service     │ │  Search Service   │ │
│   └───────────────────┘ └───────────────────┘ └───────────────────┘ └───────────────────┘ │
│   ┌───────────────────┐ ┌───────────────────┐                                             │
│   │ Recommendation Svc│ │ Knowledge Graph   │                                             │
│   └───────────────────┘ └───────────────────┘                                             │
└─────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                     EVENT BUS LAYER                                       │
│                       RabbitMQ Event Broker / Redis Queue Network                         │
└─────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                          ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                     DATA LAKE LAYER                                       │
│                  Raw Data Ingestion Buffer  │  Normalized Analytical Stores               │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Roadmap Service
*   **Purpose:** Governs strategic user tracks, timelines, milestone tracking, and long-term release frameworks.
*   **Reason for Separation:** Isolates pure metadata planning structures from physical video file processing or playlist mutations.

### 4.2 Planner Service
*   **Purpose:** Manages Kanban workflows, task items, task execution deadlines, creator calendars, and task dependency graphs.
*   **Reason for Separation:** The planning aspect of creator workflows (e.g., scripting task assigned, thumbnail review task) is fundamentally distinct from public video metadata entities.

### 4.3 Knowledge Graph Service
*   **Purpose:** Orchestrates high-performance graph connections between entities (`Person`, `Dynasty`, `Civilization`, `Location`) and corresponding historical references.
*   **Technology Choice:** PostgreSQL with the **Apache AGE** extension or Neo4j to allow complex graph queries and traversal patterns.

### 4.4 Recommendation Engine Service
*   **Purpose:** Evaluates analytics performance gaps, roadmap progress rates, and viewer questions to actively recommend script topics, seasonal release timings, and content pillars.
*   **Reason for Separation:** Decoupled from core analytical calculations to allow rapid iteration on optimization models without risking service downtime.

### 4.5 Data Lake & Ingestion Layer
*   **Purpose:** Stores immutable, chronological raw records returned from the YouTube API prior to database normalization.
*   **Reason for Separation:** Preserves raw, historical data patterns forever (allowing future deep analytics queries or ML model training) without polluting the transactional database schemas.

### 4.6 Plugin Architecture & Integrations Gateway
*   **Purpose:** Standardizes how external tools (Notion, Obsidian, Google Drive, Google Books API, Wikipedia, Substack, Twitter/X) interface with the platform via generic plugin contracts.
*   **Design Pattern:** Strategy design pattern where each integration implements a common Interface contract (`IIntegrationPlugin`), ensuring no hardcoded service connections exist.

---

## 5. Bounded Context Relationships

```text
┌────────────────────────┐              ┌────────────────────────┐
│    Identity Context    │              │    Content Context     │
└───────────┬────────────┘              └───────────┬────────────┘
            │                                       │
            │ (Secures APIs)                        │ (Publishes Videos)
            ▼                                       ▼
┌────────────────────────┐              ┌────────────────────────┐
│   Knowledge Context    │◄────────────►│   Analytics Context    │
└───────────┬────────────┘              └───────────┬────────────┘
            │                                       │
            │ (Contextual Entities)                 │ (Historical Metrics)
            ▼                                       ▼
┌────────────────────────────────────────────────────────────────┘
│                  Intelligence Reasoning Layer                  │
│  - Formulates active roadmap recommendations                   │
│  - Analyzes high-performing historical hooks                   │
│  - Computes content gaps and suggests next scripts             │
└────────────────────────────────────────────────────────────────┘
```

---

## 6. Observability, Security, & Architecture Decisions

Refer to the official Architecture Decision Records (ADR-001 through ADR-005) for extensive analysis on framework, persistence, messaging, and database topology choices. Full monitoring is backed by Prometheus for metrics scraping, Grafana dashboards, Jaeger tracing context, and Sentry for real-time frontend exceptions tracking.
