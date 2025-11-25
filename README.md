# Notable

A modern process note-taking application for coaches, counselors, therapists, and social workers.

## Features

- **Real-time transcription** - Voice-to-text capture using Deepgram
- **AI-powered templates** - Automatic note population with LLM extraction
- **Client management** - Organize and track client profiles
- **Assessments** - Conduct standardized screenings and evaluations
- **Smart search** - Natural language querying across all notes
- **Session tracking** - Follow-up notifications and progress monitoring

## Tech Stack

- Next.js 16 (App Router)
- React 19
- Supabase (Database, Auth, RLS)
- Vercel AI SDK
- Deepgram SDK
- Tailwind CSS 4
- shadcn/ui
- TypeScript

## Getting Started

1. Clone the repository
2. Copy `.env.example` to `.env.local` and configure your environment variables
3. Install dependencies: `npm install`
4. Start local Supabase: `npx supabase start`
5. Run migrations: `npx supabase db reset`
6. Start development server: `npm run dev`

## Project Status

Currently in development. Phase 1 (Setup) and Phase 2 (Foundational Infrastructure) complete.

See `specs/001-process-note-app/` for detailed specifications and task tracking.
