/**
 * Deepgram SDK client configuration for real-time audio transcription
 *
 * Implements live streaming audio transcription using WebSocket connections.
 * Uses the nova-3 model for high-accuracy transcription.
 *
 * @see https://developers.deepgram.com/docs/live-streaming-audio
 */

import { createClient, type LiveTranscriptionEvent } from "@deepgram/sdk";

if (!process.env.DEEPGRAM_API_KEY) {
  throw new Error(
    "DEEPGRAM_API_KEY environment variable is required. " +
      "Get your API key from https://console.deepgram.com/"
  );
}

/**
 * Deepgram client instance
 *
 * Used to create live transcription connections.
 * Manages WebSocket connections to Deepgram's live streaming API.
 *
 * @example
 * ```typescript
 * import { deepgramClient, LIVE_TRANSCRIPTION_OPTIONS, LiveTranscriptionEvents } from '@/lib/deepgram/client'
 *
 * const connection = deepgramClient.listen.live(LIVE_TRANSCRIPTION_OPTIONS)
 *
 * connection.on(LiveTranscriptionEvents.Open, () => console.log('Connection opened'))
 * connection.on(LiveTranscriptionEvents.Transcript, (data) => {
 *   const transcript = data.channel.alternatives[0].transcript
 *   if (data.is_final) {
 *     console.log('Final:', transcript)
 *   }
 * })
 * ```
 */
export const deepgramClient = createClient(process.env.DEEPGRAM_API_KEY);

/**
 * Re-export LiveTranscriptionEvents for convenience
 *
 * Event constants:
 * - LiveTranscriptionEvents.Open: Connection established
 * - LiveTranscriptionEvents.Transcript: Transcription data received
 * - LiveTranscriptionEvents.Metadata: Session information
 * - LiveTranscriptionEvents.Close: Connection closed
 * - LiveTranscriptionEvents.Error: Connection or transcription error
 */
export { LiveTranscriptionEvents } from "@deepgram/sdk";

/**
 * Default configuration for live transcription
 *
 * Key settings:
 * - model: nova-3 (latest Deepgram model for highest accuracy)
 * - language: en-US (English transcription)
 * - smart_format: Enables formatting for currency, phone numbers, emails
 * - interim_results: Streams partial transcriptions before final results
 * - punctuate: Adds punctuation to transcripts
 * - utterances: Detects natural speech boundaries
 *
 * @see https://developers.deepgram.com/docs/live-streaming-audio#stream-configuration
 */
export const LIVE_TRANSCRIPTION_OPTIONS = {
  model: "nova-3",
  language: "en-US",
  smart_format: true,
  interim_results: true,
  punctuate: true,
  utterances: true,
  // Optional: Enable diarization for multi-speaker detection
  // diarize: true,
  // Optional: Add profanity filtering
  // profanity_filter: false,
} as const;

/**
 * Helper to extract transcript text from Deepgram response
 *
 * @param data - Deepgram transcript event data
 * @returns Transcript text or empty string if no alternatives
 */
export function extractTranscript(data: LiveTranscriptionEvent): string {
  return data.channel?.alternatives?.[0]?.transcript ?? "";
}

/**
 * Helper to check if transcript is final (not interim)
 *
 * @param data - Deepgram transcript event data
 * @returns True if this is a final transcript
 */
export function isFinalTranscript(data: LiveTranscriptionEvent): boolean {
  return data.is_final === true;
}

/**
 * Helper to check if speech has ended (utterance boundary)
 *
 * @param data - Deepgram transcript event data
 * @returns True if this marks the end of an utterance
 */
export function isSpeechFinal(data: LiveTranscriptionEvent): boolean {
  return data.speech_final === true;
}
