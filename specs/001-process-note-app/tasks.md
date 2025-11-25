# Tasks: Process Note-Taking Application

**Input**: Design documents from `/specs/001-process-note-app/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-routes.md

**Tests**: Not included per constitution - testing is optional and not mandatory for MVP

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure) ✅ COMPLETE

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize Next.js 16 project structure per plan.md with App Router and TypeScript strict mode
- [x] T002 [P] Install core dependencies: Supabase SSR, Vercel AI SDK v6, Deepgram SDK, shadcn/ui, Tailwind CSS 4, Zod, SWR, TanStack Query, Novel
- [x] T003 [P] Configure Ultracite/Biome linting with Lefthook pre-commit hooks
- [x] T004 [P] Create environment variables template in .env.example (Supabase, Deepgram, AI Gateway keys)
- [x] T005 Initialize local Supabase instance with `supabase init` and configure config.toml
- [x] T006 [P] Setup shadcn/ui with components.json configuration file
- [x] T007 [P] Create base project structure: app/, lib/, components/, hooks/, supabase/ directories per plan.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Authentication Foundation

- [x] T008 Create initial database migration 20251121125431_initial_schema.sql with profiles, clients, note_templates, notes, note_conversations, note_embeddings tables from data-model.md
- [x] T009 Create RLS policies migration 20251121125710_rls_policies.sql enforcing practitioner-based data isolation for all tables
- [x] T010 Create pgvector extension migration 20251121125803_vector_extension.sql with HNSW indexes for note_embeddings and assessment_embeddings
- [x] T011 Create pg_cron migration 20251121125841_cron_notifications.sql with notifications table and daily session reminder job
- [x] T012 Run database migrations with `supabase db reset` and verify all tables created
- [x] T013 Generate TypeScript database types with `supabase gen types typescript --local > lib/types/database.types.ts`

**Additional Migrations Created (Post-Linter Analysis)**:
- **20251121130100_fix_security_warnings.sql**: Fixed critical security issues identified by Supabase linter
  - Added immutable `set search_path = public` to trigger functions to prevent SQL injection
  - Moved `pg_trgm` and `vector` extensions from public schema to dedicated `extensions` schema
  - Resolved: `function_search_path_mutable` (SECURITY) and `extension_in_public` (ORGANIZATION) warnings
- **20251121130200_optimize_rls_performance.sql**: Optimized RLS policies for query performance at scale
  - Wrapped all `auth.uid()` calls in subqueries: `(select auth.uid())`
  - Prevents per-row function re-evaluation (initplan optimization)
  - Updated 24 policies across 8 tables (profiles, clients, notes, note_conversations, note_embeddings, assessment_results, assessment_embeddings, notifications)
  - Resolved: 24 `auth_rls_initplan` (PERFORMANCE) warnings
- [x] T014 Create Supabase client utilities in lib/supabase/client.ts (browser client) and lib/supabase/server.ts (server client with cookies)
- [x] T015 Implement authentication middleware in middleware.ts to protect dashboard routes using Supabase session validation
- [x] T016 Create auth callback handler in app/(auth)/oauth/route.ts for OAuth flow (already exists, integrates with existing app/(auth) pages)

### AI & External Services Foundation

- [x] T017 [P] Configure Vercel AI SDK client in lib/ai/client.ts with AI Gateway provider settings
- [x] T018 [P] Configure Deepgram SDK client in lib/deepgram/client.ts with API key and model settings (nova-3)
- [x] T019 [P] Create base Zod validation schemas in lib/validations/client.ts, lib/validations/note.ts, lib/validations/assessment.ts

### UI Foundation

- [x] T020 [P] Install shadcn/ui base components: button, input, card, form, dialog, tabs, badge, select
- [x] T021 [P] Create dashboard layout in app/(dashboard)/layout.tsx with navigation and sidebar structure
- [x] T022 [P] Create dashboard home page skeleton in app/(dashboard)/page.tsx for notifications display
- [x] T023 [P] Create base nav component in components/layout/nav.tsx with authenticated user info and logout

**Additional Fixes Applied During T020-T023**:
- Removed `middleware.ts` in favor of `proxy.ts` (Next.js 16 requirement - both files caused build conflict)
- Fixed Zod validation schemas across `lib/validations/` files:
  - Updated `z.record(z.unknown())` → `z.record(z.string(), z.unknown())` to match Zod v3.24+ API
  - Updated `z.record(z.union(...))` → `z.record(z.string(), z.union(...))` for proper key/value typing
  - Fixed in: assessment.ts (4 occurrences), client.ts (2 occurrences), note.ts (2 occurrences)
- Removed barrel file `components/layout/nav.tsx` per Biome linting rules (noBarrelFile)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 2 - Client Profile Management (Priority: P2) 🎯 MVP

**Goal**: Enable practitioners to create, view, search, and manage client profiles as foundational data for notes

**Why P2 first**: Client profiles must exist before notes can be created (US1 depends on clients existing). Building this first establishes the data foundation.

**Independent Test**: Create multiple client profiles, view client list with search/filter, navigate to individual client detail pages, update client information, verify all data persists correctly

### Implementation for User Story 2

- [ ] T024 [P] [US2] Create client list Server Component in components/clients/client-list.tsx with table display and pagination
- [ ] T025 [P] [US2] Create client card Server Component in components/clients/client-card.tsx for list item display
- [ ] T026 [P] [US2] Create client form Client Component in components/clients/client-form.tsx with Zod validation and form state
- [ ] T027 [P] [US2] Create global client search Client Component in components/clients/client-search.tsx with debounced search input
- [ ] T028 [US2] Implement GET /api/clients route handler in app/api/clients/route.ts with search, filter, pagination support
- [ ] T029 [US2] Implement POST /api/clients route handler in app/api/clients/route.ts with Zod validation
- [ ] T030 [US2] Implement GET /api/clients/[clientId]/route.ts with client details, recent notes/assessments aggregation
- [ ] T031 [US2] Implement PATCH /api/clients/[clientId]/route.ts for client updates
- [ ] T032 [US2] Implement DELETE /api/clients/[clientId]/route.ts for soft delete (archived_at timestamp)
- [ ] T033 [US2] Create client list page in app/(dashboard)/clients/page.tsx as Server Component with search integration
- [ ] T034 [US2] Create client detail page in app/(dashboard)/clients/[clientId]/page.tsx with tabs: Overview, Notes, Assessments, Search
- [ ] T035 [US2] Create client detail tabs Client Component in components/clients/client-detail-tabs.tsx for tab navigation
- [ ] T036 [US2] Add database seed script in supabase/seed.sql with sample note templates (SOAP Note, Progress Note) per quickstart.md

**Checkpoint**: Client management fully functional - can create, view, search, update, archive clients independently

---

## Phase 4: User Story 1 - Real-Time Note Transcription & Template Population (Priority: P1)

**Goal**: Enable practitioners to transcribe session notes in real-time, auto-populate templates with LLM extraction, and save approved notes

**Independent Test**: Create client profile, start new note session, provide voice input for transcription, verify LLM extracts fields into template, review and edit note, approve and save to client profile

### Implementation for User Story 1

- [ ] T037 [P] [US1] Create note editor Client Component in components/notes/note-editor.tsx using Novel or Tiptap with locked header extension from research.md
- [ ] T038 [P] [US1] Create transcription panel Client Component in components/notes/transcription-panel.tsx with Deepgram SDK WebSocket integration
- [ ] T039 [P] [US1] Create template renderer component in components/notes/template-renderer.tsx for markdown with locked headers
- [ ] T040 [P] [US1] Create note list Server Component in components/notes/note-list.tsx with status badges and date sorting
- [ ] T041 [P] [US1] Create note card Server Component in components/notes/note-card.tsx for list display
- [ ] T042 [US1] Create useTranscription hook in hooks/use-transcription.ts implementing Deepgram createClient() pattern from research.md
- [ ] T043 [US1] Create useNoteExtraction hook in hooks/use-note-extraction.ts using AI SDK useObject with Zod schema
- [ ] T044 [US1] Implement extract-note-fields service in lib/ai/extract-note-fields.ts using streamObject with Zod schema per research.md
- [ ] T045 [US1] Implement generate-summary service in lib/ai/generate-summary.ts for session summaries
- [ ] T046 [US1] Create Tiptap editor configuration in lib/editor/tiptap-config.ts with custom locked header extension
- [ ] T047 [US1] Create template schema utilities in lib/editor/template-schema.ts for note template structure validation
- [ ] T048 [US1] Implement POST /api/notes/[noteId]/extract/route.ts for LLM field extraction using streamObject and toTextStreamResponse
- [ ] T049 [US1] Implement GET /api/notes route handler in app/api/notes/route.ts with client_id filter, status filter, date range
- [ ] T050 [US1] Implement POST /api/notes route handler in app/api/notes/route.ts for note creation with transcription
- [ ] T051 [US1] Implement GET /api/notes/[noteId]/route.ts for note retrieval with template structure
- [ ] T052 [US1] Implement PATCH /api/notes/[noteId]/route.ts for note updates with embedding generation using embed() from 'ai' per research.md
- [ ] T053 [US1] Implement DELETE /api/notes/[noteId]/route.ts for soft delete
- [ ] T054 [US1] Create note creation page in app/(dashboard)/notes/new/page.tsx with client selection, template selection, transcription panel
- [ ] T055 [US1] Create note view page in app/(dashboard)/clients/[clientId]/notes/[noteId]/page.tsx showing approved note with template structure
- [ ] T056 [US1] Create note edit page in app/(dashboard)/clients/[clientId]/notes/[noteId]/edit/page.tsx with editor and extraction workflow
- [ ] T057 [US1] Add note conversations table storage for LLM chat history in note creation workflow
- [ ] T058 [US1] Implement embedding generation on note save in PATCH /api/notes/[noteId]/route.ts using AI SDK embed() with openai.textEmbeddingModel()
- [ ] T059 [US1] Update client detail page tabs to show notes list in Notes tab using note-list component

**Checkpoint**: Note transcription and template population fully functional - complete end-to-end note creation workflow working independently

---

## Phase 5: User Story 3 - Client Assessments & Screening (Priority: P3)

**Goal**: Enable practitioners to conduct standardized assessments, auto-score results, and track assessment history per client

**Independent Test**: Select client, choose assessment template (e.g., PHQ-9), complete assessment questions, verify auto-scoring, save results to client profile, view assessment history

### Implementation for User Story 3

- [ ] T060 [P] [US3] Create assessment_templates and assessment_results tables migration (if not in initial schema)
- [ ] T061 [P] [US3] Create assessment_embeddings table with pgvector support for semantic search
- [ ] T062 [P] [US3] Create assessment list Server Component in components/assessments/assessment-list.tsx
- [ ] T063 [P] [US3] Create assessment card Server Component in components/assessments/assessment-card.tsx
- [ ] T064 [P] [US3] Create assessment form Client Component in components/assessments/assessment-form.tsx with dynamic question rendering
- [ ] T065 [P] [US3] Create assessment results Server Component in components/assessments/assessment-results.tsx with score interpretation
- [ ] T066 [US3] Implement GET /api/assessments route handler in app/api/assessments/route.ts for template listing
- [ ] T067 [US3] Implement POST /api/assessments route handler in app/api/assessments/route.ts for assessment result creation
- [ ] T068 [US3] Implement GET /api/assessments/[assessmentId]/route.ts for assessment result retrieval
- [ ] T069 [US3] Implement PATCH /api/assessments/[assessmentId]/route.ts for assessment updates
- [ ] T070 [US3] Implement POST /api/assessments/[assessmentId]/score/route.ts for automatic scoring calculation
- [ ] T071 [US3] Implement DELETE /api/assessments/[assessmentId]/route.ts for soft delete
- [ ] T072 [US3] Create assessment templates page in app/(dashboard)/assessments/page.tsx for template selection
- [ ] T073 [US3] Create assessment view page in app/(dashboard)/clients/[clientId]/assessments/[assessmentId]/page.tsx
- [ ] T074 [US3] Update client detail tabs to show assessments list in Assessments tab
- [ ] T075 [US3] Add assessment seed data to supabase/seed.sql with PHQ-9 simplified template from quickstart.md
- [ ] T076 [US3] Implement embedding generation for assessment results in POST /api/assessments route for semantic search

**Checkpoint**: Assessment workflow fully functional - can conduct, score, and track assessments independently

---

## Phase 6: User Story 4 - Session Follow-Up Notifications & Progress Tracking (Priority: P4)

**Goal**: Generate notifications on scheduled session dates with previous session summary and follow-up items for practitioner preparation

**Independent Test**: Create note with next_session_date and follow_up_items, simulate date trigger, verify notification generated with previous session summary, verify notification displays on dashboard

### Implementation for User Story 4

- [ ] T077 [US4] Create notifications table migration (if not in 0004_cron_notifications.sql)
- [ ] T078 [US4] Verify pg_cron job configured in 0004_cron_notifications.sql for daily notification generation at 6 AM
- [ ] T079 [P] [US4] Create notifications Client Component in components/layout/notifications.tsx with real-time updates
- [ ] T080 [P] [US4] Create session notification card component in components/notifications/session-notification-card.tsx
- [ ] T081 [US4] Implement GET /api/notifications route handler in app/api/notifications/route.ts for notification listing
- [ ] T082 [US4] Implement PATCH /api/notifications/[notificationId]/route.ts to mark notifications as viewed
- [ ] T083 [US4] Update dashboard home page in app/(dashboard)/page.tsx to display session notifications using notifications component
- [ ] T084 [US4] Add next_session_date and follow_up_items fields to note editor UI in note creation workflow
- [ ] T085 [US4] Implement get_client_session_progress database function for progress aggregation (if not in data-model.md)
- [ ] T086 [US4] Test pg_cron job execution manually and verify notification generation logic

**Checkpoint**: Session notifications fully functional - practitioners receive timely reminders with context

---

## Phase 7: User Story 5 - Natural Language Note Querying (Priority: P5)

**Goal**: Enable practitioners to query notes using natural language and receive contextually relevant results with references

**Independent Test**: Create multiple notes with diverse content, verify embeddings generated, ask natural language questions, verify accurate results with note references and excerpts

### Implementation for User Story 5

- [ ] T087 [P] [US5] Create search interface Client Component in components/search/search-interface.tsx with natural language input
- [ ] T088 [P] [US5] Create search results Server Component in components/search/search-results.tsx with note excerpts and highlights
- [ ] T089 [P] [US5] Create client search results Server Component in components/search/client-search-results.tsx for per-client search
- [ ] T090 [P] [US5] Create client search panel Client Component in components/clients/client-search-panel.tsx for client detail page Search tab
- [ ] T091 [US5] Create useSearch hook in hooks/use-search.ts with TanStack Query for complex search state management
- [ ] T092 [US5] Implement semantic search utilities in lib/ai/semantic-search.ts using pgvector cosine similarity queries
- [ ] T093 [US5] Verify search_notes database function from data-model.md with optional filter_client_id parameter
- [ ] T094 [US5] Verify search_assessments database function from data-model.md for assessment search
- [ ] T095 [US5] Implement POST /api/search/route.ts for global natural language search using embed() and search_notes RPC
- [ ] T096 [US5] Implement POST /api/clients/[clientId]/search route for per-client scoped search
- [ ] T097 [US5] Create global search page in app/(dashboard)/search/page.tsx with search interface
- [ ] T098 [US5] Update client detail tabs to show per-client search in Search tab using client-search-panel component
- [ ] T099 [US5] Test embedding generation pipeline for notes and assessments
- [ ] T100 [US5] Test vector similarity search with various natural language queries and verify result relevance

**Checkpoint**: Natural language search fully functional - practitioners can query across all notes intelligently

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final MVP polish

- [ ] T101 [P] Add loading states and skeletons for all async Server Components using Suspense boundaries
- [ ] T102 [P] Implement error boundaries in app/error.tsx and app/(dashboard)/error.tsx for graceful error handling
- [ ] T103 [P] Add toast notifications for user actions using shadcn/ui toast component across all forms
- [ ] T104 [P] Implement optimistic updates using SWR mutate in client-side components per research.md
- [ ] T105 [P] Add comprehensive logging for AI operations and external service calls in lib/ai/ and lib/deepgram/
- [ ] T106 [P] Create date formatting utilities in lib/utils/date.ts for consistent date display
- [ ] T107 [P] Create markdown parsing utilities in lib/utils/markdown.ts for note rendering
- [ ] T108 [P] Add ARIA labels and keyboard navigation to transcription controls for accessibility (WCAG 2.1 AA)
- [ ] T109 [P] Verify color contrast ratios across all UI components meet WCAG 2.1 AA standards
- [ ] T110 [P] Add loading states for LLM extraction streaming with progress indicators
- [ ] T111 [P] Implement session timeout handling and auth state refresh logic
- [ ] T112 [P] Add database indexes optimization review for frequent queries (client search, note listing)
- [ ] T113 Validate quickstart.md setup instructions by following step-by-step in clean environment
- [ ] T114 Test complete user journey: sign up → create client → transcribe note → extract fields → approve note → query notes
- [ ] T115 [P] Add JSDoc comments to all exported functions in lib/ with parameter and return type descriptions
- [ ] T116 [P] Run Biome linting and formatting with `npx ultracite fix` on all source files
- [ ] T117 Performance audit: verify LCP < 2.5s, CLS < 0.1 per constitution on key pages
- [ ] T118 Security audit: verify all mutations use Zod validation, RLS policies enforced, no PII in client logs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 2 - Clients (Phase 3)**: Depends on Foundational - Built FIRST because US1 needs clients
- **User Story 1 - Notes (Phase 4)**: Depends on Foundational + US2 clients existing
- **User Story 3 - Assessments (Phase 5)**: Depends on Foundational + US2 clients existing
- **User Story 4 - Notifications (Phase 6)**: Depends on US1 notes with scheduling data
- **User Story 5 - Search (Phase 7)**: Depends on US1 notes and US3 assessments with embeddings
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 2 (P2 - Clients)**: Can start after Foundational - No dependencies on other stories
- **User Story 1 (P1 - Notes)**: Depends on US2 clients existing (notes require client_id foreign key)
- **User Story 3 (P3 - Assessments)**: Depends on US2 clients existing (assessments require client_id)
- **User Story 4 (P4 - Notifications)**: Depends on US1 notes (reads note data for notifications)
- **User Story 5 (P5 - Search)**: Depends on US1 and US3 (searches across notes and assessments)

### Within Each User Story

- Components before API routes where possible
- API routes before pages that consume them
- Core implementation before integration tasks
- Story complete and testable before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002, T003, T004, T006, T007)
- All Foundational tasks marked [P] can run in parallel (T017, T018, T019, T020, T021, T022, T023)
- Within User Story 2: T024-T027 (all components) can run in parallel
- Within User Story 1: T037-T041 (all components) and T042-T043 (hooks) can run in parallel
- Within User Story 3: T060-T065 (migrations and components) can run in parallel
- Within User Story 4: T079-T080 (components) can run in parallel
- Within User Story 5: T087-T090 (all components) can run in parallel
- All Polish tasks marked [P] can run in parallel (T101-T112, T115-T118)
- After Foundational completes: US2, US3 could technically start in parallel (both only need clients)
- However, US1 MUST wait for US2 to complete (needs clients to exist first)

---

## Parallel Example: User Story 1 (Notes)

```bash
# Launch all component creation tasks together:
Task: "T037 [P] [US1] Create note editor Client Component in components/notes/note-editor.tsx"
Task: "T038 [P] [US1] Create transcription panel Client Component in components/notes/transcription-panel.tsx"
Task: "T039 [P] [US1] Create template renderer component in components/notes/template-renderer.tsx"
Task: "T040 [P] [US1] Create note list Server Component in components/notes/note-list.tsx"
Task: "T041 [P] [US1] Create note card Server Component in components/notes/note-card.tsx"

# Then launch hooks together:
Task: "T042 [US1] Create useTranscription hook in hooks/use-transcription.ts"
Task: "T043 [US1] Create useNoteExtraction hook in hooks/use-note-extraction.ts"
```

---

## Implementation Strategy

### MVP First (US2 + US1 Only)

1. Complete Phase 1: Setup (T001-T007)
2. Complete Phase 2: Foundational (T008-T023) - CRITICAL BLOCKER
3. Complete Phase 3: User Story 2 - Clients (T024-T036)
4. **VALIDATE US2**: Test client management independently
5. Complete Phase 4: User Story 1 - Notes (T037-T059)
6. **VALIDATE US1**: Test complete note creation workflow
7. **STOP and DEMO**: US2 + US1 = Full MVP - practitioners can manage clients and create notes!

This delivers the core value: Client management + Note transcription + Template population + Approval workflow.

### Incremental Delivery

1. **Foundation**: Setup + Foundational → Database and auth ready
2. **MVP v1**: + US2 Clients → Can manage client roster (deployable!)
3. **MVP v2**: + US1 Notes → Full note transcription workflow (MAJOR VALUE!)
4. **Enhancement v1**: + US3 Assessments → Add screening capabilities
5. **Enhancement v2**: + US4 Notifications → Session preparation reminders
6. **Enhancement v3**: + US5 Search → Intelligent note querying
7. **Polish**: Phase 8 → Production-ready with accessibility, error handling, performance

Each phase adds value without breaking previous features.

### Parallel Team Strategy

With multiple developers after Foundational completes:

1. Team completes Setup (Phase 1) + Foundational (Phase 2) together
2. Once Foundational done:
   - **Developer A**: User Story 2 (Clients) - MUST complete first
3. After US2 completes:
   - **Developer A**: User Story 1 (Notes) - depends on clients
   - **Developer B**: User Story 3 (Assessments) - parallel to US1
4. After US1 and US3 complete:
   - **Developer A**: User Story 4 (Notifications)
   - **Developer B**: User Story 5 (Search)
5. All developers: Phase 8 (Polish) together

---

## Task Summary

- **Total Tasks**: 118
- **Phase 1 (Setup)**: 7 tasks
- **Phase 2 (Foundational)**: 16 tasks (CRITICAL BLOCKER)
- **Phase 3 (US2 - Clients)**: 13 tasks
- **Phase 4 (US1 - Notes)**: 23 tasks
- **Phase 5 (US3 - Assessments)**: 17 tasks
- **Phase 6 (US4 - Notifications)**: 10 tasks
- **Phase 7 (US5 - Search)**: 14 tasks
- **Phase 8 (Polish)**: 18 tasks
- **Parallel Opportunities**: 45 tasks marked [P] can run in parallel within their phases

## MVP Scope (Recommended First Delivery)

**Phases 1-4** = Setup + Foundational + US2 + US1 = **59 tasks**

This delivers:
- ✅ Client management (create, view, search, edit)
- ✅ Real-time transcription with Deepgram
- ✅ LLM template auto-population with Vercel AI SDK
- ✅ Note review and approval workflow
- ✅ Client profiles with note history
- ✅ Secure multi-tenant data isolation with RLS

**Estimated MVP delivery**: Complete end-to-end workflow demonstrating core value proposition.

---

## Notes

- [P] tasks within same phase can run in parallel (different files, no blocking dependencies)
- [Story] labels enable traceability and independent story validation
- Each user story checkpoint confirms that story works independently
- Tests not included per constitution (optional, not required for MVP)
- Commit after each task or logical group of related tasks
- Stop at any checkpoint to validate story works independently before proceeding
- User Story 2 built BEFORE User Story 1 despite lower priority because notes require clients to exist
- All implementation follows research.md verified patterns (Novel/Tiptap, Deepgram SDK v3, AI SDK v5 embed/streamObject)
