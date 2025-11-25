-- ============================================================================
-- migration: 20251121125803_vector_extension.sql
-- description: enable pgvector extension and create vector columns with hnsw indexes
-- purpose: enable semantic search across notes and assessments (user story 5)
-- affected tables: note_embeddings, assessment_embeddings
-- special considerations:
--   - replaces placeholder text columns with vector(1536) for openai embeddings
--   - hnsw indexes provide fast approximate nearest neighbor search
--   - cosine distance operator (<=>) used for similarity calculations
--   - search functions enforce rls through practitioner_id filtering
-- ============================================================================

-- enable pgvector extension
create extension if not exists vector;

-- ============================================================================
-- alter note_embeddings: add vector column for embeddings
-- description: replace placeholder with actual vector(1536) column
-- dimension: 1536 matches openai text-embedding-3-small model output
-- ============================================================================

-- drop placeholder column
alter table note_embeddings drop column if exists embedding_placeholder;

-- add vector column
alter table note_embeddings add column embedding vector(1536);

-- create hnsw index for fast similarity search
-- m=16: number of connections per layer (higher = more accurate, slower build)
-- ef_construction=64: size of dynamic candidate list (higher = more accurate, slower build)
create index idx_note_embeddings_vector
  on note_embeddings
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- ============================================================================
-- alter assessment_embeddings: add vector column for embeddings
-- description: replace placeholder with actual vector(1536) column
-- ============================================================================

-- drop placeholder column
alter table assessment_embeddings drop column if exists embedding_placeholder;

-- add vector column
alter table assessment_embeddings add column embedding vector(1536);

-- create hnsw index for fast similarity search
create index idx_assessment_embeddings_vector
  on assessment_embeddings
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- ============================================================================
-- function: search_notes
-- description: semantic vector search across practitioner's notes
-- parameters:
--   - query_embedding: vector(1536) from user's natural language query
--   - filter_client_id: optional uuid to scope search to specific client
--   - match_threshold: minimum similarity score (0-1, default 0.7)
--   - match_count: maximum number of results (default 10)
-- returns: table with note details and similarity scores
-- security: enforces practitioner_id = auth.uid() for data isolation
-- ============================================================================

create or replace function search_notes(
  query_embedding vector(1536),
  filter_client_id uuid default null,
  match_threshold float default 0.7,
  match_count int default 10
)
returns table (
  note_id uuid,
  client_id uuid,
  client_name text,
  content text,
  session_date timestamptz,
  similarity float
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    n.id as note_id,
    n.client_id,
    c.full_name as client_name,
    n.markdown_content as content,
    n.session_date,
    1 - (ne.embedding <=> query_embedding) as similarity
  from notes n
  join note_embeddings ne on ne.note_id = n.id
  join clients c on c.id = n.client_id
  where 1 - (ne.embedding <=> query_embedding) > match_threshold
    and n.practitioner_id = auth.uid() -- rls: only own notes
    and (filter_client_id is null or n.client_id = filter_client_id) -- optional client filter
    and ne.embedding is not null -- only search notes with embeddings
  order by ne.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ============================================================================
-- function: search_assessments
-- description: semantic vector search across practitioner's assessment results
-- parameters:
--   - query_embedding: vector(1536) from user's natural language query
--   - filter_client_id: optional uuid to scope search to specific client
--   - match_threshold: minimum similarity score (0-1, default 0.7)
--   - match_count: maximum number of results (default 10)
-- returns: table with assessment details and similarity scores
-- security: enforces practitioner_id = auth.uid() for data isolation
-- ============================================================================

create or replace function search_assessments(
  query_embedding vector(1536),
  filter_client_id uuid default null,
  match_threshold float default 0.7,
  match_count int default 10
)
returns table (
  assessment_id uuid,
  client_id uuid,
  client_name text,
  template_name text,
  interpretation text,
  assessment_date timestamptz,
  similarity float
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    ar.id as assessment_id,
    ar.client_id,
    c.full_name as client_name,
    at.name as template_name,
    ar.interpretation,
    ar.assessment_date,
    1 - (ae.embedding <=> query_embedding) as similarity
  from assessment_results ar
  join assessment_embeddings ae on ae.assessment_result_id = ar.id
  join clients c on c.id = ar.client_id
  join assessment_templates at on at.id = ar.template_id
  where 1 - (ae.embedding <=> query_embedding) > match_threshold
    and ar.practitioner_id = auth.uid() -- rls: only own assessments
    and (filter_client_id is null or ar.client_id = filter_client_id) -- optional client filter
    and ae.embedding is not null -- only search assessments with embeddings
  order by ae.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- ============================================================================
-- function: get_client_session_progress
-- description: aggregate session statistics for a client
-- parameters:
--   - client_uuid: uuid of the client
-- returns: table with session progress metrics
-- security: enforces practitioner_id = auth.uid() through rls on notes table
-- ============================================================================

create or replace function get_client_session_progress(client_uuid uuid)
returns table (
  total_sessions int,
  first_session_date timestamptz,
  last_session_date timestamptz,
  avg_duration_minutes float,
  common_themes text[]
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    count(*)::int as total_sessions,
    min(session_date) as first_session_date,
    max(session_date) as last_session_date,
    avg(duration_minutes) as avg_duration_minutes,
    null::text[] as common_themes -- placeholder for future llm-based theme extraction
  from notes
  where client_id = client_uuid
    and practitioner_id = auth.uid() -- rls enforcement
    and status = 'approved';
end;
$$;
