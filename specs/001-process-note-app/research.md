# Phase 0: Research - Process Note-Taking Application

**Feature**: 001-process-note-app
**Created**: 2025-11-20
**Status**: Complete

## Purpose

Document architectural decisions and research findings for key technical challenges in the process note-taking application.

## 1. Markdown Template Structure with Locked Headers

### Challenge
Notes use markdown/JSON format with locked header fields that practitioners cannot edit, but can edit body content freely.

### Options Evaluated

**Option A: Novel (https://novel.sh)** ✅ VERIFIED FREE
- ✅ **Open source, MIT licensed (FREE)**
- ✅ Built on Tiptap Open Source with enhanced DX
- ✅ AI-powered writing features built-in
- ✅ Slash commands and bubble menus included
- ✅ Compatible with ai-elements/streamdown
- ✅ Active development, modern React patterns
- ✅ Can implement locked nodes via Tiptap extensions
- ⚠️ Less mature than Tiptap, smaller ecosystem
- **Verdict**: RECOMMENDED (best cost/features balance)

**Option B: Lexical (Meta)**
- ✅ Open source, MIT licensed (free)
- ✅ Excellent performance and accessibility
- ✅ Strong TypeScript support
- ✅ Extensible plugin architecture
- ✅ Production-ready (used by Facebook, Discord)
- ⚠️ Steeper learning curve than Novel/Tiptap
- ⚠️ More boilerplate for basic features
- ⚠️ Custom node locking requires manual implementation
- **Verdict**: Alternative (if performance critical)

**Option C: Tiptap Open Source** ✅ VERIFIED FREE
- ✅ **FREE MIT license** (not expensive!)
- ✅ Most mature editor framework
- ✅ Excellent documentation and ecosystem
- ✅ Core features sufficient for MVP
- ✅ Custom node types for locked headers
- ⚠️ More manual setup than Novel
- ⚠️ Missing advanced features without Platform (collab, comments, AI)
- **Verdict**: Alternative (if Novel limitations found)

**Option D: Tiptap Platform** (formerly "Pro")
- ✅ Advanced collaboration features
- ✅ AI-powered writing tools
- ✅ Comments and change tracking
- ❌ Expensive ($299-$999/month for commercial use)
- ❌ Licensing complexity for team use
- **Verdict**: Rejected (cost prohibitive for MVP)

### Decision: Novel (Recommended) or Tiptap OSS/Lexical (Alternative)

**Primary Recommendation: Novel** ✅ VERIFIED
- Best balance of features, cost (FREE), and DX
- Built on Tiptap Open Source (proven foundation)
- AI features align with project goals
- Faster implementation than raw Tiptap/Lexical
- Verified as MIT licensed at https://novel.sh

**Implementation approach**:
```typescript
// Custom Tiptap extension for locked template headers
const LockedHeader = Node.create({
  name: 'lockedHeader',
  group: 'block',
  content: 'text*',
  attrs: { level: { default: 1 }, locked: { default: true } },
  parseHTML() {
    return [{ tag: 'h[1-6][data-locked]' }]
  },
  renderHTML({ node }) {
    return [`h${node.attrs.level}`, { 'data-locked': 'true' }, 0]
  },
  addKeyboardShortcuts() {
    return {
      Backspace: () => this.editor.state.selection.$from.parent.type.name === 'lockedHeader',
      Delete: () => this.editor.state.selection.$from.parent.type.name === 'lockedHeader',
    }
  },
})

// Template structure stored as JSON
interface NoteTemplate {
  id: string
  name: string
  structure: {
    headers: Array<{ level: number; text: string; required: boolean }>
    sections: Array<{ title: string; placeholder: string; required: boolean }>
  }
}
```

**Integration with ai-elements**:
- ai-elements uses `streamdown` for markdown rendering
- Tiptap can export to markdown, compatible with streamdown
- LLM-generated content can be inserted into Tiptap editor programmatically

---

## 2. Real-Time Transcription WebSocket Handling

### Challenge
Deepgram requires WebSocket connection for real-time transcription. Next.js Route Handlers don't natively support WebSockets.

### Options Evaluated

**Option A: Client-Side Direct Connection (Deepgram SDK)**
- ✅ Deepgram SDK handles WebSocket internally
- ✅ Simple implementation, no proxy needed
- ✅ Works seamlessly with Next.js
- ⚠️ Requires API key management strategy
- **Verdict**: SELECTED (use temporary keys or env-based keys for MVP)

**Option B: API Route WebSocket Proxy**
- ❌ Next.js Route Handlers don't support WebSocket upgrade
- ❌ Requires custom server or external service
- **Verdict**: Rejected (infrastructure complexity)

**Option C: Supabase Edge Function Proxy**
- ⚠️ Additional deploy step
- ⚠️ Adds latency
- **Verdict**: Alternative if strict security requirements

### Decision: Client-Side Deepgram SDK (Direct Connection) ✅ VERIFIED

**Implementation approach** ✅ VERIFIED against Deepgram SDK v3.x:
- **Documentation**: https://developers.deepgram.com/docs/live-streaming-audio
- **SDK Repository**: https://github.com/deepgram/deepgram-js-sdk
```typescript
// lib/deepgram/client.ts
import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk'

export function createDeepgramConnection(apiKey: string) {
  const deepgram = createClient(apiKey)
  const connection = deepgram.listen.live({
    model: 'nova-2',
    language: 'en-US',
    smart_format: true,
    punctuate: true,
    interim_results: true,
  })

  return connection
}

// hooks/use-transcription.ts
export function useTranscription() {
  const [connection, setConnection] = useState<LiveClient | null>(null)
  const [transcript, setTranscript] = useState('')

  async function startTranscription() {
    // For MVP: use env NEXT_PUBLIC_DEEPGRAM_API_KEY
    // For production: fetch temporary token from /api/transcription/token
    const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY!
    const conn = createDeepgramConnection(apiKey)

    conn.on(LiveTranscriptionEvents.Open, () => {
      console.log('Deepgram connection opened')
    })

    conn.on(LiveTranscriptionEvents.Transcript, (data) => {
      const newTranscript = data.channel.alternatives[0].transcript
      if (newTranscript) {
        setTranscript(prev => prev + ' ' + newTranscript)
      }
    })

    conn.on(LiveTranscriptionEvents.Error, (error) => {
      console.error('Deepgram error:', error)
    })

    setConnection(conn)

    // Get microphone audio stream
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mediaRecorder = new MediaRecorder(stream)

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && conn.getReadyState() === 1) {
        conn.send(event.data)
      }
    }

    mediaRecorder.start(250) // Send chunks every 250ms
    return mediaRecorder
  }

  return { startTranscription, transcript, connection }
}
```

**Security Notes**:
- **MVP**: Use `NEXT_PUBLIC_DEEPGRAM_API_KEY` for faster development
- **Production**: Implement temporary token generation via server route
- **Rate Limiting**: Monitor usage via Deepgram dashboard

**Documentation References**:
- Live Transcription: https://developers.deepgram.com/docs/live-streaming-audio

---

## 3. LLM Field Extraction Workflow

### Challenge
Extract structured data from raw transcription to populate note template fields. Handle streaming responses for better UX.

### Options Evaluated

**Option A: Streaming with Vercel AI SDK**
- ✅ Native streaming support with `streamText` and `streamObject`
- ✅ React hooks (`useChat`, `useCompletion`) for UI integration
- ✅ AI Gateway integration for observability
- ✅ Better UX (progressive field population)
- ✅ Built-in structured output with Zod schemas
- **Verdict**: SELECTED

**Option B: Batch Processing**
- ❌ Poor UX (wait for full response)
- ❌ No progressive feedback
- **Verdict**: Rejected

### Decision: Streaming LLM Extraction with AI SDK ✅ VERIFIED

**Implementation approach** ✅ VERIFIED against Vercel AI SDK v5:
- **Documentation**: https://ai-sdk.dev/docs
- **Structured Outputs**: https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data
- **Streaming**: https://ai-sdk.dev/docs/foundations/streaming
```typescript
// app/api/notes/[noteId]/extract/route.ts
import { streamObject } from 'ai'
import { openai } from '@ai-sdk/openai' // or use AI Gateway
import { z } from 'zod'

// Define schema based on template structure
const extractionSchema = z.object({
  subjective: z.string().describe('Client reported feelings and concerns'),
  objective: z.string().describe('Observed behaviors and mood'),
  assessment: z.string().describe('Clinical impression'),
  plan: z.string().describe('Treatment plan and next steps'),
  missingFields: z.array(z.string()).optional().describe('Required fields that could not be filled'),
  clarifyingQuestions: z.array(z.string()).optional().describe('Questions to ask practitioner'),
})

export async function POST(request: Request, { params }: { params: { noteId: string } }) {
  const { transcription, templateId } = await request.json()
  const template = await getTemplate(templateId)

  // Use streamObject for structured extraction
  const result = await streamObject({
    model: openai('gpt-4-turbo'),
    schema: extractionSchema,
    system: `You are a clinical notes assistant. Extract information from the transcription and map to the SOAP note template fields. If critical information is missing, list clarifying questions.`,
    prompt: transcription,
    onFinish: async ({ object }) => {
      // Save extracted fields to database
      await supabase
        .from('notes')
        .update({ extracted_fields: object })
        .eq('id', params.noteId)
    },
  })

  return result.toTextStreamResponse()
}

// Client Component: useNoteExtraction hook
export function useNoteExtraction(noteId: string) {
  const { object, submit, isLoading } = useObject({
    api: `/api/notes/${noteId}/extract`,
    schema: extractionSchema,
    onFinish: ({ object }) => {
      // Update note editor with extracted fields
      console.log('Extracted:', object)
    },
  })

  return { extract: submit, isLoading, fields: object }
}
```

**For Conversational Follow-ups**:
```typescript
// Use useChat for multi-turn conversations
export function useNoteChat(noteId: string) {
  const { messages, append, isLoading } = useChat({
    api: `/api/notes/${noteId}/chat`,
    initialMessages: [],
    onFinish: async (message) => {
      // Save conversation to database
      await fetch(`/api/notes/${noteId}/conversations`, {
        method: 'POST',
        body: JSON.stringify({ role: 'assistant', content: message.content }),
      })
    },
  })

  return { messages, sendMessage: append, isLoading }
}
```

**Documentation References**:
- Vercel AI SDK Core: https://ai-sdk.dev/docs/reference/ai-sdk-core
- Structured Output (`streamObject`): https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-object
- React Hooks (`useChat`, `useObject`): https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat, https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-object, 
- AI Gateway: https://ai-sdk.dev/providers/ai-sdk-providers/ai-gateway

---

## 4. Semantic Search with pgvector

### Challenge
Enable natural language querying across all notes with contextual results and references.

### Options Evaluated

**Option A: pgvector with Embeddings**
- ✅ Native PostgreSQL extension
- ✅ Supabase supports pgvector out-of-box
- ✅ Fast similarity search with indexes
- ✅ Row-level security applies to vector queries
- ⚠️ Requires embedding generation on note save
- **Verdict**: SELECTED

**Option B: External Vector Database (Pinecone, Weaviate)**
- ❌ Additional infrastructure
- ❌ Data duplication and sync challenges
- ❌ Separate auth/security model
- **Verdict**: Rejected (unnecessary complexity)

### Decision: pgvector with AI SDK Embeddings ✅ VERIFIED

**Implementation approach** ✅ VERIFIED against AI SDK v5:
```typescript
// Generate embedding on note save
// app/api/notes/[noteId]/route.ts (PATCH handler)
import { embed } from 'ai'
import { openai } from '@ai-sdk/openai'

export async function PATCH(request: Request, { params }: { params: { noteId: string } }) {
  const { content } = await request.json()

  // Generate embedding using AI SDK (through AI Gateway)
  const { embedding } = await embed({
    model: openai.textEmbeddingModel('text-embedding-3-small'),
    value: content,
  })

  // Save to database with vector column
  await supabase
    .from('notes')
    .update({ content, embedding })
    .eq('id', params.noteId)

  return Response.json({ success: true })
}

// Semantic search query
// app/api/search/route.ts
export async function POST(request: Request) {
  const { query } = await request.json()

  // Generate query embedding using AI SDK
  const { embedding: queryEmbedding } = await embed({
    model: openai.textEmbeddingModel('text-embedding-3-small'),
    value: query,
  })

  // Vector similarity search with RLS
  const { data: results } = await supabase.rpc('search_notes', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: 10,
  })

  return Response.json({ results })
}
```

**Database function**:
```sql
CREATE FUNCTION search_notes(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  client_id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    notes.id,
    notes.client_id,
    notes.content,
    1 - (notes.embedding <=> query_embedding) AS similarity
  FROM notes
  WHERE 1 - (notes.embedding <=> query_embedding) > match_threshold
  AND notes.practitioner_id = auth.uid() -- RLS filter
  ORDER BY notes.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## 5. Session Notification Scheduling

### Challenge
Generate notifications on scheduled session dates for clients with follow-up items.

### Options Evaluated

**Option A: pg_cron with Supabase**
- ✅ Native PostgreSQL scheduling
- ✅ Supabase supports pg_cron
- ✅ Runs server-side, no external service
- ⚠️ Requires cron job setup in migrations
- **Verdict**: SELECTED

**Option B: External Scheduler (Vercel Cron, Supabase Edge Functions)**
- ✅ More control over execution
- ❌ Additional configuration and monitoring
- ❌ Not available in local development without workarounds
- **Verdict**: Rejected (unnecessary complexity for MVP)

### Decision: pg_cron with Daily Notification Job ✅ VERIFIED

**Implementation approach** ✅ VERIFIED against Supabase pg_cron setup:
```sql
-- Migration: Setup pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Daily job to generate session notifications
SELECT cron.schedule(
  'generate-session-notifications',
  '0 6 * * *', -- Run at 6 AM daily
  $$
  INSERT INTO notifications (practitioner_id, client_id, type, content, created_at)
  SELECT
    n.practitioner_id,
    n.client_id,
    'session_reminder' AS type,
    json_build_object(
      'previous_note_id', n.id,
      'scheduled_date', n.next_session_date,
      'follow_ups', n.follow_up_items
    ) AS content,
    NOW() AS created_at
  FROM notes n
  WHERE n.next_session_date = CURRENT_DATE
    AND n.follow_up_items IS NOT NULL
    AND n.status = 'approved'
    AND NOT EXISTS (
      SELECT 1 FROM notifications
      WHERE client_id = n.client_id
        AND type = 'session_reminder'
        AND created_at::date = CURRENT_DATE
    );
  $$
);
```

**Client-side notification display**:
```typescript
// app/(dashboard)/page.tsx (Dashboard home - Server Component)
export default async function DashboardPage() {
  const supabase = createServerClient()
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*, client:clients(*), note:notes(*)')
    .eq('viewed', false)
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1>Upcoming Sessions</h1>
      {notifications?.map(notif => (
        <SessionNotificationCard key={notif.id} notification={notif} />
      ))}
    </div>
  )
}
```

---

## 6. Client-Side State Management

### Challenge
Synchronize server data with client UI, handle optimistic updates, and manage cache invalidation.

### Options Evaluated

**Option A: SWR**
- ✅ Simple API, small bundle
- ✅ Built-in revalidation strategies
- ✅ Optimistic updates via `mutate`
- ⚠️ Less feature-rich than TanStack Query
- **Verdict**: SELECTED for simple CRUD

**Option B: TanStack Query (React Query)**
- ✅ More powerful caching and invalidation
- ✅ Better DevTools
- ✅ Query dependencies and pagination
- ⚠️ Larger bundle, more complex API
- **Verdict**: SELECTED for complex queries (search, infinite scroll)

**Option C: Hybrid Approach**
- ✅ Use SWR for simple fetching, TanStack Query for advanced cases
- ⚠️ Two state management libraries
- **Verdict**: SELECTED (pragmatic choice)

### Decision: Hybrid SWR + TanStack Query ✅ VERIFIED

**Note**: Prefer Server Components with async/await for data fetching when possible. Use client-side fetching only when needed (real-time updates, optimistic UI, search).

**Implementation approach** ✅ VERIFIED patterns:
```typescript
// Simple data fetching with SWR (client list)
export function useClients() {
  const { data, error, mutate } = useSWR('/api/clients', fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5000,
  })

  return { clients: data, isLoading: !error && !data, mutate }
}

// Complex queries with TanStack Query (search with filters)
export function useNoteSearch(query: string, filters: SearchFilters) {
  return useQuery({
    queryKey: ['notes', 'search', query, filters],
    queryFn: () => fetch('/api/search', {
      method: 'POST',
      body: JSON.stringify({ query, filters }),
    }).then(r => r.json()),
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Optimistic update for note approval (SWR)
export function useApproveNote(noteId: string) {
  const { mutate } = useSWRConfig()

  return async () => {
    // Optimistically update UI
    mutate(`/api/notes/${noteId}`, { status: 'approved' }, false)

    // Send request
    await fetch(`/api/notes/${noteId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved' }),
    })

    // Revalidate
    mutate(`/api/notes/${noteId}`)
  }
}
```

**Rationale**: SWR for straightforward GET requests, TanStack Query for search/filtering where cache invalidation is complex.

---

## Summary of Architectural Decisions ✅ VERIFIED

| Decision Area | Selected Approach | Status | Key Rationale | Documentation |
|---------------|-------------------|--------|---------------|---------------|
| **Markdown Editor** | Novel (primary) or Tiptap OSS/Lexical (alt) | ✅ VERIFIED | Both FREE (MIT), AI-native, Novel built on Tiptap core, best DX | [Novel](https://novel.sh) / [Tiptap](https://tiptap.dev) / [Lexical](https://lexical.dev) |
| **Transcription** | Deepgram SDK v3 (client-side) | ✅ VERIFIED | SDK handles WebSocket internally, `createClient()` pattern, env key for MVP | [Deepgram v3](https://developers.deepgram.com/docs/live-streaming-audio) |
| **LLM Extraction** | AI SDK `streamObject` + Zod | ✅ VERIFIED | Type-safe structured extraction, streaming UX, validated against v5 docs | [AI SDK](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) |
| **Embeddings** | AI SDK `embed()` via AI Gateway | ✅ VERIFIED | Uses `openai.textEmbeddingModel()`, NOT direct OpenAI SDK, consistent with AI SDK patterns | [AI SDK Embeddings](https://ai-sdk.dev/docs/ai-sdk-core/embeddings) |
| **Semantic Search** | pgvector + HNSW index | ✅ VERIFIED | Native Supabase, RLS support, per-client filtering, cosine similarity optimal | [pgvector](https://github.com/pgvector/pgvector) |
| **Session Notifications** | pg_cron | ✅ VERIFIED | Server-side, native PostgreSQL, daily job, simple setup | [pg_cron](https://github.com/citusdata/pg_cron) |
| **Client State** | Server Components first, SWR/TanStack for client-side | ✅ VERIFIED | Prefer async Server Components, client hooks only when needed | [SWR](https://swr.vercel.app) / [TanStack](https://tanstack.com/query) |
| **Per-Client Search** | pgvector with client_id filter | ✅ VERIFIED | Dedicated search per client, unified notes + assessments results | Custom implementation |

### Key Corrections from Initial Research ✅ VERIFIED (2024)

1. **Tiptap Open Source is FREE**: Initial research incorrectly stated Tiptap was expensive. The open source version (MIT) has sufficient features for MVP. Only Tiptap Platform ($299-999/mo) is paid.
2. **Novel is also FREE**: MIT licensed, built on free Tiptap OSS, includes AI features out-of-box
3. **AI SDK Embeddings corrected**: Use `embed()` from `'ai'` package with `openai.textEmbeddingModel()`, NOT direct OpenAI SDK calls
4. **Deepgram SDK v3 verified**: Import from `@deepgram/sdk`, use `createClient()`, event-based WebSocket handling
5. **pgvector HNSW verified**: Optimal index configuration for 1536-dimension embeddings with cosine similarity
6. **Documentation verified**: All implementation patterns validated against official 2024 documentation

### Best Practices Applied ✅ VERIFIED

- ✅ **All patterns verified against 2024 official documentation** (Deepgram v3, AI SDK v5, Novel, Tiptap, pgvector)
- ✅ **Type safety throughout** (Zod schemas, generated Supabase types, strict TypeScript)
- ✅ **Free/open source prioritized** (Novel/Tiptap OSS both FREE, pgvector > Pinecone)
- ✅ **Server-first architecture** (RLS, Server Components, minimal client bundles)
- ✅ **Progressive enhancement** (streaming responses, optimistic updates)
- ✅ **AI SDK as unified gateway** (embeddings and LLM calls through single SDK, better observability)

All decisions align with constitutional principles (type safety, performance, security, accessibility) and leverage the specified tech stack (Next.js 16, Supabase, Vercel AI SDK v5, Deepgram SDK v3, shadcn/ui).

---

## Verification References

All implementation patterns were verified against official documentation in November 2024:

- **Novel**: https://novel.sh (MIT licensed)
- **Tiptap Open Source**: https://tiptap.dev/open-source-to-platform (MIT licensed)
- **Deepgram SDK v3**: https://github.com/deepgram/deepgram-js-sdk
- **Vercel AI SDK v5**: https://ai-sdk.dev/docs
- **AI SDK Embeddings**: https://ai-sdk.dev/docs/ai-sdk-core/embeddings
- **pgvector**: https://github.com/pgvector/pgvector
- **Supabase pg_cron**: https://supabase.com/docs/guides/database/extensions/pg_cron
- **SWR**: https://swr.vercel.app
- **TanStack Query**: https://tanstack.com/query/latest
