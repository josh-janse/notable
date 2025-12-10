-- ============================================================================
-- migration: 20251125160800_create_profile_trigger.sql
-- description: automatically create profile when user signs up
-- purpose: ensure every auth.users record has a corresponding profiles record
-- affected tables: profiles
-- special considerations:
--   - trigger runs on insert to auth.users
--   - uses first_name/last_name from user metadata if available
--   - falls back to 'New' and 'User' if metadata not provided
-- ============================================================================

-- create function to handle new user profile creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- insert new profile record using auth.users metadata
  insert into public.profiles (id, first_name, last_name, timezone, preferences)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', 'New'),
    coalesce(new.raw_user_meta_data->>'last_name', 'User'),
    coalesce(new.raw_user_meta_data->>'timezone', 'UTC'),
    coalesce(new.raw_user_meta_data->'preferences', '{}'::jsonb)
  );
  return new;
end;
$$;

-- create trigger to automatically create profile on user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- add comment explaining the trigger
comment on function public.handle_new_user() is 'automatically creates a profile record when a new user signs up via auth.users';
