# User and Admin Actions Privilege Matrix
## For Content Intelligence Platform (CIP)

---

## 1. Introduction & Role Definitions

The Content Intelligence Platform (CIP) utilizes **Role-Based Access Control (RBAC)** to segregate operations between platform owners and the public audience.

### 1.1 Admin (Creator / Workspace Manager)
*   **Definition:** The primary channel owner, creator, or editorial manager.
*   **Operational Scope:** Has full read/write, sync, configuration, and structural tuning access across all microservices, databases, and workspace panels.

### 1.2 User (Public Visitor / Audience)
*   **Definition:** A standard viewer, research enthusiast, or general public explorer.
*   **Operational Scope:** Read-only access to explicitly approved published chronicles, bibliographies, public research summaries, and the visual interactive Knowledge Graph.

---

## 2. Core Actions Matrix

| Feature Area | Specific Action | Allowed for Admin | Allowed for Public User | API Endpoint Path | Inter-Service Transaction |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **Authentication** | Sign in via Google OAuth | **Yes** | No | `/api/v1/auth/login` | Identity Service |
| | Revoke / Rotate JWT Session | **Yes** | No | `/api/v1/auth/callback` | Identity Service |
| **Content Backlog** | Create Video Concept | **Yes** | No | `POST /api/v1/videos` | Content Service |
| | View Full Backlog Items | **Yes** | No | `GET /api/v1/videos` | Content Service (Filters all states) |
| | View Published Videos | **Yes** | **Yes** | `GET /api/v1/videos?status=published`| Content Service (Reads published state) |
| | Modify Video Progress State | **Yes** | No | `PATCH /api/v1/videos/{id}` | Content Service (Triggers status update event) |
| **Roadmaps & Goals**| Create Strategic Roadmap Track| **Yes** | No | `POST /api/v1/roadmaps` | Roadmap Service |
| | View Active Roadmaps | **Yes** | **Yes** | `GET /api/v1/roadmaps` | Roadmap Service |
| | Add Milestones & Targets | **Yes** | No | `POST /api/v1/roadmaps/{id}/milestones`| Roadmap Service |
| **YouTube Sync** | Trigger Manual Metrics Sync | **Yes** | No | `POST /api/v1/youtube/sync` | YouTube Sync Service (Google API query) |
| | View Live Channel Analytics | **Yes** | No | `GET /api/v1/youtube/metrics` | YouTube Sync Service |
| **Reference Vault** | Register Academic Book | **Yes** | No | `POST /api/v1/library/books` | Knowledge Service |
| | View Bibliography Index | **Yes** | **Yes** | `GET /api/v1/library/books` | Knowledge Service |
| | Create Detailed Research Note | **Yes** | No | `POST /api/v1/library/notes` | Knowledge Service |
| | View Public Research Notes | **Yes** | **Yes** | `GET /api/v1/library/notes` | Knowledge Service |
| **Decision Engine** | View Content Gap bars | **Yes** | No | Dashboard Render | Intelligence Service calculations |
| | Inspect Opportunity Warnings | **Yes** | No | Dashboard Render | Intelligence Service calculations |
| **Knowledge Graph** | Render Interactive Visual Node | **Yes** | **Yes** | Graph SVG Render | Public Portal client (Click to inspect) |
| **AI Semantics** | Calculate Text Embeddings | **Yes** | No | `POST /api/v1/ai/embeddings` | AI Service (1536 float dimensions) |
| | Execute Auto-Classification | **Yes** | No | `POST /api/v1/ai/classify` | AI Service |
| | Generate Copilot Outline Script | **Yes** | No | `POST /api/v1/ai/copilot/outline`| AI Service |
| **Search Engine** | Execute Keyword Search | **Yes** | **Yes** | `GET /api/v1/search?q={query}` | Search Service |

---

## 3. Detailed Actions Guide & Rules

### 3.1 Admin Actions (Full Workspace Control)
1.  **SaaS Tenant Switching:** The Admin can switch the active brand/tenant workspace (e.g., toggling between "Primary Creator Workspace", "Roman Chronicles Brand", and "Greek Legends Brand") on the dashboard. This immediately loads segregated content and metrics, demonstrating Phase 4 multi-tenant scaling.
2.  **YouTube Integration & Token Rotation:** The Admin triggers real or simulated synchronizations. The backend refreshes OAuth tokens and retrieves view counts, watch times, and subscriber gains.
3.  **Creative Outline Generation:** The Admin can request the AI Copilot to analyze research notes and synthesize a structured script outline containing hooks, durations, and citations.

### 3.2 Public User Actions (Audience Exploration)
1.  **Knowledge Graph Traversal:** Public Users can interact with nodes inside the public SVG Knowledge Graph. Clicking a node (e.g. "Julius Caesar") displays its type, historical summaries, and associated citations.
2.  **Chronicles Consumption:** Readers view the list of finalized videos that have transitioned to the `Published` state, keeping active drafts and scripting pipelines private.
3.  **Bibliography Inspection:** Public Users can consult the creator's book indices and bibliography, verifying source materials and historical rigor.
