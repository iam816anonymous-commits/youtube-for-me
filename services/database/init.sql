-- Database Initialization script for CIP Master Database

-- Content schema
CREATE SCHEMA IF NOT EXISTS content;

CREATE TABLE IF NOT EXISTS content.ct_videos (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    youtube_id VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'ideation',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed content
INSERT INTO content.ct_videos (id, title, description, status) VALUES
('1a9bc245-c800-4752-bd88-0214a19bc32a', 'Rise and Fall of Ancient Rome', 'Exploring the history', 'published'),
('28bc514d-91b3-4fec-88c9-021bc2498712', 'Secrets of Sparta Mythologies', 'Myth vs Reality', 'research')
ON CONFLICT (id) DO NOTHING;


-- Roadmap schema
CREATE SCHEMA IF NOT EXISTS roadmap;

CREATE TABLE IF NOT EXISTS roadmap.rm_roadmaps (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roadmap.rm_roadmaps (id, title, description, target_date) VALUES
('34bc98e1-da81-42ab-bd99-0129bc4897bc', 'Historical Dynasties series', 'Analyze major world civilisations', '2024-12-31')
ON CONFLICT (id) DO NOTHING;


-- Knowledge schema
CREATE SCHEMA IF NOT EXISTS knowledge;

CREATE TABLE IF NOT EXISTS knowledge.kn_books (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    isbn VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledge.kn_research_items (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    book_id UUID,
    title VARCHAR(255) NOT NULL,
    raw_content TEXT NOT NULL,
    tag_entities TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO knowledge.kn_books (id, title, author, isbn) VALUES
('1001-abc-9923', 'The Histories of Herodotus', 'Herodotus', '978-0199535668'),
('1002-xyz-4412', 'The History of the Peloponnesian War', 'Thucydides', '978-0140440393')
ON CONFLICT (id) DO NOTHING;

INSERT INTO knowledge.kn_research_items (id, book_id, title, raw_content, tag_entities) VALUES
('55bc98e1-da81-42ab-bd99-0129bc4897ff', '1001-abc-9923', 'Thermopylae passage', 'Herodotus detail regarding 300 Spartans holding the hot gates.', ARRAY['Sparta', 'Greece'])
ON CONFLICT (id) DO NOTHING;


-- Analytics schema
CREATE SCHEMA IF NOT EXISTS analytics;

CREATE TABLE IF NOT EXISTS analytics.an_channel_snapshots (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    subscriber_count INT NOT NULL,
    total_views INT NOT NULL,
    total_watch_time_minutes INT NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
