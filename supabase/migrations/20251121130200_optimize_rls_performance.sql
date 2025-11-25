-- ============================================================================
-- migration: 20251121130200_optimize_rls_performance.sql
-- description: optimize rls policies to prevent auth.uid() re-evaluation per row
-- purpose: resolve auth_rls_initplan performance warnings from supabase linter
-- affected tables: profiles, clients, notes, note_conversations, note_embeddings,
--                  assessment_results, assessment_embeddings, notifications
-- special considerations:
--   - wraps auth.uid() in subquery: (select auth.uid())
--   - prevents function re-evaluation for each row (initplan optimization)
--   - no functional changes, purely performance improvement
--   - drops and recreates all policies with optimized syntax
-- ============================================================================

-- ============================================================================
-- profiles: drop existing policies
-- ============================================================================

drop policy if exists "authenticated users can view own profile" on profiles;
drop policy if exists "authenticated users can update own profile" on profiles;

-- ============================================================================
-- profiles: recreate with optimized auth.uid()
-- ============================================================================

create policy "authenticated users can view own profile"
  on profiles for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "authenticated users can update own profile"
  on profiles for update
  to authenticated
  using ((select auth.uid()) = id);

-- ============================================================================
-- clients: drop existing policies
-- ============================================================================

drop policy if exists "authenticated practitioners can view own clients" on clients;
drop policy if exists "authenticated practitioners can insert own clients" on clients;
drop policy if exists "authenticated practitioners can update own clients" on clients;
drop policy if exists "authenticated practitioners can delete own clients" on clients;

-- ============================================================================
-- clients: recreate with optimized auth.uid()
-- ============================================================================

create policy "authenticated practitioners can view own clients"
  on clients for select
  to authenticated
  using ((select auth.uid()) = practitioner_id);

create policy "authenticated practitioners can insert own clients"
  on clients for insert
  to authenticated
  with check ((select auth.uid()) = practitioner_id);

create policy "authenticated practitioners can update own clients"
  on clients for update
  to authenticated
  using ((select auth.uid()) = practitioner_id);

create policy "authenticated practitioners can delete own clients"
  on clients for delete
  to authenticated
  using ((select auth.uid()) = practitioner_id);

-- ============================================================================
-- notes: drop existing policies
-- ============================================================================

drop policy if exists "authenticated practitioners can view own notes" on notes;
drop policy if exists "authenticated practitioners can insert own notes" on notes;
drop policy if exists "authenticated practitioners can update own notes" on notes;
drop policy if exists "authenticated practitioners can delete own notes" on notes;

-- ============================================================================
-- notes: recreate with optimized auth.uid()
-- ============================================================================

create policy "authenticated practitioners can view own notes"
  on notes for select
  to authenticated
  using ((select auth.uid()) = practitioner_id);

create policy "authenticated practitioners can insert own notes"
  on notes for insert
  to authenticated
  with check ((select auth.uid()) = practitioner_id);

create policy "authenticated practitioners can update own notes"
  on notes for update
  to authenticated
  using ((select auth.uid()) = practitioner_id);

create policy "authenticated practitioners can delete own notes"
  on notes for delete
  to authenticated
  using ((select auth.uid()) = practitioner_id);

-- ============================================================================
-- note_conversations: drop existing policies
-- ============================================================================

drop policy if exists "authenticated practitioners can view conversations for own notes" on note_conversations;
drop policy if exists "authenticated practitioners can view conversations for own note" on note_conversations;
drop policy if exists "authenticated practitioners can insert conversations for own notes" on note_conversations;
drop policy if exists "authenticated practitioners can insert conversations for own no" on note_conversations;

-- ============================================================================
-- note_conversations: recreate with optimized auth.uid()
-- ============================================================================

create policy "authenticated practitioners can view conversations for own notes"
  on note_conversations for select
  to authenticated
  using (
    exists (
      select 1 from notes
      where notes.id = note_conversations.note_id
        and notes.practitioner_id = (select auth.uid())
    )
  );

create policy "authenticated practitioners can insert conversations for own notes"
  on note_conversations for insert
  to authenticated
  with check (
    exists (
      select 1 from notes
      where notes.id = note_conversations.note_id
        and notes.practitioner_id = (select auth.uid())
    )
  );

-- ============================================================================
-- note_embeddings: drop existing policies
-- ============================================================================

drop policy if exists "authenticated practitioners can view embeddings for own notes" on note_embeddings;
drop policy if exists "authenticated practitioners can insert embeddings for own notes" on note_embeddings;
drop policy if exists "authenticated practitioners can update embeddings for own notes" on note_embeddings;

-- ============================================================================
-- note_embeddings: recreate with optimized auth.uid()
-- ============================================================================

create policy "authenticated practitioners can view embeddings for own notes"
  on note_embeddings for select
  to authenticated
  using (
    exists (
      select 1 from notes
      where notes.id = note_embeddings.note_id
        and notes.practitioner_id = (select auth.uid())
    )
  );

create policy "authenticated practitioners can insert embeddings for own notes"
  on note_embeddings for insert
  to authenticated
  with check (
    exists (
      select 1 from notes
      where notes.id = note_embeddings.note_id
        and notes.practitioner_id = (select auth.uid())
    )
  );

create policy "authenticated practitioners can update embeddings for own notes"
  on note_embeddings for update
  to authenticated
  using (
    exists (
      select 1 from notes
      where notes.id = note_embeddings.note_id
        and notes.practitioner_id = (select auth.uid())
    )
  );

-- ============================================================================
-- assessment_results: drop existing policies
-- ============================================================================

drop policy if exists "authenticated practitioners can view own assessment results" on assessment_results;
drop policy if exists "authenticated practitioners can insert own assessment results" on assessment_results;
drop policy if exists "authenticated practitioners can update own assessment results" on assessment_results;
drop policy if exists "authenticated practitioners can delete own assessment results" on assessment_results;

-- ============================================================================
-- assessment_results: recreate with optimized auth.uid()
-- ============================================================================

create policy "authenticated practitioners can view own assessment results"
  on assessment_results for select
  to authenticated
  using ((select auth.uid()) = practitioner_id);

create policy "authenticated practitioners can insert own assessment results"
  on assessment_results for insert
  to authenticated
  with check ((select auth.uid()) = practitioner_id);

create policy "authenticated practitioners can update own assessment results"
  on assessment_results for update
  to authenticated
  using ((select auth.uid()) = practitioner_id);

create policy "authenticated practitioners can delete own assessment results"
  on assessment_results for delete
  to authenticated
  using ((select auth.uid()) = practitioner_id);

-- ============================================================================
-- assessment_embeddings: drop existing policies
-- ============================================================================

drop policy if exists "authenticated practitioners can view embeddings for own assessments" on assessment_embeddings;
drop policy if exists "authenticated practitioners can view embeddings for own assessm" on assessment_embeddings;
drop policy if exists "authenticated practitioners can insert embeddings for own assessments" on assessment_embeddings;
drop policy if exists "authenticated practitioners can insert embeddings for own asses" on assessment_embeddings;
drop policy if exists "authenticated practitioners can update embeddings for own assessments" on assessment_embeddings;
drop policy if exists "authenticated practitioners can update embeddings for own asses" on assessment_embeddings;

-- ============================================================================
-- assessment_embeddings: recreate with optimized auth.uid()
-- ============================================================================

create policy "authenticated practitioners can view embeddings for own assessments"
  on assessment_embeddings for select
  to authenticated
  using (
    exists (
      select 1 from assessment_results
      where assessment_results.id = assessment_embeddings.assessment_result_id
        and assessment_results.practitioner_id = (select auth.uid())
    )
  );

create policy "authenticated practitioners can insert embeddings for own assessments"
  on assessment_embeddings for insert
  to authenticated
  with check (
    exists (
      select 1 from assessment_results
      where assessment_results.id = assessment_embeddings.assessment_result_id
        and assessment_results.practitioner_id = (select auth.uid())
    )
  );

create policy "authenticated practitioners can update embeddings for own assessments"
  on assessment_embeddings for update
  to authenticated
  using (
    exists (
      select 1 from assessment_results
      where assessment_results.id = assessment_embeddings.assessment_result_id
        and assessment_results.practitioner_id = (select auth.uid())
    )
  );

-- ============================================================================
-- notifications: drop existing policies
-- ============================================================================

drop policy if exists "authenticated practitioners can view own notifications" on notifications;
drop policy if exists "authenticated practitioners can update own notifications" on notifications;

-- ============================================================================
-- notifications: recreate with optimized auth.uid()
-- ============================================================================

create policy "authenticated practitioners can view own notifications"
  on notifications for select
  to authenticated
  using ((select auth.uid()) = practitioner_id);

create policy "authenticated practitioners can update own notifications"
  on notifications for update
  to authenticated
  using ((select auth.uid()) = practitioner_id);

-- ============================================================================
-- verification queries (for manual testing after migration)
-- ============================================================================

-- verify all policies use subquery pattern:
-- select schemaname, tablename, policyname, qual, with_check
-- from pg_policies
-- where schemaname = 'public'
-- order by tablename, policyname;

-- check for any remaining non-optimized auth.uid() calls:
-- select schemaname, tablename, policyname
-- from pg_policies
-- where schemaname = 'public'
--   and (qual like '%auth.uid()%' or with_check like '%auth.uid()%')
--   and (qual not like '%(select auth.uid())%' and with_check not like '%(select auth.uid())%');
