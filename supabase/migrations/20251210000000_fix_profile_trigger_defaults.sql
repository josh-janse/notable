-- ============================================================================
-- migration: 20251210000000_fix_profile_trigger_defaults.sql
-- description: fix profile trigger to use NULL instead of 'New' and 'User'
-- purpose: allow profiles without first/last names to display correctly
-- affected tables: profiles
-- special considerations:
--   - removes 'New' and 'User' fallback values
--   - allows first_name and last_name to be NULL if not in metadata
-- ============================================================================

-- update function to handle new user profile creation with NULL defaults
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- insert new profile record using auth.users metadata
  -- supports both first_name/last_name and given_name/family_name (Google OAuth)
  insert into public.profiles (id, first_name, last_name, timezone, preferences)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'first_name',
      new.raw_user_meta_data->>'given_name'
    ),
    coalesce(
      new.raw_user_meta_data->>'last_name',
      new.raw_user_meta_data->>'family_name'
    ),
    coalesce(new.raw_user_meta_data->>'timezone', 'UTC'),
    coalesce(new.raw_user_meta_data->'preferences', '{}'::jsonb)
  );
  return new;
end;
$$;

-- add comment explaining the updated trigger
comment on function public.handle_new_user() is 'automatically creates a profile record when a new user signs up via auth.users, allowing NULL first_name and last_name';

-- note: cleanup statement omitted since db resets are expected in development
-- for production, add: update public.profiles set first_name=null, last_name=null where first_name='New' and last_name='User';
