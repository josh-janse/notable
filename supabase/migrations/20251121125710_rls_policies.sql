-- ============================================================================
-- migration: 20251121125710_rls_policies.sql
-- description: create row level security policies for all tables
-- purpose: enforce practitioner-based data isolation per constitutional security principle
-- affected tables: profiles, clients, note_templates, notes, note_conversations,
--                  note_embeddings, assessment_templates, assessment_results,
--                  assessment_embeddings
-- special considerations:
--   - all policies are granular (one per operation: select, insert, update, delete)
--   - templates (note_templates, assessment_templates) are publicly readable
--   - all other data is strictly isolated by practitioner_id
--   - nested queries ensure embeddings/conversations inherit parent row security
-- ============================================================================

-- ============================================================================
-- profiles: practitioners can only access their own profile
-- rationale: users should only see and modify their own practitioner metadata
-- ============================================================================

create policy "authenticated users can view own profile"
  on profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "authenticated users can update own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id);

-- ============================================================================
-- clients: practitioners can only access their own clients
-- rationale: single-practitioner model requires strict data isolation
-- ============================================================================

create policy "authenticated practitioners can view own clients"
  on clients for select
  to authenticated
  using (auth.uid() = practitioner_id);

create policy "authenticated practitioners can insert own clients"
  on clients for insert
  to authenticated
  with check (auth.uid() = practitioner_id);

create policy "authenticated practitioners can update own clients"
  on clients for update
  to authenticated
  using (auth.uid() = practitioner_id);

create policy "authenticated practitioners can delete own clients"
  on clients for delete
  to authenticated
  using (auth.uid() = practitioner_id);

-- ============================================================================
-- note_templates: publicly readable system-wide templates
-- rationale: templates are shared resources available to all practitioners
-- ============================================================================

create policy "authenticated users can view active note templates"
  on note_templates for select
  to authenticated
  using (is_active = true);

-- ============================================================================
-- notes: practitioners can only access notes for their own clients
-- rationale: notes contain sensitive client information requiring strict isolation
-- ============================================================================

create policy "authenticated practitioners can view own notes"
  on notes for select
  to authenticated
  using (auth.uid() = practitioner_id);

create policy "authenticated practitioners can insert own notes"
  on notes for insert
  to authenticated
  with check (auth.uid() = practitioner_id);

create policy "authenticated practitioners can update own notes"
  on notes for update
  to authenticated
  using (auth.uid() = practitioner_id);

create policy "authenticated practitioners can delete own notes"
  on notes for delete
  to authenticated
  using (auth.uid() = practitioner_id);

-- ============================================================================
-- note_conversations: inherit security from parent note
-- rationale: conversations are part of note workflow and must follow note access rules
-- ============================================================================

create policy "authenticated practitioners can view conversations for own notes"
  on note_conversations for select
  to authenticated
  using (
    exists (
      select 1 from notes
      where notes.id = note_conversations.note_id
        and notes.practitioner_id = auth.uid()
    )
  );

create policy "authenticated practitioners can insert conversations for own notes"
  on note_conversations for insert
  to authenticated
  with check (
    exists (
      select 1 from notes
      where notes.id = note_conversations.note_id
        and notes.practitioner_id = auth.uid()
    )
  );

-- ============================================================================
-- note_embeddings: inherit security from parent note
-- rationale: embeddings are derived from notes and must follow note access rules
-- ============================================================================

create policy "authenticated practitioners can view embeddings for own notes"
  on note_embeddings for select
  to authenticated
  using (
    exists (
      select 1 from notes
      where notes.id = note_embeddings.note_id
        and notes.practitioner_id = auth.uid()
    )
  );

create policy "authenticated practitioners can insert embeddings for own notes"
  on note_embeddings for insert
  to authenticated
  with check (
    exists (
      select 1 from notes
      where notes.id = note_embeddings.note_id
        and notes.practitioner_id = auth.uid()
    )
  );

create policy "authenticated practitioners can update embeddings for own notes"
  on note_embeddings for update
  to authenticated
  using (
    exists (
      select 1 from notes
      where notes.id = note_embeddings.note_id
        and notes.practitioner_id = auth.uid()
    )
  );

-- ============================================================================
-- assessment_templates: publicly readable system-wide templates
-- rationale: templates are shared resources available to all practitioners
-- ============================================================================

create policy "authenticated users can view active assessment templates"
  on assessment_templates for select
  to authenticated
  using (is_active = true);

-- ============================================================================
-- assessment_results: practitioners can only access their own assessment results
-- rationale: assessment results contain sensitive client data requiring strict isolation
-- ============================================================================

create policy "authenticated practitioners can view own assessment results"
  on assessment_results for select
  to authenticated
  using (auth.uid() = practitioner_id);

create policy "authenticated practitioners can insert own assessment results"
  on assessment_results for insert
  to authenticated
  with check (auth.uid() = practitioner_id);

create policy "authenticated practitioners can update own assessment results"
  on assessment_results for update
  to authenticated
  using (auth.uid() = practitioner_id);

create policy "authenticated practitioners can delete own assessment results"
  on assessment_results for delete
  to authenticated
  using (auth.uid() = practitioner_id);

-- ============================================================================
-- assessment_embeddings: inherit security from parent assessment result
-- rationale: embeddings are derived from assessments and must follow assessment access rules
-- ============================================================================

create policy "authenticated practitioners can view embeddings for own assessments"
  on assessment_embeddings for select
  to authenticated
  using (
    exists (
      select 1 from assessment_results
      where assessment_results.id = assessment_embeddings.assessment_result_id
        and assessment_results.practitioner_id = auth.uid()
    )
  );

create policy "authenticated practitioners can insert embeddings for own assessments"
  on assessment_embeddings for insert
  to authenticated
  with check (
    exists (
      select 1 from assessment_results
      where assessment_results.id = assessment_embeddings.assessment_result_id
        and assessment_results.practitioner_id = auth.uid()
    )
  );

create policy "authenticated practitioners can update embeddings for own assessments"
  on assessment_embeddings for update
  to authenticated
  using (
    exists (
      select 1 from assessment_results
      where assessment_results.id = assessment_embeddings.assessment_result_id
        and assessment_results.practitioner_id = auth.uid()
    )
  );
