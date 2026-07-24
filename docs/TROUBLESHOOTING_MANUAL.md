# Beginner Operations and Troubleshooting Manual
## For Content Intelligence Platform (CIP) Portal

Welcome to the Content Intelligence Platform (CIP)! This manual is designed for beginners, developers, and platform administrators. It covers common issues, their specific root causes, step-by-step solutions, manual file guidelines, and instructions on how to navigate the system dashboards.

---

## 1. System Navigation & Dashboard Manual

### 1.1 Admin Command Center (`http://localhost:3000`)
The **Admin Workspace** is your master control tower for configuring content campaigns and planning script ideas.
1.  **Add Video Idea (Sidebar):** Use the input form to create fresh conceptual pieces. This automatically assigns the initial status state: `ideation`.
2.  **Videos / Backlog Tab:** Displays a list of your planned concepts, indicating progress states like `ideation`, `research`, `scripting`, etc.
3.  **Roadmaps / Goals Tab:** Tracks strategic milestone timelines (e.g., historical civilization series releases).

### 1.2 Public Knowledge Portal (`http://localhost:3001`)
The **Public Portal** is what your audience sees when exploring your published content and bibliographic research.
1.  **Interactive Knowledge Graph:** A high-performance visual map representing your research. Click on individual nodes (like "Roman Empire", "Julius Caesar", or "Peloponnesian War") to display their historical context, summaries, and associated sources.
2.  **Published Videos Panel:** Displays only videos marked as `published` by the admin, preserving private planning workflows.
3.  **Public Bibliography (Sidebar):** An academic catalog displaying referenced books and author details.
4.  **Semantic Search (Header):** Allows public visitors to query your knowledge index using vector proximity matches.

---

## 2. Common Issues and How to Solve Them

### 2.1 Issue 1: "API Gateway Unreachable / Connection Refused"
*   **Symptom:** Next.js pages display a warning: `⚠️ Operation simulated locally (API Gateway offline)`.
*   **Root Cause:** The Kong API Gateway container is still initializing, or port `8000` is blocked by another local service on your machine.
*   **Solution:**
    1.  Ensure you have terminated other servers on port 8000: `kill $(lsof -t -i :8000) 2>/dev/null || true`.
    2.  Check Kong logs: `docker compose logs kong-gateway`.
    3.  Ensure Kong configuration is declarative and declarative files exist: `docker compose restart kong-gateway`.

### 2.2 Issue 2: "Database Schema Query Failures / Undefined Table"
*   **Symptom:** Microservices logs print errors like `relation "content.ct_videos" does not exist`.
*   **Root Cause:** The PostgreSQL database is up, but the initialization schema file (`init.sql`) failed to run because the database was restarted or populated on an old dirty volume cache.
*   **Solution:**
    1.  Tear down the stack and wipe persistent cached volume layers: `docker compose down -v`.
    2.  Reboot the containers cleanly: `docker compose up -d`. This forces `init.sql` to execute and populate the schemas from scratch.

### 2.3 Issue 3: "Build Mount Overlay Failure inside Docker Compose"
*   **Symptom:** The command `docker compose build` fails with error: `target identity-service: failed to solve: mount source: overlay... err: invalid argument`.
*   **Root Cause:** Some virtual machine hypervisors have restricted nested snapshotter overlay filesystem drivers that prevent Docker Buildkit mounts.
*   **Solution:** Run the build with Buildkit explicitly disabled:
    ```bash
    DOCKER_BUILDKIT=0 COMPOSE_DOCKER_CLI_BUILD=0 docker compose build
    ```

---

## 3. Reference: Manual File Configuration Guide

If you need to manually configure, update, or recreate files during deployment, use the following authoritative schemas.

### 3.1 Docker Compose Configuration (`docker-compose.yml`)
Located in the repository root. Ensure you specify correct image tags, networks, and database parameters:
```yaml
version: '3.8'
services:
  kong-gateway:
    image: kong:3.4
    # ... configured with ports 8000 and 8001
  database:
    image: postgres:15-alpine
    # ... mounts ./services/database/init.sql to /docker-entrypoint-initdb.d/init.sql
  # ... individual microservice blocks
```

### 3.2 Kong Declarative Proxy Config (`kong.yml`)
Located in the repository root. This handles path routing to backend services:
```yaml
_format_version: "3.0"
_transform: true
services:
  - name: identity-service
    url: http://identity-service:8081
    routes:
      - name: auth-routes
        paths:
          - /api/v1/auth
  # ... content, roadmap, knowledge, and ai service routes
```

### 3.3 Database Init Script (`services/database/init.sql`)
This executes SQL commands when the PostgreSQL engine boots. Keep schema schemas decoupled:
```sql
CREATE SCHEMA IF NOT EXISTS content;
CREATE TABLE IF NOT EXISTS content.ct_videos ( ... );

CREATE SCHEMA IF NOT EXISTS roadmap;
CREATE TABLE IF NOT EXISTS roadmap.rm_roadmaps ( ... );

CREATE SCHEMA IF NOT EXISTS knowledge;
CREATE TABLE IF NOT EXISTS knowledge.kn_books ( ... );
```
