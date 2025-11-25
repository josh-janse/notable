-- ============================================================================
-- migration: 20251121125431_initial_schema.sql
-- description: create base tables for process note-taking application
-- purpose: establish core data model for practitioners, clients, notes, and assessments
-- affected tables: profiles, clients, note_templates, notes, note_conversations,
--                  note_embeddings, assessment_templates, assessment_results,
--                  assessment_embeddings
-- special considerations:
--   - rls is enabled on all tables but policies defined in separate migration
--   - embedding columns are placeholders until vector extension added
--   - triggers automatically update updated_at timestamps
-- ============================================================================

-- enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- trigram search for client names

-- ============================================================================
-- table: profiles
-- description: extends auth.users with practitioner-specific metadata
-- ============================================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  timezone text default 'UTC',
  preferences jsonb default '{}', -- ui preferences, notification settings
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_profiles_id on profiles(id);

-- enable rls (policies defined in migration 0002)
alter table profiles enable row level security;

-- ============================================================================
-- table: clients
-- description: client profiles managed by practitioners
-- data isolation: practitioner_id foreign key ensures single-practitioner model
-- ============================================================================

create table clients (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references profiles(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  date_of_birth date,
  initial_assessment_date date,
  status text default 'active' check (status in ('active', 'inactive', 'archived')),
  notes_summary text, -- brief overview for quick reference
  metadata jsonb default '{}', -- additional custom fields
  archived_at timestamptz, -- soft delete timestamp for 7-year retention
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_clients_practitioner_id on clients(practitioner_id);
create index idx_clients_status on clients(status);
create index idx_clients_full_name_trgm on clients using gin (full_name gin_trgm_ops); -- fuzzy search support

-- enable rls (policies defined in migration 0002)
alter table clients enable row level security;

-- ============================================================================
-- table: note_templates
-- description: predefined note structures (soap, progress notes, etc.)
-- access: public/system-wide templates available to all practitioners
-- ============================================================================

create table note_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, -- e.g., 'SOAP Note', 'Progress Note'
  description text,
  structure jsonb not null, -- template schema with locked headers and sections
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_note_templates_active on note_templates(is_active);

-- enable rls (policies defined in migration 0002)
alter table note_templates enable row level security;

-- ============================================================================
-- table: notes
-- description: session notes with markdown content and metadata
-- security: practitioner_id ensures data isolation per constitutional principle
-- ============================================================================

create table notes (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references profiles(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  template_id uuid references note_templates(id) on delete set null,

  -- note content
  markdown_content text, -- full markdown note with template structure
  raw_transcription text, -- original deepgram transcription
  extracted_fields jsonb default '{}', -- llm-extracted structured data

  -- metadata
  status text default 'draft' check (status in ('draft', 'completed', 'approved')),
  session_date timestamptz default now(),
  next_session_date date, -- for follow-up notifications (us4)
  follow_up_items text[], -- specific commitments for next session (us4)
  duration_minutes int, -- session length

  -- timestamps
  created_at timestamptz default now(),
  approved_at timestamptz, -- timestamp when practitioner approves note
  archived_at timestamptz, -- soft delete for 7-year retention
  updated_at timestamptz default now()
);

create index idx_notes_practitioner_id on notes(practitioner_id);
create index idx_notes_client_id on notes(client_id);
create index idx_notes_status on notes(status);
create index idx_notes_session_date on notes(session_date desc);
create index idx_notes_next_session_date on notes(next_session_date) where next_session_date is not null; -- partial index for notifications
create index idx_notes_full_text on notes using gin (to_tsvector('english', markdown_content)); -- full-text search

-- enable rls (policies defined in migration 0002)
alter table notes enable row level security;

-- ============================================================================
-- table: note_conversations
-- description: llm chat history for each note (follow-up questions, clarifications)
-- purpose: saves conversation context between practitioner and llm during note creation
-- ============================================================================

create table note_conversations (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references notes(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);

create index idx_note_conversations_note_id on note_conversations(note_id);
create index idx_note_conversations_created_at on note_conversations(created_at);

-- enable rls (policies defined in migration 0002)
alter table note_conversations enable row level security;

-- ============================================================================
-- table: note_embeddings
-- description: placeholder for pgvector embeddings (vector type added in migration 0003)
-- purpose: enables semantic search across notes (us5)
-- ============================================================================

create table note_embeddings (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references notes(id) on delete cascade unique,
  embedding_placeholder text, -- replaced with vector(1536) in migration 0003
  created_at timestamptz default now()
);

create index idx_note_embeddings_note_id on note_embeddings(note_id);
-- hnsw vector index created in migration 0003

-- enable rls (policies defined in migration 0002)
alter table note_embeddings enable row level security;

-- ============================================================================
-- table: assessment_templates
-- description: standardized assessment/screening tools (e.g., phq-9, gad-7)
-- access: public/system-wide templates available to all practitioners
-- ============================================================================

create table assessment_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  category text, -- e.g., 'depression', 'anxiety', 'general'
  questions jsonb not null, -- array of question objects with scoring
  scoring_rules jsonb, -- scoring algorithm and interpretation ranges
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_assessment_templates_active on assessment_templates(is_active);
create index idx_assessment_templates_category on assessment_templates(category);

-- enable rls (policies defined in migration 0002)
alter table assessment_templates enable row level security;

-- ============================================================================
-- table: assessment_results
-- description: completed assessments for clients
-- security: practitioner_id ensures data isolation
-- ============================================================================

create table assessment_results (
  id uuid primary key default gen_random_uuid(),
  practitioner_id uuid not null references profiles(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  template_id uuid not null references assessment_templates(id) on delete restrict,
  responses jsonb not null, -- question ids mapped to responses
  calculated_score int,
  interpretation text, -- e.g., "moderate depression"
  notes text, -- practitioner's observations
  assessment_date timestamptz default now(),
  created_at timestamptz default now()
);

create index idx_assessment_results_practitioner_id on assessment_results(practitioner_id);
create index idx_assessment_results_client_id on assessment_results(client_id);
create index idx_assessment_results_template_id on assessment_results(template_id);
create index idx_assessment_results_date on assessment_results(assessment_date desc);

-- enable rls (policies defined in migration 0002)
alter table assessment_results enable row level security;

-- ============================================================================
-- table: assessment_embeddings
-- description: placeholder for pgvector embeddings for assessments
-- purpose: enables semantic search across assessments (us5)
-- ============================================================================

create table assessment_embeddings (
  id uuid primary key default gen_random_uuid(),
  assessment_result_id uuid not null references assessment_results(id) on delete cascade unique,
  embedding_placeholder text, -- replaced with vector(1536) in migration 0003
  created_at timestamptz default now()
);

create index idx_assessment_embeddings_result_id on assessment_embeddings(assessment_result_id);
-- hnsw vector index created in migration 0003

-- enable rls (policies defined in migration 0002)
alter table assessment_embeddings enable row level security;

-- ============================================================================
-- triggers: updated_at timestamp automation
-- description: automatically updates updated_at column on row updates
-- ============================================================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- apply to relevant tables
create trigger update_profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at_column();

create trigger update_clients_updated_at
  before update on clients
  for each row execute function update_updated_at_column();

create trigger update_notes_updated_at
  before update on notes
  for each row execute function update_updated_at_column();

create trigger update_note_templates_updated_at
  before update on note_templates
  for each row execute function update_updated_at_column();

create trigger update_assessment_templates_updated_at
  before update on assessment_templates
  for each row execute function update_updated_at_column();

-- ============================================================================
-- trigger: auto-create embedding placeholder on note creation
-- description: ensures every note has an embedding row ready for vector population
-- ============================================================================

create or replace function create_note_embedding_placeholder()
returns trigger as $$
begin
  insert into note_embeddings (note_id, embedding_placeholder)
  values (new.id, null)
  on conflict (note_id) do nothing;
  return new;
end;
$$ language plpgsql;

create trigger create_note_embedding
  after insert on notes
  for each row execute function create_note_embedding_placeholder();
