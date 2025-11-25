# API Route Contracts - Process Note-Taking Application

**Feature**: 001-process-note-app
**Created**: 2025-11-20

## Overview

All API routes follow REST conventions with Next.js App Router Route Handlers. Authentication required via Supabase session cookies. All responses use JSON format.

**Base URL**: `/api`

**Authentication**: All routes require valid Supabase session (checked via middleware)

**Error Response Format**:
```typescript
{
  error: string
  code?: string
  details?: unknown
}
```

---

## 1. Authentication Routes

### POST /api/auth/callback
Supabase auth callback handler (handles OAuth redirects).

**Request**: Query params from Supabase auth flow
**Response**: Redirect to dashboard
**Status Codes**: 302 (redirect), 400 (error)

---

## 2. Client Routes

### GET /api/clients
List all clients for authenticated practitioner.

**Query Params**:
- `search?: string` - Filter by client name (uses trigram search)
- `status?: 'active' | 'inactive' | 'archived'` - Filter by status
- `limit?: number` - Pagination limit (default: 50)
- `offset?: number` - Pagination offset (default: 0)

**Response**:
```typescript
{
  clients: Array<{
    id: string
    full_name: string
    email: string | null
    phone: string | null
    status: 'active' | 'inactive' | 'archived'
    last_session_date: string | null
    total_notes: number
    created_at: string
  }>
  total: number
}
```

**Status Codes**: 200, 401, 500

---

### POST /api/clients
Create new client profile.

**Request Body**:
```typescript
{
  full_name: string
  email?: string
  phone?: string
  date_of_birth?: string // ISO date
  initial_assessment_date?: string // ISO date
  notes_summary?: string
  metadata?: Record<string, unknown>
}
```

**Response**:
```typescript
{
  client: {
    id: string
    full_name: string
    ...
  }
}
```

**Validation**: Zod schema enforces required fields
**Status Codes**: 201, 400, 401, 500

---

### GET /api/clients/[clientId]
Get client details with recent notes and assessments.

**Response**:
```typescript
{
  client: {
    id: string
    full_name: string
    email: string | null
    phone: string | null
    date_of_birth: string | null
    status: string
    notes_summary: string | null
    created_at: string
    updated_at: string
  }
  recent_notes: Array<{
    id: string
    session_date: string
    status: string
    template_name: string | null
  }>
  recent_assessments: Array<{
    id: string
    template_name: string
    calculated_score: number | null
    interpretation: string | null
    assessment_date: string
  }>
  session_progress: {
    total_sessions: number
    first_session_date: string | null
    last_session_date: string | null
    avg_duration_minutes: number | null
  }
}
```

**Status Codes**: 200, 401, 404, 500

---

### PATCH /api/clients/[clientId]
Update client profile.

**Request Body**: Partial client fields (same as POST)

**Response**:
```typescript
{
  client: { ...updated fields }
}
```

**Status Codes**: 200, 400, 401, 404, 500

---

### DELETE /api/clients/[clientId]
Soft delete client (sets `archived_at` timestamp).

**Response**:
```typescript
{
  success: true
}
```

**Status Codes**: 200, 401, 404, 500

---

## 3. Note Routes

### GET /api/notes
List notes with filters.

**Query Params**:
- `client_id?: string` - Filter by client
- `status?: 'draft' | 'completed' | 'approved'`
- `from_date?: string` - Filter session_date >= ISO date
- `to_date?: string` - Filter session_date <= ISO date
- `limit?: number` (default: 20)
- `offset?: number` (default: 0)

**Response**:
```typescript
{
  notes: Array<{
    id: string
    client_id: string
    client_name: string
    template_name: string | null
    status: string
    session_date: string
    duration_minutes: number | null
    created_at: string
  }>
  total: number
}
```

**Status Codes**: 200, 401, 500

---

### POST /api/notes
Create new note (initially draft status).

**Request Body**:
```typescript
{
  client_id: string
  template_id?: string
  session_date?: string // ISO datetime (defaults to now)
  duration_minutes?: number
}
```

**Response**:
```typescript
{
  note: {
    id: string
    client_id: string
    template_id: string | null
    status: 'draft'
    created_at: string
  }
}
```

**Status Codes**: 201, 400, 401, 500

---

### GET /api/notes/[noteId]
Get full note details including content and conversation history.

**Response**:
```typescript
{
  note: {
    id: string
    client_id: string
    client_name: string
    template_id: string | null
    template: { name: string; structure: object } | null
    markdown_content: string | null
    raw_transcription: string | null
    extracted_fields: Record<string, unknown>
    status: string
    session_date: string
    next_session_date: string | null
    follow_up_items: string[] | null
    duration_minutes: number | null
    created_at: string
    approved_at: string | null
  }
  conversation: Array<{
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    created_at: string
  }>
}
```

**Status Codes**: 200, 401, 404, 500

---

### PATCH /api/notes/[noteId]
Update note content or metadata.

**Request Body**:
```typescript
{
  markdown_content?: string
  extracted_fields?: Record<string, unknown>
  status?: 'draft' | 'completed' | 'approved'
  next_session_date?: string | null
  follow_up_items?: string[] | null
  duration_minutes?: number
}
```

**Side Effect**: If `markdown_content` updated, triggers embedding regeneration

**Response**:
```typescript
{
  note: { ...updated fields }
}
```

**Status Codes**: 200, 400, 401, 404, 500

---

### DELETE /api/notes/[noteId]
Soft delete note.

**Response**:
```typescript
{
  success: true
}
```

**Status Codes**: 200, 401, 404, 500

---

### POST /api/notes/[noteId]/extract
LLM extraction of structured fields from raw transcription.

**Request Body**:
```typescript
{
  transcription: string
  template_id: string
  mode?: 'initial' | 'followup' // Default: 'initial'
  previous_messages?: Array<{ role: string; content: string }> // For followup
}
```

**Response**: Streaming text response (uses Vercel AI SDK `streamText`)
```typescript
// Stream format: data-stream protocol
// Final message contains extracted JSON:
{
  fields: Record<string, string>
  missing_required: string[] // Fields that need clarification
  followup_questions?: string[] // Questions to ask practitioner
}
```

**Side Effect**: Saves conversation to `note_conversations` table

**Status Codes**: 200 (stream), 400, 401, 404, 500

---

## 4. Transcription Routes

### POST /api/transcription/token
Generate temporary Deepgram API token for client-side connection.

**Response**:
```typescript
{
  token: string // Valid for 1 hour
  expires_at: string // ISO datetime
}
```

**Status Codes**: 200, 401, 500

**Note**: Client-side component uses this token to establish WebSocket connection directly to Deepgram. No proxy needed.

---

## 5. Assessment Routes

### GET /api/assessments/templates
List available assessment templates.

**Query Params**:
- `category?: string` - Filter by category

**Response**:
```typescript
{
  templates: Array<{
    id: string
    name: string
    description: string | null
    category: string | null
    is_active: boolean
  }>
}
```

**Status Codes**: 200, 500

---

### GET /api/assessments/templates/[templateId]
Get full assessment template with questions and scoring rules.

**Response**:
```typescript
{
  template: {
    id: string
    name: string
    description: string | null
    category: string | null
    questions: Array<{
      id: string
      text: string
      type: string // 'scale', 'text', 'boolean', etc.
      options?: string[]
      scores?: number[]
    }>
    scoring_rules: {
      total_range: [number, number]
      interpretation: Array<{
        range: [number, number]
        label: string
      }>
    }
  }
}
```

**Status Codes**: 200, 404, 500

---

### POST /api/assessments/results
Submit completed assessment.

**Request Body**:
```typescript
{
  client_id: string
  template_id: string
  responses: Record<string, number | string | boolean> // Question ID → response
  notes?: string
  assessment_date?: string // ISO datetime (defaults to now)
}
```

**Side Effect**: Automatically calculates score based on template's scoring_rules

**Response**:
```typescript
{
  result: {
    id: string
    client_id: string
    template_id: string
    responses: object
    calculated_score: number | null
    interpretation: string | null
    notes: string | null
    assessment_date: string
    created_at: string
  }
}
```

**Status Codes**: 201, 400, 401, 500

---

### GET /api/assessments/results
List assessment results for a client.

**Query Params**:
- `client_id: string` (required)
- `template_id?: string` - Filter by template
- `limit?: number` (default: 20)
- `offset?: number` (default: 0)

**Response**:
```typescript
{
  results: Array<{
    id: string
    template_name: string
    calculated_score: number | null
    interpretation: string | null
    assessment_date: string
    created_at: string
  }>
  total: number
}
```

**Status Codes**: 200, 400, 401, 500

---

## 6. Search Routes

### POST /api/search
Natural language semantic search across all notes and assessments.

**Request Body**:
```typescript
{
  query: string
  client_id?: string // Optional: search within specific client only
  include_types?: Array<'notes' | 'assessments'> // Default: both
  match_threshold?: number // Similarity threshold (0-1, default: 0.7)
  limit?: number // Max results (default: 10)
}
```

**Side Effect**: Generates embedding for query using Vercel AI SDK

**Response**:
```typescript
{
  results: Array<{
    type: 'note' | 'assessment'
    id: string
    client_id: string
    client_name: string
    content: string // Truncated to relevant excerpt
    date: string // session_date or assessment_date
    similarity: number // Cosine similarity score
    metadata?: {
      template_name?: string
      interpretation?: string // For assessments
    }
  }>
  query: string
  scope: 'all_clients' | 'single_client'
}
```

**Status Codes**: 200, 400, 401, 500

**Implementation**: Uses `search_notes()` and `search_assessments()` PostgreSQL functions with pgvector

---

### POST /api/clients/[clientId]/search
Natural language search scoped to a specific client's notes and assessments.

**Request Body**:
```typescript
{
  query: string
  include_types?: Array<'notes' | 'assessments'> // Default: both
  match_threshold?: number // Similarity threshold (0-1, default: 0.7)
  limit?: number // Max results (default: 20)
}
```

**Side Effect**: Generates embedding for query using Vercel AI SDK

**Response**:
```typescript
{
  results: Array<{
    type: 'note' | 'assessment'
    id: string
    content: string // Relevant excerpt
    date: string
    similarity: number
    metadata?: {
      template_name?: string
      interpretation?: string
      score?: number
    }
  }>
  query: string
  client: {
    id: string
    full_name: string
  }
}
```

**Usage**: Powers the per-client search tab on client detail page

**Status Codes**: 200, 400, 401, 404 (client not found), 500

**Implementation**: Uses client_id filter in pgvector search functions

---

## 7. Notification Routes

### GET /api/notifications
List notifications for authenticated practitioner.

**Query Params**:
- `viewed?: boolean` - Filter by viewed status
- `type?: string` - Filter by notification type
- `limit?: number` (default: 20)
- `offset?: number` (default: 0)

**Response**:
```typescript
{
  notifications: Array<{
    id: string
    type: string
    title: string
    content: object
    viewed: boolean
    viewed_at: string | null
    created_at: string
    client?: {
      id: string
      full_name: string
    }
  }>
  total: number
  unread_count: number
}
```

**Status Codes**: 200, 401, 500

---

### PATCH /api/notifications/[notificationId]
Mark notification as viewed.

**Request Body**:
```typescript
{
  viewed: boolean
}
```

**Response**:
```typescript
{
  success: true
}
```

**Status Codes**: 200, 401, 404, 500

---

## Request/Response Headers

### Required Headers (All Routes)
- `Content-Type: application/json`
- `Cookie: sb-<project>-auth-token=<token>` (set by Supabase auth)

### Response Headers
- `Content-Type: application/json` (except streaming routes)
- `Content-Type: text/event-stream` (streaming extraction route)

---

## Rate Limiting

**Strategy**: Implement via Supabase Edge Functions or Vercel Edge Middleware

**Limits** (suggested):
- General API calls: 100 requests/minute per user
- LLM extraction: 10 requests/minute per user
- Search: 30 requests/minute per user

---

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request - Invalid input or validation error |
| 401 | Unauthorized - Missing or invalid session |
| 403 | Forbidden - User lacks permission (shouldn't occur with RLS) |
| 404 | Not Found - Resource doesn't exist or user lacks access |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Unexpected server error |

---

## TypeScript Types for API

```typescript
// lib/types/api.types.ts

export type ApiResponse<T> = {
  data?: T
  error?: {
    message: string
    code?: string
    details?: unknown
  }
}

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  limit: number
  offset: number
}

// Example usage in Route Handler
import type { NextRequest } from 'next/server'
import type { Client } from '@/lib/types/database.types'

export async function GET(request: NextRequest): Promise<Response> {
  const clients = await getClients()
  return Response.json({ clients })
}
```

---

## Summary

This API design:
- ✅ Follows RESTful conventions with clear resource paths
- ✅ Supports all user stories (P1-P5)
- ✅ Enforces authentication via Supabase middleware
- ✅ Uses RLS for data isolation (no manual permission checks needed)
- ✅ Provides streaming for LLM extraction (better UX)
- ✅ Integrates Deepgram via temporary tokens (secure + simple)
- ✅ Supports semantic search with pgvector
- ✅ Fully typed with TypeScript for type safety

All routes align with constitutional principles (security, type safety, performance).
