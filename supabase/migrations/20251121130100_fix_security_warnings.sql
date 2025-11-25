-- ============================================================================
-- migration: 20251121130100_fix_security_warnings.sql
-- description: fix supabase studio linter warnings for security and organization
-- purpose: resolve function_search_path_mutable and extension_in_public warnings
-- affected: trigger functions, extensions schema
-- special considerations:
--   - recreates trigger functions with immutable search_path (security critical)
--   - moves extensions to dedicated schema per best practices
--   - preserves all existing functionality and data
-- ============================================================================

-- ============================================================================
-- fix 1: function_search_path_mutable (CRITICAL SECURITY)
-- description: add immutable search_path to prevent sql injection attacks
-- rationale: mutable search_path allows attackers to hijack function behavior
--            by manipulating the schema search order
-- ============================================================================

-- recreate update_updated_at_column() with immutable search_path
create or replace function update_updated_at_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- recreate create_note_embedding_placeholder() with immutable search_path
create or replace function create_note_embedding_placeholder()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into note_embeddings (note_id, embedding_placeholder)
  values (new.id, null)
  on conflict (note_id) do nothing;
  return new;
end;
$$;

-- ============================================================================
-- fix 2: extension_in_public (ORGANIZATION)
-- description: move extensions from public schema to dedicated extensions schema
-- rationale: separating extensions from application tables improves organization
--            and follows postgresql/supabase best practices
-- ============================================================================

-- create dedicated schema for extensions
create schema if not exists extensions;

-- move pg_trgm extension (used for client name fuzzy search)
alter extension pg_trgm set schema extensions;

-- move vector extension (used for semantic search embeddings)
alter extension vector set schema extensions;

-- grant usage on extensions schema to authenticated users
grant usage on schema extensions to authenticated, anon;

-- ============================================================================
-- verification queries (for manual testing after migration)
-- ============================================================================

-- verify functions have immutable search_path:
-- select proname, prosecdef, proconfig
-- from pg_proc
-- where proname in ('update_updated_at_column', 'create_note_embedding_placeholder');

-- verify extensions moved to extensions schema:
-- select extname, nspname
-- from pg_extension e
-- join pg_namespace n on e.extnamespace = n.oid
-- where extname in ('pg_trgm', 'vector');
