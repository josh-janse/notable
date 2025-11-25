# Implementation Plan: Process Note-Taking Application

**Branch**: `001-process-note-app` | **Date**: 2025-11-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-process-note-app/spec.md`

## Summary

Build a modern process note-taking application for coaches, counselors, therapists, and social workers that transcribes session notes in real-time using Deepgram, automatically populates predefined markdown-based templates using LLM workflows via Vercel AI SDK, and provides client management with assessment capabilities. The application will use Next.js App Router with Server Components, Supabase for auth/database/queue/vector storage, shadcn/ui for interface components, and implement a markdown-first note editing experience with rich text capabilities.

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode, Next.js 16.0.3 (App Router)
**Primary Dependencies**:
- Vercel AI SDK v5 (with AI Gateway provider for LLM operations and vector embeddings)
- Supabase SSR Client (auth, database, real-time, pgvector, queue)
- Deepgram SDK (real-time transcription)
- shadcn/ui components + Tailwind CSS 4
- ai-elements (AI SDK UI components for AI workflows)
- Tiptap or ProseMirror (rich markdown editing with locked template headers)
- SWR and/or TanStack Query (client-side data synchronization)
- Resend (email notifications)

**Storage**: PostgreSQL 15+ via Supabase (local instance for dev, cloud for production)
- pgvector extension for semantic search and embeddings
- pg_cron for scheduled notifications
- Row Level Security (RLS) for data isolation

**Testing**: Vitest or Jest (optional, per constitution - not mandatory initially)
**Target Platform**: Web (responsive design, mobile-ready)
**Project Type**: Web application with Next.js App Router

**Performance Goals**:
- LCP < 2.5s, CLS < 0.1 (per constitution)
- Real-time transcription latency < 2s
- LLM field extraction < 5s for typical session
- Client list with 100+ clients loads < 2s
- Natural language query response < 3s

**Constraints**:
- Server-first architecture: maximize Server Components, minimize client bundles
- Authenticated routes require Supabase session validation
- Real-time transcription requires WebSocket connection to Deepgram (via Deepgram SDK)
- Markdown templates with locked header fields require custom editor integration
- LLM operations routed through AI Gateway for observability/rate limiting

**Scale/Scope**:
- Single-practitioner accounts (100-500 clients per practitioner)
- 1000+ notes per practitioner typical workload
- 10-50 concurrent practitioners during peak usage
- Vector embeddings for all notes (semantic search)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Type Safety ✓
- **Compliance**: TypeScript strict mode enabled in `tsconfig.json`
- **Action**: All Server Components, Route Handlers, and utilities use explicit types
- **Action**: Supabase database types generated via `npx supabase gen types typescript --local > database.types.ts`
- **Action**: Vercel AI SDK and Deepgram responses properly typed

### Principle II: Accessibility-First ✓
- **Compliance**: shadcn/ui components meet WCAG 2.1 AA baseline
- **Action**: Transcription interface includes keyboard shortcuts for pause/resume/save
- **Action**: Markdown editor provides accessible text editing with screen reader support
- **Action**: Client list and note views properly labeled with ARIA attributes
- **Action**: Color contrast verified for all UI elements

### Principle III: Component Isolation ✓
- **Compliance**: Server Components handle data fetching, Client Components isolated for interactivity
- **Action**: Transcription UI, markdown editor, and chat interface are isolated Client Components
- **Action**: Props explicitly typed, no implicit global state access
- **Action**: Supabase client passed via context or props, not imported globally in components

### Principle IV: Performance Budget ✓
- **Compliance**: Next.js App Router with Server Components minimizes client bundle
- **Action**: Code splitting for heavy dependencies (Deepgram, ProseMirror/Tiptap editor)
- **Action**: SWR/TanStack Query for optimistic updates and cache management
- **Action**: pgvector indexes for fast semantic search
- **Action**: Route segment caching for static content

### Principle V: Security by Default ✓
- **Compliance**: Supabase RLS policies enforce practitioner-client data isolation
- **Action**: All mutations validated via Zod schemas in Route Handlers
- **Action**: Authentication verified server-side in middleware and Route Handlers
- **Action**: Client PII never exposed in client-side logging
- **Action**: CORS and CSP headers configured for Deepgram WebSocket and AI Gateway

### Code Quality Standards ✓
- **Compliance**: Ultracite/Biome pre-commit hooks configured in Lefthook
- **Action**: All exported functions have explicit return types
- **Action**: Error boundaries wrap transcription and editor components
- **Action**: Complex LLM extraction logic extracted to separate service functions

### Testing Requirements ✓
- **Compliance**: Testing optional per constitution, not included in initial MVP
- **Action**: If tests requested later, will use Vitest with TDD approach

**Gate Status**: ✅ PASSED - All constitutional requirements addressed in design

## Project Structure

### Documentation (this feature)

```text
specs/001-process-note-app/
├── plan.md              # This file
├── research.md          # Phase 0: Tech stack and architecture decisions
├── data-model.md        # Phase 1: Database schema and entity relationships
├── quickstart.md        # Phase 1: Local development setup guide
├── contracts/           # Phase 1: API route specifications
│   ├── auth.md
│   ├── clients.md
│   ├── notes.md
│   ├── assessments.md
│   ├── transcription.md
│   └── search.md
└── checklists/
    └── requirements.md  # Spec quality validation (already exists)
```

### Source Code (Next.js App Router structure)

```text
app/
├── (auth)/                # Auth routes (EXISTING: OAuth, login, error pages)
│   ├── login/
│   │   └── page.tsx
│   ├── error/
│   │   └── page.tsx
│   └── oauth/
│       └── route.ts     # OAuth callback handler
├── (dashboard)/         # Authenticated app routes
│   ├── clients/
│   │   ├── page.tsx     # Client list (Server Component)
│   │   └── [clientId]/
│   │       ├── page.tsx # Client detail with tabs: Overview, Notes, Assessments, Search
│   │       ├── notes/
│   │       │   └── [noteId]/
│   │       │       ├── page.tsx    # View note
│   │       │       └── edit/
│   │       │           └── page.tsx # Edit note
│   │       └── assessments/
│   │           └── [assessmentId]/
│   │               └── page.tsx # View assessment result
│   ├── notes/
│   │   └── new/
│   │       └── page.tsx # Create note (with transcription)
│   ├── assessments/
│   │   └── [assessmentId]/
│   │       └── page.tsx # Assessment view/edit
│   ├── search/
│   │   └── page.tsx     # Natural language search interface
│   ├── layout.tsx       # Dashboard shell with nav
│   └── page.tsx         # Dashboard home/notifications
├── api/
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts # Supabase auth callback
│   ├── clients/
│   │   ├── route.ts     # GET (list), POST (create)
│   │   └── [clientId]/
│   │       └── route.ts # GET, PATCH, DELETE
│   ├── notes/
│   │   ├── route.ts     # GET (list), POST (create)
│   │   └── [noteId]/
│   │       ├── route.ts # GET, PATCH, DELETE
│   │       └── extract/
│   │           └── route.ts # POST: LLM extraction
│   ├── transcription/
│   │   └── stream/
│   │       └── route.ts # WebSocket proxy to Deepgram
│   ├── assessments/
│   │   ├── route.ts     # GET (list), POST (create)
│   │   └── [assessmentId]/
│   │       ├── route.ts # GET, PATCH, DELETE
│   │       └── score/
│   │           └── route.ts # POST: Calculate scores
│   └── search/
│       └── route.ts     # POST: Natural language query
├── components/
│   ├── ui/              # shadcn components (button, input, card, etc.)
│   ├── clients/
│   │   ├── client-list.tsx        # Server Component
│   │   ├── client-card.tsx        # Server Component
│   │   ├── client-form.tsx        # Client Component (form state)
│   │   ├── client-search.tsx      # Client Component (global search input)
│   │   ├── client-detail-tabs.tsx # Client Component (tabs: Overview, Notes, Assessments, Search)
│   │   └── client-search-panel.tsx # Client Component (per-client NL search)
│   ├── notes/
│   │   ├── note-list.tsx          # Server Component
│   │   ├── note-card.tsx          # Server Component
│   │   ├── note-editor.tsx        # Client Component (Novel/Lexical/Tiptap)
│   │   ├── transcription-panel.tsx # Client Component (Deepgram SDK)
│   │   └── template-renderer.tsx  # Hybrid (markdown with locked headers)
│   ├── assessments/
│   │   ├── assessment-list.tsx    # Server Component
│   │   ├── assessment-card.tsx    # Server Component
│   │   ├── assessment-form.tsx    # Client Component
│   │   └── assessment-results.tsx # Server Component
│   ├── search/
│   │   ├── search-interface.tsx   # Client Component (global natural language search)
│   │   ├── search-results.tsx     # Server Component
│   │   └── client-search-results.tsx # Server Component (client-scoped results)
│   └── layout/
│       ├── nav.tsx                # Server Component
│       ├── sidebar.tsx            # Client Component (mobile toggle)
│       └── notifications.tsx      # Client Component (real-time)
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser client
│   │   ├── server.ts              # Server client (cookies)
│   │   └── middleware.ts          # Auth middleware
│   ├── ai/
│   │   ├── client.ts              # Vercel AI SDK config (AI Gateway)
│   │   ├── extract-note-fields.ts # LLM field extraction logic
│   │   ├── generate-summary.ts    # Session summary generation
│   │   └── semantic-search.ts     # Vector search queries
│   ├── deepgram/
│   │   └── client.ts              # Deepgram SDK setup
│   ├── editor/
│   │   ├── tiptap-config.ts       # Tiptap editor configuration
│   │   └── template-schema.ts     # Markdown template structure
│   ├── validations/
│   │   ├── client.ts              # Zod schemas for client data
│   │   ├── note.ts                # Zod schemas for note data
│   │   └── assessment.ts          # Zod schemas for assessment data
│   └── utils/
│       ├── date.ts                # Date formatting utilities
│       ├── markdown.ts            # Markdown parsing/rendering helpers
│       └── types.ts               # Shared TypeScript types
├── hooks/
│   ├── use-transcription.ts      # Deepgram WebSocket hook
│   ├── use-note-extraction.ts    # LLM extraction hook
│   └── use-search.ts              # Natural language search hook
└── middleware.ts                  # Auth + route protection

supabase/
├── migrations/
│   ├── 0001_initial_schema.sql
│   ├── 0002_rls_policies.sql
│   ├── 0003_vector_extension.sql
│   └── 0004_cron_notifications.sql
├── functions/                     # Edge Functions (if needed)
└── config.toml                    # Local Supabase config
```

**Structure Decision**: Next.js App Router with route groups for auth vs. authenticated app. Server Components maximize server-side rendering and data fetching. Client Components isolated for interactivity (forms, transcription, editor). API routes handle mutations and external service integrations (Deepgram, AI Gateway).

## Complexity Tracking

> All constitutional principles satisfied - no violations to justify.

## Phase 0: Research (See research.md)

Key architectural decisions to document:
1. Markdown template structure with locked header fields (Tiptap vs. ProseMirror)
2. Real-time transcription WebSocket handling (proxy vs. direct client connection)
3. LLM field extraction workflow (streaming vs. batch processing)
4. Semantic search with pgvector (embedding generation and query strategy)
5. Session notification scheduling (pg_cron triggers and queue pattern)
6. Client-side state management (SWR vs. TanStack Query for data sync)

## Phase 1: Design (See data-model.md, contracts/, quickstart.md)

### Data Model
- Practitioner entity (auth.users + profiles table)
- Client entity (clients table with RLS by practitioner_id)
- Note entity (notes table with markdown_content, template_type, status)
- Note Template entity (note_templates table with JSON schema)
- Transcription entity (transcriptions table with raw text, confidence metadata)
- Assessment entity (assessments + assessment_results tables)
- Session Notification entity (notifications table with pg_cron triggers)
- Vector embeddings (note_embeddings table with pgvector)

### API Contracts
- RESTful routes for CRUD operations
- Server Actions for form mutations (optional)
- WebSocket proxy for Deepgram transcription
- Streaming LLM responses for field extraction

### Quickstart Guide
- Local Supabase setup (`supabase start`)
- Environment variables configuration
- Database migrations (`supabase db reset`)
- Deepgram API key setup
- AI Gateway configuration for Vercel AI SDK
- Development server startup (`p run dev`)

## Implementation Strategy

### MVP (P1 + P2 User Stories)
1. Set up Next.js + Supabase + shadcn/ui foundation
2. Implement authentication and practitioner profiles
3. Build client management (CRUD, list, detail pages)
4. Implement markdown note editor with template support
5. Integrate Deepgram real-time transcription
6. Build LLM field extraction workflow
7. Complete note creation, review, and approval flow

This delivers the core value proposition: transcribe → extract → review → save.

### Incremental Additions
- **P3**: Add assessment templates and scoring
- **P4**: Implement session notifications with pg_cron
- **P5**: Build natural language search with pgvector

Each priority can be developed and deployed independently after MVP.
