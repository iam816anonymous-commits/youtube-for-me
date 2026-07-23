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
* **Multi-tenant Readiness & Default Tenant Strategy:** Every persistence layer schema integrates `tenant_id` partitions, ensuring frictionless transformation to a multi-user SaaS structure. However, to prevent overengineering during Phase 1 (Single Admin), all client queries and transactions default to a hardcoded default tenant UUID context (`00000000-0000-0000-0000-000000000000`). Switch, management, team collaboration, and billing logics are completely deferred until Phase 4.
* **Intelligence Decision Engine Pipeline:** Rather than executing simple AI prompts, a dedicated **Intelligence Service** manages an structured active Reasoning Pipeline to formulate business recommendations (Analytics -> Recommendation Pipeline -> Priority Engine -> Gap Analysis -> Content Opportunity -> Roadmap Ranking -> Dashboard).

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
        │       │       │       │       │       │       │       │       │       │       │
        ▼       ▼       ▼       ▼       ▼       ▼       ▼       ▼       ▼       ▼       ▼
   [Content][Roadmap][Planner][Analytics][Knowl][Search][AI-Svc][Intel][Graph][Lake][Integr]
        │       │       │       │       │       │       │       │       │       │       │
        ▼       ▼       ▼       ▼       ▼       ▼       ▼       ▼       ▼       ▼       ▼
   ┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐
   │Postgre││Postgre││Postgre││Postgre││Postgre││Postgre││Postgre││Postgre││Postgre││Postgre│
   │ (SQL) ││ (SQL) ││ (SQL) ││(Part) ││+vctor ││+vctor ││(Cache)││ (SQL) ││(Graph)││ (Lake)│
   └───────┘└───────┘└───────┘└───────┘└───────┘└───────┘└───────┘└───────┘└───────┘└───────┘
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

### 3.3 Intelligence Decision Engine Pipeline
How the Intelligence Service executes the detailed analytical reasoning pipeline to guide the creator.

```text
Analytics Store ──► Recommendation Pipeline ──► Priority Engine ──► Gap Analysis ──► Content Opportunity ──► Roadmap Ranking ──► Dashboard UI
```

1.  **Analytics Store Data Fetch:** Queries raw view durations, engagement ratios, and topic coverage maps.
2.  **Recommendation Pipeline Generation:** Formulates a set of prospective scripts.
3.  **Priority Engine Sorting:** Weighs current roadmap commitments, seasonally scheduled markers, and deadlines.
4.  **Gap Analysis:** Calculates content pillars falling below the targeted coverage threshold (e.g., Temple Heritage at 82% vs Ancient Wisdom at 11%).
5.  **Content Opportunity Selection:** Pinpoints specific high-confidence topics (e.g. recommending "Continue Ancient Wisdom" script outlines).
6.  **Roadmap Ranking Mapping:** Reranks active backlog planning timelines.
7.  **Dashboard Visual Sync:** Updates the workspace quick-actions card panel.

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
│   ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐                       │
│   │Intelligence Service││Knowledge Graph Svc│ │Integration Service│                       │
│   └───────────────────┘ └───────────────────┘ └───────────────────┘                       │
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

### 4.1 Integration Service
*   **Purpose:** Standardizes all third-party integrations (Notion repositories, Obsidian files, Google Drive, Google Books API, Wikipedia, etc.).
*   **Reason for Separation:** Prevents core Content and Knowledge services from containing external platform-specific libraries or hardcoded HTTP connectors, implementing a standardized plugin strategy interface.

### 4.2 Content Service
*   **Purpose:** Governs standard video nodes, series lists, titles, and playlists structures.
*   **Persistence:** PostgreSQL.

### 4.3 Roadmap Service
*   **Purpose:** Governs strategic user goals, target quarters, milestone track progression, and release schedules.
*   **Persistence:** PostgreSQL.

### 4.4 Planner Service
*   **Purpose:** Manages operational task details, kanban pipelines, calendars, deadlines, and task dependency graphs.
*   **Persistence:** PostgreSQL.

### 4.5 Knowledge Graph Service
*   **Purpose:** Orchestrates high-performance graph connections between entities (`Person`, `Dynasty`, `Civilization`, `Location`) and corresponding historical references.
*   **Technology Choice:** PostgreSQL with the **Apache AGE** extension.

### 4.6 AI Service
*   **Purpose:** Computes raw vector embeddings, processes transcription requests, and translates raw scripts.
*   **Persistence:** Redis Cache.

### 4.7 Intelligence Service (The Reasoning Engine)
*   **Purpose:** Runs the active decision-making pipelines, performing Gap Analysis and Content Opportunity ranking.
*   **Persistence:** PostgreSQL.

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
│                  Intelligence Reasoning Service                │
│  - Formulates active roadmap recommendations                   │
│  - Analyzes high-performing historical hooks                   │
│  - Computes content gaps and suggests next scripts             │
└────────────────────────────────────────────────────────────────┘
```

---

## 6. Observability, Security, & Architecture Decisions

Refer to the official Architecture Decision Records (ADR-001 through ADR-024) for extensive analysis on framework, persistence, messaging, and database topology choices. Full monitoring is backed by Prometheus for metrics scraping, Grafana dashboards, Jaeger tracing context, and Sentry for real-time frontend exceptions tracking.
