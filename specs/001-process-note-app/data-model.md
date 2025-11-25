# Phase 1: Data Model - Process Note-Taking Application

**Feature**: 001-process-note-app
**Created**: 2025-11-20
**Status**: Complete

## Overview

This document defines the PostgreSQL database schema for the process note-taking application, including tables, relationships, indexes, and Row Level Security policies.

## Entity Relationship Diagram

```
auth.users (Supabase Auth)
    ↓ 1:1
profiles (practitioner metadata)
    ↓ 1:N
clients
    ↓ 1:N
    ├── notes
    │   ├── 1:N → note_conversations (LLM chat history)
    │   └── 1:N → note_embeddings (pgvector for semantic search)
    └── assessment_results
        ↓ N:1
    assessment_templates

note_templates (predefined SOAP, progress note, etc.)
    ↓ 1:N
notes

notifications (session reminders, pg_cron generated)
    ↓ N:1
clients, notes
```

---

## Table Definitions

### 1. profiles

Extends Supabase `auth.users` with practitioner-specific metadata.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  preferences JSONB DEFAULT '{}', -- UI preferences, notification settings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_id ON profiles(id);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

---

### 2. clients

Client profiles managed by practitioners.

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  initial_assessment_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  notes_summary TEXT, -- Brief overview for quick reference
  metadata JSONB DEFAULT '{}', -- Additional custom fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_clients_practitioner_id ON clients(practitioner_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_full_name_trgm ON clients USING GIN (full_name gin_trgm_ops); -- Full-text search

-- RLS Policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practitioners can view own clients"
  ON clients FOR SELECT
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can insert own clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can update own clients"
  ON clients FOR UPDATE
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can delete own clients"
  ON clients FOR DELETE
  USING (auth.uid() = practitioner_id);
```

---

### 3. note_templates

Predefined note structures (SOAP notes, progress notes, intake notes, etc.).

```sql
CREATE TABLE note_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- e.g., 'SOAP Note', 'Progress Note'
  description TEXT,
  structure JSONB NOT NULL, -- Template schema with locked headers and sections
  -- Example structure:
  -- {
  --   "headers": [
  --     { "level": 1, "text": "Session Note", "locked": true },
  --     { "level": 2, "text": "Subjective", "locked": true }
  --   ],
  --   "sections": [
  --     { "title": "Subjective", "placeholder": "Client's reported feelings...", "required": true },
  --     { "title": "Objective", "placeholder": "Observed behaviors...", "required": true },
  --     { "title": "Assessment", "placeholder": "Clinical impression...", "required": true },
  --     { "title": "Plan", "placeholder": "Treatment plan...", "required": true }
  --   ]
  -- }
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_note_templates_active ON note_templates(is_active);

-- No RLS: templates are public/system-wide
```

---

### 4. notes

Session notes with markdown content and metadata.

```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  template_id UUID REFERENCES note_templates(id) ON DELETE SET NULL,

  -- Note content
  markdown_content TEXT, -- Full markdown note with template structure
  raw_transcription TEXT, -- Original Deepgram transcription
  extracted_fields JSONB DEFAULT '{}', -- LLM-extracted structured data

  -- Metadata
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'approved')),
  session_date TIMESTAMPTZ DEFAULT NOW(),
  next_session_date DATE, -- For follow-up notifications
  follow_up_items TEXT[], -- Specific commitments for next session
  duration_minutes INT, -- Session length

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notes_practitioner_id ON notes(practitioner_id);
CREATE INDEX idx_notes_client_id ON notes(client_id);
CREATE INDEX idx_notes_status ON notes(status);
CREATE INDEX idx_notes_session_date ON notes(session_date DESC);
CREATE INDEX idx_notes_next_session_date ON notes(next_session_date) WHERE next_session_date IS NOT NULL;
CREATE INDEX idx_notes_full_text ON notes USING GIN (to_tsvector('english', markdown_content));

-- RLS Policies
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practitioners can view own notes"
  ON notes FOR SELECT
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can insert own notes"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can update own notes"
  ON notes FOR UPDATE
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can delete own notes"
  ON notes FOR DELETE
  USING (auth.uid() = practitioner_id);
```

---

### 5. note_conversations

Stores LLM chat history for each note (follow-up questions, clarifications).

```sql
CREATE TABLE note_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_note_conversations_note_id ON note_conversations(note_id);
CREATE INDEX idx_note_conversations_created_at ON note_conversations(created_at);

-- RLS Policies
ALTER TABLE note_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practitioners can view conversations for own notes"
  ON note_conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_conversations.note_id
        AND notes.practitioner_id = auth.uid()
    )
  );

CREATE POLICY "Practitioners can insert conversations for own notes"
  ON note_conversations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_conversations.note_id
        AND notes.practitioner_id = auth.uid()
    )
  );
```

---

### 6. note_embeddings

Stores pgvector embeddings for semantic search.

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE note_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE UNIQUE,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes (HNSW for fast similarity search)
CREATE INDEX idx_note_embeddings_note_id ON note_embeddings(note_id);
CREATE INDEX idx_note_embeddings_vector ON note_embeddings USING hnsw (embedding vector_cosine_ops);

-- RLS Policies
ALTER TABLE note_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practitioners can view embeddings for own notes"
  ON note_embeddings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_embeddings.note_id
        AND notes.practitioner_id = auth.uid()
    )
  );
```

---

### 7. assessment_templates

Standardized assessment/screening tools (e.g., PHQ-9, GAD-7, custom scales).

```sql
CREATE TABLE assessment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT, -- e.g., 'Depression', 'Anxiety', 'General'
  questions JSONB NOT NULL, -- Array of question objects
  -- Example:
  -- [
  --   {
  --     "id": "q1",
  --     "text": "Over the past 2 weeks, how often have you felt down?",
  --     "type": "scale",
  --     "options": ["Not at all", "Several days", "More than half", "Nearly every day"],
  --     "scores": [0, 1, 2, 3]
  --   }
  -- ]
  scoring_rules JSONB, -- Scoring algorithm and interpretation
  -- Example:
  -- {
  --   "total_range": [0, 27],
  --   "interpretation": [
  --     { "range": [0, 4], "label": "Minimal" },
  --     { "range": [5, 9], "label": "Mild" },
  --     { "range": [10, 14], "label": "Moderate" },
  --     { "range": [15, 27], "label": "Severe" }
  --   ]
  -- }
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_assessment_templates_active ON assessment_templates(is_active);
CREATE INDEX idx_assessment_templates_category ON assessment_templates(category);

-- No RLS: templates are public/system-wide
```

---

### 8. assessment_results

Completed assessments for clients.

```sql
CREATE TABLE assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES assessment_templates(id) ON DELETE RESTRICT,

  responses JSONB NOT NULL, -- Question IDs mapped to responses
  -- Example: { "q1": 2, "q2": 1, "q3": 3 }

  calculated_score INT,
  interpretation TEXT, -- e.g., "Moderate Depression"
  notes TEXT, -- Practitioner's observations

  assessment_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_assessment_results_practitioner_id ON assessment_results(practitioner_id);
CREATE INDEX idx_assessment_results_client_id ON assessment_results(client_id);
CREATE INDEX idx_assessment_results_template_id ON assessment_results(template_id);
CREATE INDEX idx_assessment_results_date ON assessment_results(assessment_date DESC);

-- RLS Policies
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practitioners can view own assessment results"
  ON assessment_results FOR SELECT
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can insert own assessment results"
  ON assessment_results FOR INSERT
  WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can update own assessment results"
  ON assessment_results FOR UPDATE
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can delete own assessment results"
  ON assessment_results FOR DELETE
  USING (auth.uid() = practitioner_id);
```

---

### 9. notifications

Session reminders and system notifications (generated by pg_cron).

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes(id) ON DELETE SET NULL, -- Related note

  type TEXT NOT NULL CHECK (type IN ('session_reminder', 'system', 'info')),
  title TEXT NOT NULL,
  content JSONB NOT NULL, -- Notification payload
  -- Example for session_reminder:
  -- {
  --   "scheduled_date": "2025-11-21",
  --   "previous_session_summary": "Client reported improved mood...",
  --   "follow_ups": ["Discuss coping strategies", "Review homework"],
  --   "session_count": 8
  -- }

  viewed BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_practitioner_id ON notifications(practitioner_id);
CREATE INDEX idx_notifications_client_id ON notifications(client_id);
CREATE INDEX idx_notifications_viewed ON notifications(viewed) WHERE viewed = FALSE;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practitioners can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = practitioner_id);

CREATE POLICY "Practitioners can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = practitioner_id);
```

---

## Database Functions

### 1. search_notes (Semantic Vector Search)

```sql
CREATE OR REPLACE FUNCTION search_notes(
  query_embedding vector(1536),
  filter_client_id UUID DEFAULT NULL,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  note_id UUID,
  client_id UUID,
  client_name TEXT,
  content TEXT,
  session_date TIMESTAMPTZ,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id AS note_id,
    n.client_id,
    c.full_name AS client_name,
    n.markdown_content AS content,
    n.session_date,
    1 - (ne.embedding <=> query_embedding) AS similarity
  FROM notes n
  JOIN note_embeddings ne ON ne.note_id = n.id
  JOIN clients c ON c.id = n.client_id
  WHERE 1 - (ne.embedding <=> query_embedding) > match_threshold
    AND n.practitioner_id = auth.uid() -- RLS: only own notes
    AND (filter_client_id IS NULL OR n.client_id = filter_client_id) -- Optional client filter
  ORDER BY ne.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### 1b. search_assessments (Semantic Search for Assessment Results)

```sql
-- First, add embeddings table for assessments
CREATE TABLE assessment_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_result_id UUID NOT NULL REFERENCES assessment_results(id) ON DELETE CASCADE UNIQUE,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assessment_embeddings_result_id ON assessment_embeddings(assessment_result_id);
CREATE INDEX idx_assessment_embeddings_vector ON assessment_embeddings USING hnsw (embedding vector_cosine_ops);

-- RLS
ALTER TABLE assessment_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Practitioners can view embeddings for own assessments"
  ON assessment_embeddings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM assessment_results
      WHERE assessment_results.id = assessment_embeddings.assessment_result_id
        AND assessment_results.practitioner_id = auth.uid()
    )
  );

-- Search function
CREATE OR REPLACE FUNCTION search_assessments(
  query_embedding vector(1536),
  filter_client_id UUID DEFAULT NULL,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  assessment_id UUID,
  client_id UUID,
  client_name TEXT,
  template_name TEXT,
  interpretation TEXT,
  assessment_date TIMESTAMPTZ,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ar.id AS assessment_id,
    ar.client_id,
    c.full_name AS client_name,
    at.name AS template_name,
    ar.interpretation,
    ar.assessment_date,
    1 - (ae.embedding <=> query_embedding) AS similarity
  FROM assessment_results ar
  JOIN assessment_embeddings ae ON ae.assessment_result_id = ar.id
  JOIN clients c ON c.id = ar.client_id
  JOIN assessment_templates at ON at.id = ar.template_id
  WHERE 1 - (ae.embedding <=> query_embedding) > match_threshold
    AND ar.practitioner_id = auth.uid() -- RLS
    AND (filter_client_id IS NULL OR ar.client_id = filter_client_id)
  ORDER BY ae.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

### 2. get_client_session_progress (Aggregated Progress)

```sql
CREATE OR REPLACE FUNCTION get_client_session_progress(client_uuid UUID)
RETURNS TABLE (
  total_sessions INT,
  first_session_date TIMESTAMPTZ,
  last_session_date TIMESTAMPTZ,
  avg_duration_minutes FLOAT,
  common_themes TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INT AS total_sessions,
    MIN(session_date) AS first_session_date,
    MAX(session_date) AS last_session_date,
    AVG(duration_minutes) AS avg_duration_minutes,
    NULL::TEXT[] AS common_themes -- Placeholder for future LLM-based theme extraction
  FROM notes
  WHERE client_id = client_uuid
    AND practitioner_id = auth.uid() -- RLS
    AND status = 'approved';
END;
$$;
```

---

## Triggers

### 1. Updated_at Trigger (for all tables)

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_note_templates_updated_at BEFORE UPDATE ON note_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_templates_updated_at BEFORE UPDATE ON assessment_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 2. Auto-generate Embedding on Note Save

```sql
-- Note: Embedding generation happens in application code (Next.js API route)
-- This trigger ensures embedding row exists when note is created

CREATE OR REPLACE FUNCTION create_note_embedding_placeholder()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO note_embeddings (note_id, embedding)
  VALUES (NEW.id, NULL) -- Application will update with actual embedding
  ON CONFLICT (note_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_note_embedding AFTER INSERT ON notes
  FOR EACH ROW EXECUTE FUNCTION create_note_embedding_placeholder();
```

---

## pg_cron Jobs

### Daily Session Notification Generator

```sql
-- Ensure pg_cron extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily job at 6 AM to generate session notifications
SELECT cron.schedule(
  'generate-session-notifications',
  '0 6 * * *', -- Cron expression: 6 AM daily
  $$
  INSERT INTO notifications (practitioner_id, client_id, note_id, type, title, content)
  SELECT
    n.practitioner_id,
    n.client_id,
    n.id AS note_id,
    'session_reminder' AS type,
    'Upcoming Session: ' || c.full_name AS title,
    json_build_object(
      'scheduled_date', n.next_session_date,
      'previous_session_summary', LEFT(n.markdown_content, 200), -- First 200 chars
      'follow_ups', n.follow_up_items,
      'session_count', (
        SELECT COUNT(*) FROM notes
        WHERE client_id = n.client_id AND status = 'approved'
      )
    ) AS content
  FROM notes n
  JOIN clients c ON c.id = n.client_id
  WHERE n.next_session_date = CURRENT_DATE
    AND n.follow_up_items IS NOT NULL
    AND n.status = 'approved'
    AND NOT EXISTS (
      SELECT 1 FROM notifications notif
      WHERE notif.client_id = n.client_id
        AND notif.type = 'session_reminder'
        AND notif.created_at::date = CURRENT_DATE
    );
  $$
);
```

---

## Data Retention Policy

Per FR-023, notes and client data must be retained for 7 years.

### Archive Strategy

```sql
-- Soft delete: Mark clients/notes as archived instead of hard deletion
ALTER TABLE clients ADD COLUMN archived_at TIMESTAMPTZ;
ALTER TABLE notes ADD COLUMN archived_at TIMESTAMPTZ;

-- RLS policies updated to filter archived records by default
CREATE POLICY "Practitioners cannot view archived clients"
  ON clients FOR SELECT
  USING (auth.uid() = practitioner_id AND archived_at IS NULL);

-- Hard deletion after 7 years (optional pg_cron job)
SELECT cron.schedule(
  'purge-old-records',
  '0 2 1 * *', -- Monthly at 2 AM on the 1st
  $$
  DELETE FROM clients
  WHERE archived_at < NOW() - INTERVAL '7 years';

  DELETE FROM notes
  WHERE archived_at < NOW() - INTERVAL '7 years';
  $$
);
```

---

## TypeScript Type Generation

Generate TypeScript types from Supabase schema:

```bash
npx supabase gen types typescript --local > lib/types/database.types.ts
```

Example usage:
```typescript
import type { Database } from '@/lib/types/database.types'

type Client = Database['public']['Tables']['clients']['Row']
type NoteInsert = Database['public']['Tables']['notes']['Insert']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
```

---

## Summary

This data model supports:
- ✅ Single-practitioner accounts with RLS data isolation
- ✅ Client management with full-text search
- ✅ Markdown-based notes with template structure
- ✅ LLM conversation history for note extraction
- ✅ Semantic search with pgvector embeddings
- ✅ Assessment templates with automatic scoring
- ✅ Session notifications via pg_cron
- ✅ 7-year data retention policy

All tables enforce Row Level Security to ensure practitioners can only access their own data, complying with constitutional security principles.
