"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import { z } from "zod";

// Flexible schema that accepts any properties
const extractionSchema = z
  .object({
    missingFields: z.array(z.string()).optional(),
    clarifyingQuestions: z.array(z.string()).optional(),
  })
  .passthrough();

export type ExtractionResult = Record<string, string | string[] | undefined> & {
  missingFields?: string[];
  clarifyingQuestions?: string[];
};

type UseNoteExtractionOptions = {
  noteId: string;
  onSuccess?: (result: ExtractionResult) => void;
  onError?: (error: Error) => void;
};

export function useNoteExtraction({
  noteId,
  onSuccess,
  onError,
}: UseNoteExtractionOptions) {
  const { object, submit, isLoading, error } = useObject({
    api: `/api/notes/${noteId}/extract`,
    schema: extractionSchema,
    onFinish: ({ object: result, error: finishError }) => {
      if (finishError) {
        onError?.(
          finishError instanceof Error
            ? finishError
            : new Error("Extraction failed")
        );
      } else if (result) {
        onSuccess?.(result as unknown as ExtractionResult);
      }
    },
  });

  const extractFields = async (transcription: string, templateId: string) => {
    try {
      await submit({
        transcription,
        templateId,
      });
    } catch (err) {
      const extractionError =
        err instanceof Error ? err : new Error("Failed to extract fields");
      onError?.(extractionError);
    }
  };

  return {
    fields: object,
    extractFields,
    isExtracting: isLoading,
    error,
  };
}
