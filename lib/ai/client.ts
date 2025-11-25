/**
 * Vercel AI SDK client configuration with AI Gateway provider
 *
 * The AI Gateway automatically routes requests to different LLM providers
 * using the creator/model-name format (e.g., "openai/gpt-4").
 * No separate provider installation needed - built into AI SDK v5.0.36+.
 *
 * @see https://ai-sdk.dev/providers/ai-sdk-providers/ai-gateway
 */

import { createGateway } from "ai";

if (!process.env.AI_GATEWAY_API_KEY) {
  throw new Error(
    "AI_GATEWAY_API_KEY environment variable is required. " +
      "Set this in your .env file or use OIDC auth in Vercel deployments."
  );
}

/**
 * AI Gateway client for LLM operations
 *
 * Supports:
 * - Multiple providers through one interface (20+ providers)
 * - Automatic provider routing and fallbacks
 * - Usage tracking by user and tags
 * - BYOK (Bring Your Own Key) support
 *
 * Authentication:
 * - API Key: Set AI_GATEWAY_API_KEY environment variable
 * - OIDC: Automatic in Vercel production deployments
 *
 * @example
 * ```typescript
 * import { generateText } from 'ai'
 * import { gateway } from '@/lib/ai/client'
 *
 * const { text } = await generateText({
 *   model: gateway('openai/gpt-4'),
 *   prompt: 'Extract session notes'
 * })
 * ```
 */
export const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
  // Optional: Override default gateway URL
  // baseURL: 'https://ai-gateway.vercel.sh/v1/ai',
  // Optional: Add custom headers for tracking
  // headers: {
  //   'X-User-ID': 'practitioner-id',
  //   'X-Session-ID': 'session-id'
  // },
  // Optional: Custom metadata cache refresh interval (default: 5 minutes)
  // metadataCacheRefreshMillis: 300000,
});

/**
 * Default model for note field extraction
 * Using OpenAI GPT-4 Turbo for structured extraction
 */
export const DEFAULT_EXTRACTION_MODEL = "openai/gpt-4-turbo";

/**
 * Default model for embeddings
 * Using OpenAI text-embedding-3-small (1536 dimensions)
 */
export const DEFAULT_EMBEDDING_MODEL = "openai/text-embedding-3-small";

/**
 * Default model for summaries and general text generation
 * Using OpenAI GPT-4 Turbo for high-quality summaries
 */
export const DEFAULT_GENERATION_MODEL = "openai/gpt-4-turbo";
