# Domain-Driven Design & Schema Specification (DDD)
## For Content Intelligence Platform (CIP)

---

## 1. Domain Modeling

This document specifies the business entities, value objects, aggregates, and data schemas that map the domain language directly into physical databases. To prevent service coupling, every aggregate root belongs exclusively to one microservice database domain.

### 1.1 Core Aggregates
* **`Video` (Content Service Aggregate Root):** Governs standard physical video details, YouTube links, series inclusion, and status transitions.
* **`Series` (Content Service):** An ordered sequence of related video assets mapping a particular narrative arc.
* **`Roadmap` & `Milestone` (Roadmap Service Aggregate Root):** The strategic vision mapping goals, release schedules, and thematic priorities.
* **`Task` & `WorkflowStep` (Planner Service Aggregate Root):** Coordinates standard operational tasks, checklists, dependencies, deadlines, and visual Kanban pipelines.
* **`KnowledgeGraphNode` & `KnowledgeGraphEdge` (Knowledge Graph Service Aggregate Root):** Manages historical context graph associations mapping dynasties, locations, civilizations, and references.
* **`RawIngestionRecord` (Data Lake Service Aggregate Root):** Stores raw JSON data feeds pulled from public APIs to preserve original immutable state.
* **`ActiveRecommendation` (Recommendation Service Aggregate Root):** Formulates structural AI recommendations by reasoning over metrics, backlog milestones, and content gaps.

---

## 2. Comprehensive Event Catalog Specification

All microservices within CIP communicate asynchronously via the Event Bus. The following catalog establishes precise specifications, including schema schemas, publishers, consumers, versioning, retry policies, and Dead Letter Queue (DLQ) pathways.

| Event Type | Version | Publisher Service | Primary Consumers | Retry Policy | Dead Letter Queue |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`video.imported`** | v1.0.0 | YouTube Sync | Content, Analytics | 3 attempts, exponential backoff (multiplier: 2) | `dlq.video.imported` |
| **`video.updated`** | v1.0.0 | Content | Search, Graph | 3 attempts, linear backoff (interval: 5s) | `dlq.video.updated` |
| **`video.deleted`** | v1.0.0 | Content | Search, Planner, Graph | 3 attempts, linear backoff (interval: 5s) | `dlq.video.deleted` |
| **`roadmap.created`** | v1.0.0 | Roadmap | Planner, Recommendation | 2 attempts, backoff | `dlq.roadmap.created` |
| **`series.started`** | v1.0.0 | Content | Roadmap, Recommendation | 3 attempts, exponential backoff | `dlq.series.started` |
| **`series.completed`** | v1.0.0 | Content | Roadmap, Recommendation | 3 attempts, exponential backoff | `dlq.series.completed` |
| **`analytics.synced`** | v1.0.0 | YouTube Sync | Analytics, Recommendation | 5 attempts, backoff | `dlq.analytics.synced` |
| **`research.imported`** | v1.0.0 | Knowledge | AI, Search | 3 attempts, linear backoff | `dlq.research.imported` |
| **`embedding.generated`** | v1.0.0 | AI | Search, Graph | 3 attempts, exponential backoff | `dlq.embedding.generated` |
| **`script.generated`** | v1.0.0 | AI | Content, Planner | 3 attempts, linear backoff | `dlq.script.generated` |
| **`youtube.sync.failed`** | v1.0.0 | YouTube Sync | Notification, Logger | 1 attempt (immediate alert) | `dlq.sync.failed` |

### 2.1 Event Schema Example: `video.imported` (JSON Schema)
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "VideoImportedEvent",
  "type": "object",
  "required": ["event_id", "timestamp", "version", "tenant_id", "video_data"],
  "properties": {
    "event_id": { "type": "string", "format": "uuid" },
    "timestamp": { "type": "string", "format": "date-time" },
    "version": { "type": "string", "default": "1.0.0" },
    "tenant_id": { "type": "string", "format": "uuid" },
    "video_data": {
      "type": "object",
      "required": ["youtube_video_id", "title", "published_at"],
      "properties": {
        "youtube_video_id": { "type": "string" },
        "title": { "type": "string" },
        "description": { "type": "string" },
        "published_at": { "type": "string", "format": "date-time" },
        "channel_id": { "type": "string" }
      }
    }
  }
}
```

---

## 3. Microservice Database Schemas (DML / DDL)

To preserve strict separation, each microservice owns its own tables.

### 3.1 Content Service Schema
```sql
CREATE TABLE IF NOT EXISTS ct_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    youtube_id VARCHAR(50) UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'ideation',
    scheduled_publish_time TIMESTAMP WITH TIME ZONE,
    actual_publish_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ct_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ct_series_videos (
    series_id UUID REFERENCES ct_series(id) ON DELETE CASCADE,
    video_id UUID REFERENCES ct_videos(id) ON DELETE CASCADE,
    sort_order INT NOT NULL,
    PRIMARY KEY (series_id, video_id)
);
```

### 3.2 Roadmap Service Schema (Isolated from Content)
```sql
CREATE TABLE IF NOT EXISTS rm_roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rm_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    roadmap_id UUID REFERENCES rm_roadmaps(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'planned', -- planned, in-progress, completed, delayed
    target_quarter VARCHAR(10), -- e.g., '2024-Q3'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 3.3 Planner Service Schema (Isolated)
```sql
CREATE TABLE IF NOT EXISTS pl_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    video_id UUID, -- loosely references Content Service video ID
    title VARCHAR(255) NOT NULL,
    assigned_to VARCHAR(100),
    column_state VARCHAR(50) DEFAULT 'todo', -- todo, in-progress, review, done
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pl_task_dependencies (
    parent_task_id UUID REFERENCES pl_tasks(id) ON DELETE CASCADE,
    child_task_id UUID REFERENCES pl_tasks(id) ON DELETE CASCADE,
    PRIMARY KEY (parent_task_id, child_task_id)
);
```

### 3.4 Data Lake Raw-Ingestion Schema
```sql
CREATE TABLE IF NOT EXISTS dl_raw_ingestion_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    data_source VARCHAR(100) NOT NULL, -- e.g. 'youtube_api_video_details'
    external_identifier VARCHAR(100) NOT NULL, -- e.g. youtube video ID
    raw_payload JSONB NOT NULL, -- original unmodified JSON record
    ingested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dl_raw_source_identifier ON dl_raw_ingestion_log(data_source, external_identifier);
```

### 3.5 Knowledge Graph Schema (Apache AGE SQL Concept)
Utilizing standard relational representations mapping vertices and edges which Apache AGE handles transparently.

```sql
-- Vertices
CREATE TABLE IF NOT EXISTS kg_vertices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    label VARCHAR(100) NOT NULL, -- 'Civilization', 'Dynasty', 'Location', 'Person'
    properties JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Edges mapping connection networks
CREATE TABLE IF NOT EXISTS kg_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    source_vertex_id UUID REFERENCES kg_vertices(id) ON DELETE CASCADE,
    target_vertex_id UUID REFERENCES kg_vertices(id) ON DELETE CASCADE,
    relationship_label VARCHAR(100) NOT NULL, -- e.g. 'RULED_BY', 'LOCATED_IN'
    properties JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kg_edges_traversal ON kg_edges(source_vertex_id, target_vertex_id);
```

### 3.6 Recommendation Engine Schema
```sql
CREATE TABLE IF NOT EXISTS rc_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    category VARCHAR(100) NOT NULL, -- e.g. 'content_gap', 'scheduling_optimization'
    confidence_score NUMERIC(5,2) NOT NULL, -- e.g. 94.50
    recommendation_text TEXT NOT NULL,
    supporting_metrics JSONB NOT NULL, -- metrics details that formulated this suggestion
    status VARCHAR(50) DEFAULT 'active', -- active, applied, dismissed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
