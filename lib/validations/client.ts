/**
 * Zod validation schemas for client entities
 *
 * Provides type-safe validation for client profile data.
 * Used in API routes and forms to ensure data integrity.
 */

import { z } from "zod";

/**
 * Client status enum
 */
export const clientStatusSchema = z.enum(["active", "inactive", "archived"]);

export type ClientStatus = z.infer<typeof clientStatusSchema>;

/**
 * Schema for creating a new client
 *
 * Required fields:
 * - full_name: Client's full name
 * - practitioner_id: UUID of the practitioner (set server-side from auth)
 *
 * Optional fields:
 * - email: Contact email
 * - phone: Contact phone number
 * - date_of_birth: Client's date of birth
 * - initial_assessment_date: Date of first assessment
 * - notes_summary: Brief overview for quick reference
 * - metadata: Additional custom fields as JSON
 */
export const createClientSchema = z.object({
  full_name: z
    .string()
    .min(1, "Full name is required")
    .max(255, "Full name must be less than 255 characters"),
  email: z.string().email("Invalid email address").optional().nullable(),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-()]+$/, "Invalid phone number format")
    .optional()
    .nullable(),
  date_of_birth: z.coerce.date().optional().nullable(),
  initial_assessment_date: z.coerce.date().optional().nullable(),
  notes_summary: z
    .string()
    .max(500, "Notes summary must be less than 500 characters")
    .optional()
    .nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;

/**
 * Schema for updating an existing client
 *
 * All fields are optional for partial updates.
 * Status can be changed to archive clients.
 */
export const updateClientSchema = createClientSchema.partial().extend({
  status: clientStatusSchema.optional(),
});

export type UpdateClientInput = z.infer<typeof updateClientSchema>;

/**
 * Schema for client query parameters (list/search)
 *
 * Supports:
 * - search: Full-text search on full_name
 * - status: Filter by client status
 * - page: Pagination page number (1-indexed)
 * - limit: Number of results per page
 */
export const clientQuerySchema = z.object({
  search: z.string().optional(),
  status: clientStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ClientQueryParams = z.infer<typeof clientQuerySchema>;

/**
 * Schema for client detail response
 *
 * Includes aggregated statistics from related entities.
 */
export const clientDetailSchema = z.object({
  id: z.string().uuid(),
  practitioner_id: z.string().uuid(),
  full_name: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  date_of_birth: z.date().nullable(),
  initial_assessment_date: z.date().nullable(),
  status: clientStatusSchema,
  notes_summary: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()),
  created_at: z.date(),
  updated_at: z.date(),
  // Aggregated stats
  total_notes: z.number().int().nonnegative().optional(),
  total_assessments: z.number().int().nonnegative().optional(),
  last_session_date: z.date().nullable().optional(),
});

export type ClientDetail = z.infer<typeof clientDetailSchema>;
