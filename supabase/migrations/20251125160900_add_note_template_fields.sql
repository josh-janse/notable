-- ============================================================================
-- migration: 20251125160900_add_note_template_fields.sql
-- description: add template_type, markdown_template, field_schema, and category columns to note_templates
-- purpose: support different template types and markdown-based templates with json schemas
-- affected tables: note_templates
-- special considerations:
--   - adds new columns without dropping existing structure column
--   - allows both old structure and new fields to coexist during migration
-- ============================================================================

-- add template_type column for categorizing templates (soap, progress, initial, etc.)
alter table note_templates
add column if not exists template_type text;

-- add markdown_template column to store markdown content
alter table note_templates
add column if not exists markdown_template text;

-- add field_schema column for json schema definition
alter table note_templates
add column if not exists field_schema jsonb;

-- add category column for grouping templates
alter table note_templates
add column if not exists category text;

-- add index on template_type for efficient filtering
create index if not exists idx_note_templates_type on note_templates(template_type);

-- add index on category for grouping
create index if not exists idx_note_templates_category on note_templates(category);

-- add comment explaining the new columns
comment on column note_templates.template_type is 'type of template: soap, progress, initial, etc.';
comment on column note_templates.markdown_template is 'markdown content with placeholders for field population';
comment on column note_templates.field_schema is 'json schema defining extractable fields for llm';
comment on column note_templates.category is 'category for grouping templates: clinical, intake, discharge, etc.';
