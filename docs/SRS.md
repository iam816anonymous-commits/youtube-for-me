# Software Requirements Specification (SRS)
## For Content Intelligence Platform (CIP)

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) establishes the complete, authoritative set of functional, non-functional, and interface requirements for the **Content Intelligence Platform (CIP)**. Designed to serve as a comprehensive roadmap, this document provides deep detail on system behaviors, data constraints, architectural expectations, and security compliance rules. It serves as the primary reference for developers, engineers, and quality assurance personnel across all development phases.

### 1.2 Scope
CIP is a multi-tier, microservice-based content planning, optimization, and intelligence ecosystem.
* **Phase 1** restricts administrative capabilities to a **Single Admin (the Creator)** to ensure simple operational scope without overengineering.
* **Phase 2** integrates a deep Knowledge Vault and semantic AI pipeline.
* **Phase 3** introduces a read-only, high-performance public portal allowing the audience to view structured roadmaps and historical articles.
* **Phase 4** extends the codebase into a SaaS multi-tenant platform.

This specification covers the software elements deployed in Docker environments, comprising an API Gateway, an Identity service, a YouTube Synchronization engine, a content engine, an Analytics processor, a Knowledge repository, an AI-pipeline service, and a Search cluster.

### 1.3 Definitions, Acronyms, and Abbreviations
* **CIP:** Content Intelligence Platform.
* **SRS:** Software Requirements Specification.
* **SAD:** Software Architecture Document.
* **DDD:** Domain-Driven Design.
* **OAuth 2.0:** Open Authorization protocol standard.
* **JWT:** JSON Web Token used for claims-based stateless sessions.
* **RBAC:** Role-Based Access Control.
* **SaaS:** Software as a Service.
* **API:** Application Programming Interface.
* **CRUD:** Create, Read, Update, and Delete operations.
* **pgvector:** PostgreSQL extension enabling high-performance vector operations and semantic index creation.
* **LLM:** Large Language Model.

### 1.4 References
1. *IEEE Std 830-1998, IEEE Recommended Practice for Software Requirements Specifications*.
2. *Domain-Driven Design: Tackling Complexity in the Heart of Software*, Eric Evans.
3. *OAuth 2.0 Authorization Framework (RFC 6749)*.
4. *PostgreSQL pgvector Documentation and Best Practices*.

---

## 2. Overall Description

### 2.1 Product Perspective
CIP is an autonomous platform that integrates with YouTube APIs, local file storages, and LLM providers. It does not replace native editing or uploading applications but serves as the master brain orchestrating content scheduling, historical analytics tracking, AI-powered scripting help, and semantic citation management.

```text
  ┌────────────────────────────────────────────────────────┐
  │                   Content Creator                      │
  └──────────────────────────┬─────────────────────────────┘
                             │ (HTTPS / GraphQL / REST)
                             ▼
  ┌────────────────────────────────────────────────────────┐
  │                 CIP API Gateway (Kong)                 │
  └──────────┬───────────────────────────────┬─────────────┘
             │                               │
             ▼                               ▼
  ┌──────────────────────┐        ┌────────────────────────┐
  │   Identity Service   │        │  Microservices (Event) │
  └──────────────────────┘        └────────────────────────┘
```

### 2.2 Product Functions
Major functions executed by the CIP:
1. **Identity & Security:** Google OAuth single-sign-on (SSO), JWT issuance, secure token rotation, and RBAC enforcement.
2. **YouTube Orchestration & Synchronizer:** Syncs subscriber growth, video metrics, playlists, and viewer retention logs automatically.
3. **Roadmap & Series Planner:** Manages video lifecycle transitions, milestone dates, and visual content pipelines.
4. **Knowledge Asset Vault:** Archives books, citation notes, locations, historical civilizations, dynasties, and raw transcripts.
5. **Generative & Semantic AI Pipelines:** Creates script outlines, extracts key themes, and embeds textual items into vector space.
6. **Unified Search Infrastructure:** Executes instant vector semantic searches and exact keyword filtering across all knowledge and content databases.

### 2.3 User Classes and Characteristics
* **Administrator (Creator):** Has absolute read/write access across all microservices, domain nodes, analytics sheets, and configuration panels.
* **Public Visitor (Audience - Phase 3):** Read-only explorer. Accesses authorized published videos, series tracks, public bibliographies, and the visual public Knowledge Graph.
* **SaaS Tenant Admin (Phase 4):** Isolated controller who manages a distinct brand identity, team collaborators, and dedicated data parameters.

### 2.4 Design and Implementation Constraints
1. **Strict Data Ownership:** No microservice is permitted to access another service's database directly. All cross-boundary communications must occur via REST/gRPC or asynchronous events.
2. **Local Deployability:** Must run seamlessly inside Docker Compose for developer convenience and low Phase 1 hosting cost.
3. **Schema Multi-Tenant Readiness:** All database schemas must include `tenant_id` UUID columns or use isolated database schema configurations to guarantee simple SaaS upgrade paths.

### 2.5 Assumptions and Dependencies
* Google's YouTube Data API and OAuth services are fully operational and maintain standard backward compatibility.
* Local PostgreSQL database runs with pgvector pre-installed.
* External LLM endpoints (e.g., OpenAI or Anthropic) are accessible over standard HTTPS channels.

---

## 3. Functional Requirements

### 3.1 Module 1: Identity & Authentication (ID-FR)
* **ID-FR-001:** The system **shall** authenticate the Admin using Google OAuth 2.0 protocol.
* **ID-FR-002:** The Identity Service **shall** generate cryptographically secure JSON Web Tokens (JWT) containing user ID, roles, email, and signature claims.
* **ID-FR-003:** Access tokens **shall** expire after 15 minutes, and refresh tokens **shall** expire after 7 days.
* **ID-FR-004:** Refresh tokens **shall** be stored securely in the database and invalidated upon user logout or token rotation breach detection.
* **ID-FR-005:** The system **shall** enforce Role-Based Access Control (RBAC), verifying role scopes for every gateway-routed API request.
* **ID-FR-006:** The Identity Service **shall** log all authentication attempts, indicating IP address, user agent, timestamps, and outcome status.

### 3.2 Module 2: YouTube Integration & Synchronizer (YT-FR)
* **YT-FR-001:** The synchronizer **shall** execute automated video and channel metadata updates every six (6) hours.
* **YT-FR-002:** The system **shall** allow the admin to trigger manual YouTube synchronizations via the management UI dashboard.
* **YT-FR-003:** The synchronizer **shall** pull video lists, play metrics, subscriber details, historical view counts, and absolute watch times.
* **YT-FR-004:** The synchronizer **shall** download and store second-by-second viewer retention profiles (retention curve data arrays) for each published video.
* **YT-FR-005:** The system **shall** fetch comment feeds, classify them by sentiment (Positive, Neutral, Negative), and isolate high-priority questions.
* **YT-FR-006:** The synchronizer **shall** gracefully handle YouTube API rate limit quotas (HTTP 403 / 429) using exponential backoff retry algorithms.

### 3.3 Module 3: Content & Roadmap Management (CT-FR)
* **CT-FR-001:** The system **shall** allow the Admin to create, read, update, and delete (CRUD) `Video` records, `Series` tracks, and `Roadmap` definitions.
* **CT-FR-002:** The system **shall** restrict state transitions of a video node to defined workflow steps: `Ideation`, `Research`, `Scripting`, `Recording`, `Editing`, `Scheduled`, `Published`.
* **CT-FR-003:** When a video transitions to `Published`, the Content Service **shall** emit a `video.published` event to the Event Bus.
* **CT-FR-004:** The system **shall** allow a `Video` record to link to multiple `Series` nodes or nested `Roadmap` groups.
* **CT-FR-005:** The Admin **shall** be able to assign concrete target deadlines and milestone markers to individual `Roadmap` nodes.

### 3.4 Module 4: Analytics Engine (AN-FR)
* **AN-FR-001:** The Analytics Service **shall** generate and store daily aggregate snapshots of view counts, watch times, subscriber gains, and average CTR.
* **AN-FR-002:** The system **shall** calculate and return rolling 7-day, 30-day, and 365-day performance trends for any specified content piece.
* **AN-FR-003:** The system **shall** identify "Retention Hooks"—defined as periods where the retention percentage remains flat or increases—and flag them for creative review.
* **AN-FR-004:** The engine **shall** produce structured data formats suitable for charting libraries (Line, Bar, and Doughnut charts) representing user activity.

### 3.5 Module 5: Knowledge Vault & Repository (KN-FR)
* **KN-FR-001:** The system **shall** manage structured records of external references: `Books`, `Articles`, `Research Notes`, `Quotes`, and `Transcripts`.
* **KN-FR-002:** The database schema **shall** allow notes or quotes to link with cultural/historical tags, including `Dynasty`, `Civilization`, `Location`, and `Person`.
* **KN-FR-003:** The system **shall** support uploading and parsing textual documents (including TXT, Markdown, and PDF formats) into the research database.
* **KN-FR-004:** The database **shall** link quotes and citation snippets to specific page ranges or timestamps within associated reference sources.

### 3.6 Module 6: Artificial Intelligence & Semantics (AI-FR)
* **AI-FR-001:** The AI Service **shall** generate vector embeddings (minimum 1536 dimensions) for all newly created research notes, book outlines, and video scripts.
* **AI-FR-002:** The system **shall** automatically analyze transcripts to extract core topics, naming conventions, and recommended catalog tags.
* **AI-FR-003:** The system **shall** classify incoming content concepts into relevant Roadmap categories using LLM classifications.
* **AI-FR-004:** The AI script-generation engine **shall** create organized script outlines utilizing selected books, research notes, and historical quotes as references.
* **AI-FR-005:** The AI Service **shall** support semantic-proximity queries, ranking stored vector embeddings using cosine similarity algorithms.

### 3.7 Module 7: Unified Search Engine (SR-FR)
* **SR-FR-001:** The system **shall** support full-text keyword searches across all videos, series titles, quotes, notes, and PDF indexes.
* **SR-FR-002:** The search engine **shall** accept vector input queries to execute hybrid search patterns combining semantic relevance scores with exact keyword weights.
* **SR-FR-003:** The engine **shall** support real-time category, tag, date, and civilization filtering on active search queries.
* **SR-FR-004:** The search portal **shall** return query matches in under 150 milliseconds for database sizes of up to 500,000 document slices.

### 3.8 Module 8: Public Portal (PB-FR)
* **PB-FR-001:** The system **shall** serve a read-only, public-facing portal that displays content explicitly flagged as `is_public=true` by the Admin.
* **PB-FR-002:** The public portal **shall** expose searchable lists of published video entries, research bibliographies, and series.
* **PB-FR-003:** The public client **shall** load and display an interactive, SVG-rendered or WebGL-rendered Knowledge Graph mapping connection links between videos, books, and civilization nodes.
* **PB-FR-004:** The public portal **shall** remain isolated from any write APIs, blocking all modifications unless certified via admin API keys.

---

## 4. Non-Functional Requirements

### 4.1 Performance Requirements
* **Response Latency:** 95% of standard read API queries routed through the API Gateway shall respond in under 100ms.
* **Data Refresh Synchronization:** Automatic YouTube sync routines must terminate within 10 minutes of initial execution.
* **Concurrent Users (Phase 3 Portal):** The system shall scale horizontally to support up to 5,000 simultaneous connections without performance degradation.

### 4.2 Security Requirements
* **TLS Encryption:** All active HTTP connections shall require TLS 1.3 encryption.
* **Secret Storage:** All YouTube API keys, Google client secrets, OAuth tokens, and database passwords shall be stored securely in environment variables or a Secrets Manager. No secrets shall be hardcoded.
* **SQL Injection Prevention:** All services shall utilize parameterized queries or object-relational mapping (ORM) systems to block database injection vectors.

### 4.3 Scalability & Availability
* **High Availability:** Core services shall target a 99.9% uptime metric, utilizing robust health-check parameters.
* **Database Scaling:** PostgreSQL instances shall support read-replica routing configurations.
* **Stateless Microservices:** All backend services must remain stateless, maintaining session data strictly in secure distributed caches (Redis) or utilizing client-side JWT authorization.

### 4.4 Reliability, Maintainability, and Portability
* **Automated Restarts:** All services shall run with Docker policy flags `restart: unless-stopped`.
* **Structured Logs:** All services must output standard logs to `stdout`/`stderr` using clean JSON schemas.
* **Multi-Platform Deployment:** The system shall run identically on linux/amd64 and linux/arm64 system architectures.
