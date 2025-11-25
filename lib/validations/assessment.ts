/**
 * Zod validation schemas for assessment entities
 *
 * Provides type-safe validation for assessments, templates, and scoring.
 * Used in API routes and forms to ensure data integrity.
 */

import { z } from "zod";

/**
 * Schema for assessment question
 *
 * Defines structure for questions in assessment templates.
 */
export const assessmentQuestionSchema = z.object({
  id: z.string(),
  text: z.string().min(1, "Question text is required"),
  type: z.enum(["scale", "multiple_choice", "text", "yes_no"]),
  options: z.array(z.string()).optional(),
  scores: z.array(z.number()).optional(),
  required: z.boolean().default(true),
});

export type AssessmentQuestion = z.infer<typeof assessmentQuestionSchema>;

/**
 * Schema for assessment scoring interpretation
 */
export const scoringInterpretationSchema = z.object({
  range: z.tuple([z.number(), z.number()]),
  label: z.string(),
  description: z.string().optional(),
});

export type ScoringInterpretation = z.infer<typeof scoringInterpretationSchema>;

/**
 * Schema for assessment scoring rules
 */
export const assessmentScoringRulesSchema = z.object({
  total_range: z.tuple([z.number(), z.number()]),
  interpretation: z.array(scoringInterpretationSchema),
  reverse_score_questions: z.array(z.string()).optional(),
});

export type AssessmentScoringRules = z.infer<
  typeof assessmentScoringRulesSchema
>;

/**
 * Schema for assessment template structure
 */
export const assessmentTemplateStructureSchema = z.object({
  questions: z.array(assessmentQuestionSchema),
  scoring_rules: assessmentScoringRulesSchema.optional(),
});

export type AssessmentTemplateStructure = z.infer<
  typeof assessmentTemplateStructureSchema
>;

/**
 * Schema for creating a new assessment result
 *
 * Required fields:
 * - client_id: UUID of the client
 * - template_id: UUID of the assessment template
 * - responses: Question IDs mapped to responses
 *
 * Optional fields:
 * - notes: Practitioner's observations
 * - assessment_date: Date/time of assessment (defaults to now)
 */
export const createAssessmentResultSchema = z.object({
  client_id: z.string().uuid("Invalid client ID"),
  template_id: z.string().uuid("Invalid template ID"),
  responses: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean()])
  ),
  notes: z.string().optional().nullable(),
  assessment_date: z.coerce.date().optional(),
});

export type CreateAssessmentResultInput = z.infer<
  typeof createAssessmentResultSchema
>;

/**
 * Schema for updating an existing assessment result
 *
 * All fields are optional for partial updates.
 */
export const updateAssessmentResultSchema = z.object({
  responses: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
    .optional(),
  calculated_score: z.number().int().optional().nullable(),
  interpretation: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  assessment_date: z.coerce.date().optional(),
});

export type UpdateAssessmentResultInput = z.infer<
  typeof updateAssessmentResultSchema
>;

/**
 * Schema for assessment scoring request
 *
 * Input for the /api/assessments/[assessmentId]/score endpoint.
 */
export const scoreAssessmentSchema = z.object({
  assessment_id: z.string().uuid("Invalid assessment ID"),
  template_id: z.string().uuid("Invalid template ID"),
  responses: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean()])
  ),
});

export type ScoreAssessmentInput = z.infer<typeof scoreAssessmentSchema>;

/**
 * Schema for assessment query parameters (list/search)
 *
 * Supports:
 * - client_id: Filter by specific client
 * - template_id: Filter by assessment template
 * - from_date: Filter assessments from this date onwards
 * - to_date: Filter assessments up to this date
 * - page: Pagination page number (1-indexed)
 * - limit: Number of results per page
 */
export const assessmentQuerySchema = z.object({
  client_id: z.string().uuid().optional(),
  template_id: z.string().uuid().optional(),
  from_date: z.coerce.date().optional(),
  to_date: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type AssessmentQueryParams = z.infer<typeof assessmentQuerySchema>;

/**
 * Schema for assessment result detail response
 *
 * Includes full assessment data with scoring and interpretation.
 */
export const assessmentResultDetailSchema = z.object({
  id: z.string().uuid(),
  practitioner_id: z.string().uuid(),
  client_id: z.string().uuid(),
  template_id: z.string().uuid(),
  responses: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean()])
  ),
  calculated_score: z.number().int().nullable(),
  interpretation: z.string().nullable(),
  notes: z.string().nullable(),
  assessment_date: z.date(),
  created_at: z.date(),
  // Related data
  client_name: z.string().optional(),
  template_name: z.string().optional(),
  template_category: z.string().optional(),
});

export type AssessmentResultDetail = z.infer<
  typeof assessmentResultDetailSchema
>;

/**
 * Schema for assessment template detail
 */
export const assessmentTemplateDetailSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  questions: z.array(assessmentQuestionSchema),
  scoring_rules: assessmentScoringRulesSchema.nullable(),
  is_active: z.boolean(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type AssessmentTemplateDetail = z.infer<
  typeof assessmentTemplateDetailSchema
>;
