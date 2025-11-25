# Quickstart Guide - Process Note-Taking Application

**Feature**: 001-process-note-app
**Created**: 2025-11-20

## Prerequisites

- Node.js 20+ and pnpm
- Docker Desktop (for local Supabase)
- Git
- Text editor (VS Code recommended)

## Environment Setup

### 1. Install Supabase CLI

```bash
pnpm install -g supabase
```

### 2. Start Local Supabase Instance

```bash
# From project root
supabase start
```

This will start:
- PostgreSQL database on `localhost:54322`
- Supabase Studio on `http://localhost:54323`
- API Gateway on `http://localhost:54321`

**Note output**: Save the `anon key` and `service_role key` for `.env.local`

### 3. Create Environment Variables

Create `.env.local` in project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-supabase-start>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key-from-supabase-start>

# Deepgram (sign up at https://deepgram.com)
DEEPGRAM_API_KEY=<your-deepgram-api-key>

# Vercel AI SDK
AI_GATEWAY_API_KEY=<your-ai-gateway-api-key>
```

### 4. Install Dependencies

```bash
pnpm install
```

### 5. Run Database Migrations

```bash
supabase db reset
```

This will:
- Drop and recreate the database
- Run all migrations from `supabase/migrations/`
- Create tables, RLS policies, functions, and pg_cron jobs
- Enable pgvector extension

### 6. Generate TypeScript Types

```bash
pnpm run db:types
```

Add this script to `package.json` if not present:
```json
{
  "scripts": {
    "db:types": "supabase gen types typescript --local > lib/types/database.types.ts"
  }
}
```

### 7. Seed Initial Data (Optional)

Create seed file `supabase/seed.sql`:

```sql
-- Seed note templates
INSERT INTO note_templates (id, name, description, structure) VALUES
  (
    gen_random_uuid(),
    'SOAP Note',
    'Subjective, Objective, Assessment, Plan',
    '{
      "headers": [
        {"level": 1, "text": "Session Note", "locked": true},
        {"level": 2, "text": "Subjective", "locked": true},
        {"level": 2, "text": "Objective", "locked": true},
        {"level": 2, "text": "Assessment", "locked": true},
        {"level": 2, "text": "Plan", "locked": true}
      ],
      "sections": [
        {"title": "Subjective", "placeholder": "Client reported feelings, concerns, symptoms...", "required": true},
        {"title": "Objective", "placeholder": "Observed behaviors, mood, appearance...", "required": true},
        {"title": "Assessment", "placeholder": "Clinical impression, progress evaluation...", "required": true},
        {"title": "Plan", "placeholder": "Treatment plan, next steps, homework...", "required": true}
      ]
    }'::jsonb
  ),
  (
    gen_random_uuid(),
    'Progress Note',
    'Brief session progress documentation',
    '{
      "headers": [
        {"level": 1, "text": "Progress Note", "locked": true}
      ],
      "sections": [
        {"title": "Session Focus", "placeholder": "Topics discussed...", "required": true},
        {"title": "Progress", "placeholder": "Client progress on goals...", "required": true},
        {"title": "Next Session", "placeholder": "Plan for next session...", "required": false}
      ]
    }'::jsonb
  );

-- Seed assessment templates (example: PHQ-9 simplified)
INSERT INTO assessment_templates (id, name, description, category, questions, scoring_rules) VALUES
  (
    gen_random_uuid(),
    'PHQ-9 (Simplified)',
    'Patient Health Questionnaire - Depression Screening',
    'Depression',
    '[
      {
        "id": "q1",
        "text": "Little interest or pleasure in doing things",
        "type": "scale",
        "options": ["Not at all", "Several days", "More than half the days", "Nearly every day"],
        "scores": [0, 1, 2, 3]
      },
      {
        "id": "q2",
        "text": "Feeling down, depressed, or hopeless",
        "type": "scale",
        "options": ["Not at all", "Several days", "More than half the days", "Nearly every day"],
        "scores": [0, 1, 2, 3]
      }
    ]'::jsonb,
    '{
      "total_range": [0, 6],
      "interpretation": [
        {"range": [0, 1], "label": "Minimal or none"},
        {"range": [2, 3], "label": "Mild"},
        {"range": [4, 5], "label": "Moderate"},
        {"range": [6, 6], "label": "Moderately severe"}
      ]
    }'::jsonb
  );
```

Run seed:
```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/seed.sql
```

---

## Development Server

### Start Next.js Dev Server

```bash
pnpm run dev
```

App will be available at `http://localhost:3000`

### Access Supabase Studio

Open `http://localhost:54323` to:
- View database tables
- Run SQL queries
- Test RLS policies
- View logs

---

## Development Workflow

### 1. Create New Migration

```bash
supabase migration new <migration_name>
```

Edit the generated file in `supabase/migrations/`, then:

```bash
supabase db reset # Apply migration
pnpm run db:types  # Regenerate types
```

### 2. Test Authentication Flow

1. Navigate to `http://localhost:3000/sign-up`
2. Create test account (uses local Supabase auth)
3. Check email in Supabase Studio → Authentication → Users
4. Use "Auto-confirm user" in Studio for local development

### 3. Test Deepgram Transcription

Ensure microphone permissions are granted in browser. Navigate to note creation page and click "Start Recording".

### 4. Test LLM Extraction

1. Create note with raw transcription
2. Click "Extract Fields"
3. Monitor Network tab for streaming response
4. Check `note_conversations` table for saved chat history

### 5. Test Semantic Search

1. Create multiple notes with diverse content
2. Wait for embeddings to generate (check `note_embeddings` table)
3. Use search interface with natural language query
4. Verify results use cosine similarity ranking

---

## Useful Commands

```bash
# Database
supabase db reset              # Reset database (destructive)
supabase db diff               # Show schema changes
supabase db push               # Push migrations to remote (production)

# Types
pnpm run db:types               # Regenerate TypeScript types

# Migrations
supabase migration list        # List applied migrations
supabase migration new <name>  # Create new migration

# Logs
supabase logs                  # View Supabase logs

# Stop Supabase
supabase stop                  # Stop local instance
```

---

## Project Structure Quick Reference

```
app/
├── (auth)/                    # Sign-in, sign-up pages
├── (dashboard)/               # Authenticated app pages
│   ├── clients/               # Client management
│   ├── notes/                 # Note creation/editing
│   ├── assessments/           # Assessments
│   └── search/                # Semantic search
├── api/                       # API Route Handlers
│   ├── clients/
│   ├── notes/
│   ├── transcription/
│   ├── assessments/
│   └── search/
└── middleware.ts              # Auth middleware

components/
├── ui/                        # shadcn components
├── clients/                   # Client-related components
├── notes/                     # Note editor, transcription
└── layout/                    # Nav, sidebar, etc.

lib/
├── supabase/                  # Supabase clients
├── ai/                        # AI SDK utilities
├── deepgram/                  # Deepgram setup
├── editor/                    # Tiptap configuration
└── validations/               # Zod schemas

supabase/
├── migrations/                # SQL migrations
├── functions/                 # Edge Functions (if needed)
└── config.toml                # Local config
```

---

## Common Issues & Troubleshooting

### Issue: Supabase won't start
**Solution**: Ensure Docker Desktop is running. Try `supabase stop` then `supabase start`

### Issue: Database types not updating
**Solution**: Run `supabase db reset && pnpm run db:types`

### Issue: RLS policies blocking queries
**Solution**: Check Supabase Studio → Table Editor → Policies. Ensure user is authenticated and `auth.uid()` matches `practitioner_id`

### Issue: Deepgram transcription not working
**Solution**:
- Verify `DEEPGRAM_API_KEY` in `.env.local`
- Check browser console for errors
- Ensure microphone permissions granted
- Test token generation: `curl http://localhost:3000/api/transcription/token`

### Issue: LLM extraction failing
**Solution**:
- Verify `AI_GATEWAY_API_KEY` in `.env.local`
- Check Vercel AI SDK configuration in `lib/ai/client.ts`
- Monitor API route logs for errors

### Issue: pgvector queries returning no results
**Solution**:
- Verify `vector` extension enabled: `SELECT * FROM pg_extension WHERE extname = 'vector';`
- Check embeddings generated: `SELECT COUNT(*) FROM note_embeddings WHERE embedding IS NOT NULL;`
- Lower `match_threshold` in search query (default 0.7)

---

## Next Steps

After successful setup:

1. **Implement Auth Pages**: Create sign-up/sign-in UI with shadcn forms
2. **Build Client Management**: Client list and detail pages (Server Components)
3. **Integrate Transcription**: Deepgram WebSocket in Client Component
4. **Build Note Editor**: Tiptap editor with template support
5. **Implement LLM Extraction**: Stream extraction to note editor
6. **Add Semantic Search**: Vector search interface

Refer to `plan.md` for full implementation strategy and task breakdown.

---

## Additional Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Supabase Docs](https://supabase.com/docs)
- [Deepgram Docs](https://developers.deepgram.com/docs)
- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [Novel Docs](https://novel.sh) / [Tiptap Docs](https://tiptap.dev/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)

---

## Local Development Checklist

- [ ] Docker Desktop running
- [ ] Supabase started (`supabase start`)
- [ ] `.env.local` configured with all API keys
- [ ] Dependencies installed (`pnpm install`)
- [ ] Migrations applied (`supabase db reset`)
- [ ] TypeScript types generated (`pnpm run db:types`)
- [ ] Dev server running (`pnpm run dev`)
- [ ] Test account created and confirmed
- [ ] Supabase Studio accessible at `localhost:54323`

**You're ready to build! 🚀**
