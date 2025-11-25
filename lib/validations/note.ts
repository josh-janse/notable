/**
 * Zod validation schemas for note entities
 *
 * Provides type-safe validation for session notes, templates, and transcription data.
 * Used in API routes and forms to ensure data integrity.
 */

import { z } from "zod";

/**
 * Note status enum
 */
export const noteStatusSchema = z.enum(["draft", "completed", "approved"]);

export type NoteStatus = z.infer<typeof noteStatusSchema>;

/**
 * Schema for note template structure
 *
 * Defines the locked header and section format for markdown templates.
 */
export const templateHeaderSchema = z.object({
  level: z.number().int().min(1).max(6),
  text: z.string(),
  locked: z.boolean().default(false),
});

export const templateSectionSchema = z.object({
  title: z.string(),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
});

export const noteTemplateStructureSchema = z.object({
  headers: z.array(templateHeaderSchema).optional().default([]),
  sections: z.array(templateSectionSchema),
});

export type TemplateHeader = z.infer<typeof templateHeaderSchema>;
export type TemplateSection = z.infer<typeof templateSectionSchema>;
export type NoteTemplateStructure = z.infer<typeof noteTemplateStructureSchema>;

/**
 * Schema for creating a new note
 *
 * Required fields:
 * - client_id: UUID of the client this note is for
 * - practitioner_id: UUID of the practitioner (set server-side from auth)
 *
 * Optional fields:
 * - template_id: Note template to use
 * - markdown_content: Full markdown note content
 * - raw_transcription: Original Deepgram transcription text
 * - extracted_fields: LLM-extracted structured data
 * - session_date: Date/time of session
 * - next_session_date: Scheduled follow-up date
 * - follow_up_items: Specific commitments for next session
 * - duration_minutes: Session length
 */
export const createNoteSchema = z.object({
  client_id: z.string().uuid("Invalid client ID"),
  template_id: z.string().uuid("Invalid template ID").optional().nullable(),
  markdown_content: z.string().optional().nullable(),
  raw_transcription: z.string().optional().nullable(),
  extracted_fields: z.record(z.string(), z.unknown()).optional().default({}),
  session_date: z.coerce.date().optional(),
  next_session_date: z.coerce.date().optional().nullable(),
  follow_up_items: z.array(z.string()).optional().nullable(),
  duration_minutes: z.number().int().positive().optional().nullable(),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;

/**
 * Schema for updating an existing note
 *
 * All fields are optional for partial updates.
 * Status can be changed through note approval workflow.
 */
export const updateNoteSchema = createNoteSchema.partial().extend({
  status: noteStatusSchema.optional(),
});

export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

/**
 * Schema for LLM field extraction request
 *
 * Input for the /api/notes/[noteId]/extract endpoint.
 */
export const extractNoteFieldsSchema = z.object({
  transcription: z
    .string()
    .min(1, "Transcription text is required for extraction"),
  template_id: z.string().uuid("Invalid template ID").optional(),
  context: z
    .object({
      client_name: z.string().optional(),
      previous_notes: z.string().optional(),
      session_number: z.number().int().optional(),
    })
    .optional(),
});

export type ExtractNoteFieldsInput = z.infer<typeof extractNoteFieldsSchema>;

/**
 * Schema for note query parameters (list/search)
 *
 * Supports:
 * - client_id: Filter by specific client
 * - status: Filter by note status
 * - from_date: Filter notes from this date onwards
 * - to_date: Filter notes up to this date
 * - page: Pagination page number (1-indexed)
 * - limit: Number of results per page
 */
export const noteQuerySchema = z.object({
  client_id: z.string().uuid().optional(),
  status: noteStatusSchema.optional(),
  from_date: z.coerce.date().optional(),
  to_date: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type NoteQueryParams = z.infer<typeof noteQuerySchema>;

/**
 * Schema for note conversation message
 *
 * Represents a single message in the LLM chat history for a note.
 */
export const noteConversationMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1, "Message content cannot be empty"),
});

export type NoteConversationMessage = z.infer<
  typeof noteConversationMessageSchema
>;

/**
 * Schema for note detail response
 *
 * Includes full note data with related template information.
 */
export const noteDetailSchema = z.object({
  id: z.string().uuid(),
  practitioner_id: z.string().uuid(),
  client_id: z.string().uuid(),
  template_id: z.string().uuid().nullable(),
  markdown_content: z.string().nullable(),
  raw_transcription: z.string().nullable(),
  extracted_fields: z.record(z.string(), z.unknown()),
  status: noteStatusSchema,
  session_date: z.date(),
  next_session_date: z.date().nullable(),
  follow_up_items: z.array(z.string()).nullable(),
  duration_minutes: z.number().int().nullable(),
  created_at: z.date(),
  approved_at: z.date().nullable(),
  updated_at: z.date(),
  // Related data
  client_name: z.string().optional(),
  template_name: z.string().optional(),
});

export type NoteDetail = z.infer<typeof noteDetailSchema>;
