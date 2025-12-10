-- ============================================================================
-- migration: 20251125161000_make_structure_nullable.sql
-- description: make structure column nullable in note_templates
-- purpose: allow templates to use either structure or markdown_template/field_schema
-- affected tables: note_templates
-- special considerations:
--   - existing templates with structure will remain unchanged
--   - new templates can use markdown_template + field_schema instead
-- ============================================================================

-- remove not null constraint from structure column
alter table note_templates
alter column structure drop not null;

-- add comment explaining the change
comment on column note_templates.structure is 'legacy json structure field, now optional. use markdown_template and field_schema for new templates';
