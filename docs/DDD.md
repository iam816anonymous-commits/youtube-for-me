# Domain-Driven Design & Schema Specification (DDD)
## For Content Intelligence Platform (CIP)

---

## 1. Domain Modeling & Tenant Architecture

This document specifies the business entities, value objects, aggregates, and data schemas that map the domain language directly into physical databases.

### 1.1 Single-Tenant Defaulting Strategy
To ensure multi-tenant readiness while avoiding complex SaaS business logic during Phase 1, all database tables incorporate a `tenant_id` UUID column.
*   **Default Tenant Context ID:** `00000000-0000-0000-0000-000000000000`.
*   All queries and write operations inside backend services automatically append `WHERE tenant_id = '00000000-0000-0000-0000-000000000000'`.
*   This ensures that upgrading to multi-tenant hosting in Phase 4 requires only swapping the hardcoded context ID with the authenticated tenant context of the logged-in user.

### 1.2 Core Aggregates
*   **`Video` (Content Service Aggregate Root):** Governs standard physical video details, YouTube links, and status transitions.
*   **`Roadmap` & `Milestone` (Roadmap Service Aggregate Root):** The strategic goals and targets.
*   **`Task` & `WorkflowStep` (Planner Service Aggregate Root):** Operational task cards, columns, and checklists.
*   **`Integration` (Integration Service Aggregate Root):** Holds secure connection keys and state parameters for external services.

---

## 2. Comprehensive Event Catalog Specification

All microservices within CIP communicate asynchronously via the Event Bus. The following catalog establishes precise specifications, including schema versions, retry rules, and Dead Letter Queue (DLQ) pathways.

| Event Type | Version | Publisher Service | Primary Consumers | Retry Policy | Dead Letter Queue |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`video.imported`** | v1.0.0 | YouTube Sync | Content, Analytics | 3 attempts, exponential backoff (multiplier: 2) | `dlq.video.imported` |
| **`video.updated`** | v1.0.0 | Content | Search, Graph | 3 attempts, linear backoff (interval: 5s) | `dlq.video.updated` |
| **`video.deleted`** | v1.0.0 | Content | Search, Planner, Graph | 3 attempts, linear backoff (interval: 5s) | `dlq.video.deleted` |
| **`roadmap.created`** | v1.0.0 | Roadmap | Planner, Recommendation | 2 attempts, backoff | `dlq.roadmap.created` |
| **`sync.completed`** | v1.0.0 | YouTube Sync | Analytics, Intelligence | 5 attempts, backoff | `dlq.sync.completed` |
| **`research.imported`** | v1.0.0 | Knowledge | AI, Search | 3 attempts, linear backoff | `dlq.research.imported` |
| **`embedding.generated`** | v1.0.0 | AI | Search, Graph | 3 attempts, exponential backoff | `dlq.embedding.generated` |

### 2.1 Standard Event Envelope (JSON Schema)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CIPEventEnvelope",
  "type": "object",
  "required": ["event_id", "event_type", "event_version", "timestamp", "tenant_id", "payload"],
  "properties": {
    "event_id": { "type": "string", "format": "uuid" },
    "event_type": { "type": "string" },
    "event_version": { "type": "string" },
    "timestamp": { "type": "string", "format": "date-time" },
    "tenant_id": { "type": "string", "format": "uuid" },
    "idempotency_key": { "type": "string" },
    "payload": { "type": "object" }
  }
}
```

---

## 3. Microservice Database Schemas (DML / DDL)

### 3.1 Content Service Schema
```sql
CREATE TYPE ct_status AS ENUM ('ideation', 'research', 'scripting', 'recording', 'editing', 'scheduled', 'published');

CREATE TABLE IF NOT EXISTS ct_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    youtube_id VARCHAR(50) UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ct_status DEFAULT 'ideation',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 Roadmap Service Schema (Isolated)
```sql
CREATE TABLE IF NOT EXISTS rm_roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rm_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    roadmap_id UUID REFERENCES rm_roadmaps(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'planned',
    target_quarter VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.3 Planner Service Schema (Isolated)
```sql
CREATE TABLE IF NOT EXISTS pl_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    title VARCHAR(255) NOT NULL,
    column_state VARCHAR(50) DEFAULT 'todo',
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.4 Integration Service Schema
```sql
CREATE TABLE IF NOT EXISTS int_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    platform_name VARCHAR(100) NOT NULL, -- e.g. 'Notion', 'Obsidian', 'Google Drive'
    auth_credentials JSONB NOT NULL, -- encrypted connection tokens and secrets
    sync_status VARCHAR(50) DEFAULT 'active',
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.5 Intelligence Service Schema (Decision Engine)
```sql
CREATE TABLE IF NOT EXISTS rc_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    category VARCHAR(100) NOT NULL, -- e.g. 'content_gap', 'scheduling'
    confidence_score NUMERIC(5,2) NOT NULL,
    recommendation_text TEXT NOT NULL,
    supporting_metrics JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.6 Data Lake Raw-Ingestion Schema
```sql
CREATE TABLE IF NOT EXISTS dl_raw_ingestion_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    data_source VARCHAR(100) NOT NULL,
    external_identifier VARCHAR(100) NOT NULL,
    raw_payload JSONB NOT NULL,
    ingested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.7 Knowledge Graph Schema (AGE Representation)
```sql
CREATE TABLE IF NOT EXISTS kg_vertices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    label VARCHAR(100) NOT NULL,
    properties JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kg_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    source_vertex_id UUID REFERENCES kg_vertices(id) ON DELETE CASCADE,
    target_vertex_id UUID REFERENCES kg_vertices(id) ON DELETE CASCADE,
    relationship_label VARCHAR(100) NOT NULL,
    properties JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. UI/UX Wireframe Concepts

The Content Intelligence Platform dashboard provides a unified view of historical content metrics alongside future content planning.

### 4.1 Workspace Admin Layout
```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  CIP Admin Command Center                                              [User Profile]  │
├─────────────────┬──────────────────────────────────────────────────────────────────────┤
│ [Dashboard]     │  Active Roadmap Pipeline                                            │
│ [Roadmap]       │  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐           │
│ [Knowledge]     │  │ Ideation      │   │ Research      │   │ Scripting     │           │
│ [Analytics]     │  │ - Alex. Great │ ═►│ - Rome Rise   │ ═►│ - Punic Wars  │           │
│ [AI Assistant]  │  │ - Genghis Khan│   │ - Sparta Myth │   │ - Carthage    │           │
│ [Settings]      │  └───────────────┘   └───────────────┘   └───────────────┘           │
│                 ├──────────────────────────────────────────────────────────────────────┤
│                 │  Content Intelligence Quick Actions                                  │
│                 │  ┌───────────────────────┐   ┌─────────────────────────────────────┐ │
│                 │  │ Semantic search...    │   │ Ask AI Assistant...                 │ │
│                 │  │ [ Enter Keywords/Vec] │   │ [ Outline a script using Rome notes]│ │
│                 │  └───────────────────────┘   └─────────────────────────────────────┘ │
└─────────────────┴──────────────────────────────────────────────────────────────────────┘
```

### 4.2 Audience Public Knowledge Graph Layout (Phase 3)
```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  CIP Audience Portal — Interactive Knowledge Map                                       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│                      [ Roman Civilization ]                                            │
│                             ▲     ▲                                                    │
│                             │     │                                                    │
│               ┌─────────────┴─┐   └─────────────┐                                      │
│               │                                 │                                      │
│      [ Punic Wars Video ]              [ Julius Caesar Book ]                          │
│               ▲                                 ▲                                      │
│               │                                 │                                      │
│               └─────────────────┬───────────────┘                                      │
│                                 │                                                      │
│                        [ Battle of Cannae ]                                            │
│                                                                                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Click on nodes to display source citations, transcripts, research papers, and videos.   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
