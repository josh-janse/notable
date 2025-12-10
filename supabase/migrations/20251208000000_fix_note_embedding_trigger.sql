-- ============================================================================
-- migration: 20251208000000_fix_note_embedding_trigger.sql
-- description: fix note_embeddings trigger to work with vector column
-- purpose: update trigger to insert into 'embedding' column instead of 'embedding_placeholder'
-- ============================================================================

-- drop old trigger function and recreate with correct column
create or replace function create_note_embedding_placeholder()
returns trigger as $$
begin
  insert into note_embeddings (note_id, embedding)
  values (new.id, null)
  on conflict (note_id) do nothing;
  return new;
end;
$$ language plpgsql;

-- trigger already exists, no need to recreate
-- create trigger create_note_embedding
--   after insert on notes
--   for each row execute function create_note_embedding_placeholder();
