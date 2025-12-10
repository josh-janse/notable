import { z } from "zod";

/**
 * Template Schema Validation and Utilities
 *
 * Provides Zod schemas and utility functions for validating and working with
 * note template structures stored in the database.
 */

export const templateHeaderSchema = z.object({
  level: z.number().int().min(1).max(6),
  text: z.string().min(1),
  locked: z.boolean().default(true),
  required: z.boolean().default(false),
});

export const templateSectionSchema = z.object({
  title: z.string().min(1),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  locked: z.boolean().default(false),
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(1).optional(),
  validationRules: z
    .object({
      pattern: z.string().optional(),
      errorMessage: z.string().optional(),
    })
    .optional(),
});

export const templateStructureSchema = z.object({
  headers: z.array(templateHeaderSchema).optional(),
  sections: z.array(templateSectionSchema).min(1),
  metadata: z
    .object({
      version: z.string().optional(),
      createdAt: z.string().optional(),
      category: z.string().optional(),
    })
    .optional(),
});

export const noteTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  structure: templateStructureSchema,
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type TemplateHeader = z.infer<typeof templateHeaderSchema>;
export type TemplateSection = z.infer<typeof templateSectionSchema>;
export type TemplateStructure = z.infer<typeof templateStructureSchema>;
export type NoteTemplate = z.infer<typeof noteTemplateSchema>;

/**
 * Validate a template structure
 *
 * Validates that a template structure conforms to the expected schema.
 * Throws an error with detailed validation messages if invalid.
 */
export function validateTemplateStructure(
  structure: unknown
): TemplateStructure {
  return templateStructureSchema.parse(structure);
}

/**
 * Validate a complete note template
 *
 * Validates that a note template conforms to the expected schema.
 */
export function validateNoteTemplate(template: unknown): NoteTemplate {
  return noteTemplateSchema.parse(template);
}

/**
 * Check if a template structure is valid
 *
 * Returns true if valid, false otherwise. Does not throw errors.
 */
export function isValidTemplateStructure(structure: unknown): boolean {
  return templateStructureSchema.safeParse(structure).success;
}

/**
 * Get required sections from a template
 *
 * Returns an array of required section titles from a template structure.
 */
export function getRequiredSections(structure: TemplateStructure): string[] {
  return structure.sections
    .filter((section) => section.required)
    .map((section) => section.title);
}

/**
 * Check if all required sections are filled
 *
 * Validates that all required sections in a template have content.
 */
export function validateRequiredSections(
  structure: TemplateStructure,
  content: Record<string, string>
): { valid: boolean; missingSections: string[] } {
  const requiredSections = getRequiredSections(structure);
  const missingSections = requiredSections.filter(
    (title) => !content[title] || content[title].trim().length === 0
  );

  return {
    valid: missingSections.length === 0,
    missingSections,
  };
}

/**
 * Convert template structure to markdown
 *
 * Generates a markdown string from a template structure with headers and section placeholders.
 */
export function templateToMarkdown(structure: TemplateStructure): string {
  const parts: string[] = [];

  if (structure.headers && structure.headers.length > 0) {
    for (const header of structure.headers) {
      const hashes = "#".repeat(header.level);
      parts.push(`${hashes} ${header.text}`);
      parts.push("");
    }
  }

  for (const section of structure.sections) {
    parts.push(`## ${section.title}${section.required ? " *" : ""}`);
    parts.push("");
    if (section.placeholder) {
      parts.push(`_${section.placeholder}_`);
    }
    parts.push("");
  }

  return parts.join("\n");
}

/**
 * Parse markdown content into template sections
 *
 * Extracts section content from markdown text based on template structure.
 * Returns a record mapping section titles to their content.
 */

const SECTION_HEADER_REGEX = /^##\s+(.+?)(?:\s+\*)?$/;

export function markdownToSections(
  markdown: string,
  structure: TemplateStructure
): Record<string, string> {
  const sections: Record<string, string> = {};
  const sectionTitles = structure.sections.map((s) => s.title);

  const lines = markdown.split("\n");
  let currentSection: string | null = null;
  const sectionContent: string[] = [];

  for (const line of lines) {
    const headerMatch = line.match(SECTION_HEADER_REGEX);

    if (headerMatch) {
      if (currentSection && sectionContent.length > 0) {
        sections[currentSection] = sectionContent.join("\n").trim();
      }

      const title = headerMatch[1];
      if (sectionTitles.includes(title)) {
        currentSection = title;
        sectionContent.length = 0;
      }
    } else if (currentSection) {
      sectionContent.push(line);
    }
  }

  if (currentSection && sectionContent.length > 0) {
    sections[currentSection] = sectionContent.join("\n").trim();
  }

  return sections;
}

/**
 * Create a default SOAP note template structure
 *
 * Returns a pre-configured SOAP (Subjective, Objective, Assessment, Plan) note template.
 */
export function createSOAPTemplate(): TemplateStructure {
  return {
    headers: [
      { level: 1, text: "Session Note", locked: true, required: false },
    ],
    sections: [
      {
        title: "Subjective",
        placeholder:
          "Client's reported feelings, concerns, and experiences during the session",
        required: true,
        locked: false,
      },
      {
        title: "Objective",
        placeholder:
          "Observable behaviors, mood, appearance, and clinical observations",
        required: true,
        locked: false,
      },
      {
        title: "Assessment",
        placeholder:
          "Clinical impression, diagnosis considerations, and evaluation of progress",
        required: true,
        locked: false,
      },
      {
        title: "Plan",
        placeholder:
          "Treatment plan, interventions, homework assignments, and next steps",
        required: true,
        locked: false,
      },
    ],
    metadata: {
      version: "1.0",
      category: "Clinical",
    },
  };
}

/**
 * Create a progress note template structure
 *
 * Returns a pre-configured progress note template for tracking client progress.
 */
export function createProgressNoteTemplate(): TemplateStructure {
  return {
    headers: [
      { level: 1, text: "Progress Note", locked: true, required: false },
    ],
    sections: [
      {
        title: "Session Summary",
        placeholder: "Brief overview of today's session",
        required: true,
        locked: false,
      },
      {
        title: "Progress Towards Goals",
        placeholder: "Evaluation of progress on treatment goals",
        required: true,
        locked: false,
      },
      {
        title: "Interventions Used",
        placeholder: "Therapeutic techniques and interventions applied",
        required: false,
        locked: false,
      },
      {
        title: "Client Response",
        placeholder: "How the client responded to interventions",
        required: true,
        locked: false,
      },
      {
        title: "Plan for Next Session",
        placeholder: "Topics and goals for the next session",
        required: true,
        locked: false,
      },
    ],
    metadata: {
      version: "1.0",
      category: "Progress",
    },
  };
}
