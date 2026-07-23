# Domain-Driven Design & Schema Specification (DDD)
## For Content Intelligence Platform (CIP)

---

## 1. Domain Modeling

This document specifies the business entities, value objects, aggregates, and data schemas that map the domain language directly into physical databases. To prevent service coupling, every aggregate root belongs exclusively to one microservice database domain.

### 1.1 Content Domain Aggregates
* **`Video` (Aggregate Root):** Represets a distinct piece of media. Governs status transitions, scheduling, and YouTube linkages.
* **`Series`:** Represents an ordered collection of videos focusing on a specific historical theme or structured storyline.
* **`Roadmap` & `RoadmapNode`:** Orchestrates visual paths, timelines, and release milestones.

### 1.2 Knowledge Domain Aggregates
* **`ResearchItem` (Aggregate Root):** The core unit of information containing textual content, metadata, and citation references.
* **`Book`:** Bibliographical representation of external academic resources.
* **`Quote`:** High-precision textual segments mapped directly to specific reference page numbers or media timestamps.
* **`Entity` (Civilization, Dynasty, Location, Person):** Represents historical context elements that tag notes and script blocks.

### 1.3 Entity Relationship Diagram (Conceptual Layout)

```text
       ┌────────────────────────┐              ┌────────────────────────┐
       │   Video (Aggregate)    │◄────────────►│  Series (Aggregate)    │
       └───────────┬────────────┘              └────────────────────────┘
                   │
                   ▼
       ┌────────────────────────┐              ┌────────────────────────┐
       │   Roadmap / Node       │              │  Research (Aggregate)  │
       └────────────────────────┘              └───────────┬────────────┘
                                                           │
                        ┌──────────────────────────────────┴──────────────────────────────────┐
                        ▼                                  ▼                                  ▼
            ┌──────────────────────┐           ┌──────────────────────┐           ┌──────────────────────┐
            │   Book / Quote       │           │ Civilization/Dynasty │           │ Location / Person    │
            └──────────────────────┘           └──────────────────────┘           └──────────────────────┘
```

---

## 2. Microservice Database Schemas (DML / DDL)

The following structured SQL statements define the PostgreSQL and pgvector database tables, relationships, and multi-tenant isolation layers.

### 2.1 Identity Service Database Schema
```sql
-- Identity Service persistence layer
CREATE TABLE IF NOT EXISTS id_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255),
    google_oauth_id VARCHAR(255) UNIQUE,
    display_name VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS id_refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID REFERENCES id_users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_id_users_tenant ON id_users(tenant_id);
```

### 2.2 Content Service Database Schema
```sql
-- Content Service persistence layer
CREATE TYPE video_status AS ENUM (
    'ideation', 'research', 'scripting', 'recording', 'editing', 'scheduled', 'published'
);

CREATE TABLE IF NOT EXISTS ct_roadmaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ct_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ct_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    youtube_id VARCHAR(50) UNIQUE,
    roadmap_id UUID REFERENCES ct_roadmaps(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status video_status DEFAULT 'ideation',
    scheduled_publish_time TIMESTAMP WITH TIME ZONE,
    actual_publish_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ct_series_videos (
    series_id UUID REFERENCES ct_series(id) ON DELETE CASCADE,
    video_id UUID REFERENCES ct_videos(id) ON DELETE CASCADE,
    sort_order INT NOT NULL,
    PRIMARY KEY (series_id, video_id)
);

CREATE INDEX idx_ct_videos_tenant_status ON ct_videos(tenant_id, status);
```

### 2.3 Analytics Service Database Schema
```sql
-- Analytics Service persistence layer
CREATE TABLE IF NOT EXISTS an_channel_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    subscriber_count INT NOT NULL,
    total_views BIGINT NOT NULL,
    total_watch_time_minutes BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS an_video_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    video_id UUID NOT NULL, -- references Content Service Video ID loosely
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    views INT NOT NULL,
    likes INT DEFAULT 0,
    comments INT DEFAULT 0,
    average_view_duration_seconds INT,
    impression_click_through_rate NUMERIC(5,2)
);

CREATE TABLE IF NOT EXISTS an_video_retention_curves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    video_id UUID NOT NULL,
    retention_array_percentages DOUBLE PRECISION[] NOT NULL, -- 2nd-by-2nd audience retention percentages
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_an_video_snapshots_lookup ON an_video_snapshots(tenant_id, video_id, recorded_at DESC);
```

### 2.4 Knowledge & AI Service Database Schema
```sql
-- Enable pgvector extension for semantic operations
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge Service persistence layer
CREATE TABLE IF NOT EXISTS kn_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    isbn VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kn_research_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    source_type VARCHAR(100), -- Book, Paper, Transcript, Manual Note
    raw_content TEXT NOT NULL,
    content_embedding vector(1536), -- 1536 dimensional embedding vector (OpenAI text-embedding-3-small standard)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kn_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    book_id UUID REFERENCES kn_books(id) ON DELETE CASCADE,
    research_item_id UUID REFERENCES kn_research_items(id) ON DELETE CASCADE,
    quote_text TEXT NOT NULL,
    page_number INT,
    quote_embedding vector(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kn_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100), -- Dynasty, Civilization, Location, Person
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kn_research_entities (
    research_item_id UUID REFERENCES kn_research_items(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES kn_entities(id) ON DELETE CASCADE,
    PRIMARY KEY (research_item_id, entity_id)
);

-- Optimize semantic vector search queries using HNSW indexes
CREATE INDEX IF NOT EXISTS idx_kn_research_embeddings ON kn_research_items
USING hnsw (content_embedding vector_cosine_ops);
```

---

## 3. UI/UX Wireframe Concepts

The Content Intelligence Platform dashboard provides a unified view of historical content metrics alongside future content planning.

### 3.1 Workspace Admin Layout
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

### 3.2 Audience Public Knowledge Graph Layout (Phase 3)
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
