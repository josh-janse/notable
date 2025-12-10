import { streamObject } from "ai";
import { z } from "zod";
import { DEFAULT_EXTRACTION_MODEL, gateway } from "./client";

// Create dynamic schema based on template sections
function createExtractionSchema(
  sections: Array<{ title: string; placeholder?: string; required?: boolean }>
) {
  const schemaFields: Record<string, z.ZodString> = {};

  for (const section of sections) {
    schemaFields[section.title] = z
      .string()
      .describe(section.placeholder || section.title);
  }

  return z.object({
    ...schemaFields,
    missingFields: z
      .array(z.string())
      .optional()
      .describe(
        "Required fields that could not be filled from the transcription"
      ),
    clarifyingQuestions: z
      .array(z.string())
      .optional()
      .describe(
        "Questions to ask the practitioner for missing or unclear information"
      ),
  });
}

export type ExtractionResult = Record<string, string | string[] | undefined> & {
  missingFields?: string[];
  clarifyingQuestions?: string[];
};

type ExtractNoteFieldsOptions = {
  transcription: string;
  templateId: string;
  templateName?: string;
  templateStructure: {
    headers?: Array<{ level: number; text: string; locked?: boolean }>;
    sections: Array<{
      title: string;
      placeholder?: string;
      required?: boolean;
    }>;
  };
  model?: string;
};

export async function extractNoteFields({
  transcription,
  templateId,
  templateName = "Clinical Note",
  templateStructure,
  model = DEFAULT_EXTRACTION_MODEL,
}: ExtractNoteFieldsOptions) {
  const extractionSchema = createExtractionSchema(templateStructure.sections);

  const systemPrompt = `You are a clinical notes assistant helping healthcare practitioners extract structured information from session transcriptions.

Your task is to analyze the transcription and map the content to the template fields. Follow these guidelines:

1. Extract only information explicitly mentioned in the transcription
2. Do NOT invent, infer, or add information that is not present
3. Use professional clinical language appropriate for medical records
4. Maintain confidentiality and HIPAA compliance standards
5. If critical information is missing for a required field, list it in missingFields
6. Generate clarifying questions for any ambiguous or incomplete information

Template: ${templateName}
Required Sections:
${templateStructure.sections
  .map(
    (section) =>
      `- ${section.title}${section.required ? " (REQUIRED)" : ""}: ${section.placeholder || ""}`
  )
  .join("\n")}

Remember: Accuracy and completeness are more important than filling every field. If information is missing, acknowledge it rather than guessing.`;

  const result = await streamObject({
    model: gateway(model),
    schema: extractionSchema,
    system: systemPrompt,
    prompt: `Extract structured note fields from the following session transcription:

${transcription}

Analyze the transcription and populate the template fields with relevant information. For any required fields that cannot be filled, list them in missingFields. If there are ambiguities or missing details, provide clarifying questions.`,
    onFinish: ({ object }) => {
      console.log("Extraction completed:", {
        templateId,
        templateName,
        sections: templateStructure.sections.map((s) => s.title),
        extractedSections: Object.keys(object || {}).filter(
          (k) => k !== "missingFields" && k !== "clarifyingQuestions"
        ),
        missingFieldsCount: object?.missingFields?.length || 0,
        clarifyingQuestionsCount: object?.clarifyingQuestions?.length || 0,
      });
    },
  });

  return result;
}
