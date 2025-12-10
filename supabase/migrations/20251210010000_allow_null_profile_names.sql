-- ============================================================================
-- migration: 20251210010000_allow_null_profile_names.sql
-- description: remove not null constraints from profile names
-- purpose: support the updated handle_new_user trigger which allows null names
-- affected tables: profiles
-- ============================================================================

-- remove not null constraint from first_name
alter table profiles
alter column first_name drop not null;

-- remove not null constraint from last_name
alter table profiles
alter column last_name drop not null;

-- add comments explaining the columns can now be null
comment on column profiles.first_name is 'first name of the practitioner, can be null for new users';
comment on column profiles.last_name is 'last name of the practitioner, can be null for new users';
