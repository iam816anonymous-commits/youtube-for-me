# Technical Design Specification (TDS)
## For Content Intelligence Platform (CIP) Core Microservices

---

## 1. Document Purpose & Scope

This **Technical Design Specification (TDS)** provides developers with explicit, implementation-ready details for the principal microservices of the Content Intelligence Platform (CIP). It translates domain specifications, event logs, and architecture guidelines into concrete contracts, sequence actions, error-handling policies, and schema indexes.

---

## 2. Content Service

### 2.1 Purpose & Responsibilities
The Content Service manages physical content conceptual records, series groupings, and video publication details.

### 2.2 Public REST APIs (JSON Contract)
*   `POST /api/videos` — Creates a video record.
*   `GET /api/videos` — Queries videos (with status filters).
*   `PATCH /api/videos/{id}` — Triggers transition states.
*   `DELETE /api/videos/{id}` — Removes a video node.

### 2.3 Event Bus Interfaces
*   **Published Events:**
    *   `video.imported` — Emitted when a new video is discovered.
    *   `video.updated` — Emitted upon state modifications.
    *   `video.deleted` — Emitted when a video is deleted.
*   **Subscribed Events:**
    *   `script.generated` — Listened to update local drafts.

### 2.4 Database Schema (SQL)
```sql
CREATE TYPE ct_status AS ENUM ('ideation', 'research', 'scripting', 'recording', 'editing', 'scheduled', 'published');

CREATE TABLE IF NOT EXISTS ct_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    youtube_id VARCHAR(50) UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ct_status DEFAULT 'ideation',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ct_videos_tenant_status ON ct_videos(tenant_id, status);
```

### 2.5 State Machine Flow
```text
[Ideation] ──► [Research] ──► [Scripting] ──► [Recording] ──► [Editing] ──► [Scheduled] ──► [Published]
```

### 2.6 Error Handling & Retry Policies
*   **Database Down:** HTTP 503 Service Unavailable, 3 retry attempts inside API Gateway routing middleware.
*   **Invalid State Transition:** Returns HTTP 400 Bad Request with details.

---

## 3. Roadmap Service

### 3.1 Purpose & Responsibilities
Manages strategic release target charts, quarterly goals, milestones, and progress matrices.

### 3.2 Public REST APIs
*   `POST /api/roadmaps` — Creates a strategic roadmap container.
*   `GET /api/roadmaps/{id}` — Retrieves roadmap with associated quarterly milestones.
*   `POST /api/roadmaps/{id}/milestones` — Appends a target milestone.

### 3.3 Event Bus Interfaces
*   **Published Events:**
    *   `roadmap.created` — Emitted when a roadmap is created.
*   **Subscribed Events:**
    *   `video.published` — Completes corresponding milestone stages automatically.

### 3.4 Database Schema
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
    status VARCHAR(50) DEFAULT 'planned',
    target_quarter VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Planner Service

### 4.1 Purpose & Responsibilities
Coordinates granular creator task logs, Kanban columns, task calendars, and execution blockers.

### 4.2 Public REST APIs
*   `POST /api/planner/tasks` — Instantiates a checklist task.
*   `GET /api/planner/tasks` — Retreives active Kanban cards.
*   `PUT /api/planner/tasks/{id}/state` — Drags a card to a new column.

### 4.3 Event Bus Interfaces
*   **Subscribed Events:**
    *   `video.updated` — Updates matching calendar deadlines automatically.

### 4.4 Database Schema
```sql
CREATE TABLE IF NOT EXISTS pl_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    video_id UUID,
    title VARCHAR(255) NOT NULL,
    column_state VARCHAR(50) DEFAULT 'todo',
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. Intelligence Service

### 5.1 Purpose & Responsibilities
Runs recommendation and reasoning algorithms over analytical performance metrics and milestones to provide active advice.

### 5.2 Public REST APIs
*   `GET /api/intelligence/recommendations` — Lists strategic recommendations.
*   `POST /api/intelligence/recommendations/{id}/apply` — Executes a suggestion.

### 5.3 Event Bus Interfaces
*   **Subscribed Events:**
    *   `analytics.synced` — Triggers a new background recommendation calculation run.

### 5.4 Database Schema
```sql
CREATE TABLE IF NOT EXISTS rc_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    category VARCHAR(100) NOT NULL,
    confidence_score NUMERIC(5,2) NOT NULL,
    recommendation_text TEXT NOT NULL,
    supporting_metrics JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. Observability, Security, & Testing Configuration

### 6.1 Diagnostic Health Endpoint (`GET /health`)
All services must expose `/health` returning:
```json
{
  "status": "healthy",
  "uptime_seconds": 120400,
  "checks": {
    "database": { "status": "connected" }
  }
}
```

### 6.2 Standard Testing Strategy
```text
┌────────────────────────────────────────────────────────┐
│  Unit Tests: Mock external DB and API contracts        │
├────────────────────────────────────────────────────────┤
│  Integration Tests: Verify actual SQL and pgvector      │
├────────────────────────────────────────────────────────┤
│  Contract Tests: Validate API responses via gateway    │
└────────────────────────────────────────────────────────┘
```
All code changes must maintain a minimum of 80% test coverage before merge approval.
