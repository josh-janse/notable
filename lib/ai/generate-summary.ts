import { generateText } from "ai";
import { DEFAULT_GENERATION_MODEL, gateway } from "./client";

type GenerateSummaryOptions = {
  noteContent: string;
  sessionDate?: string;
  clientName?: string;
  templateType?: string;
  maxLength?: number;
  model?: string;
};

export async function generateSummary({
  noteContent,
  sessionDate,
  clientName,
  templateType = "Session",
  maxLength = 200,
  model = DEFAULT_GENERATION_MODEL,
}: GenerateSummaryOptions): Promise<string> {
  const systemPrompt = `You are a clinical notes assistant specialized in creating concise, professional session summaries for healthcare practitioners.

Your task is to generate a brief summary of a session note that captures the key points and outcomes. The summary should be:

1. Concise (approximately ${maxLength} characters)
2. Focused on key clinical observations and outcomes
3. Written in professional, third-person clinical language
4. Suitable for quick reference and notification contexts
5. Free of identifying client information (use generic references)

Format: A single paragraph summarizing the session's main themes, progress, and any critical follow-up items.`;

  const userPrompt = `Generate a concise summary for the following ${templateType} note:

${clientName ? `Client: ${clientName}\n` : ""}${sessionDate ? `Session Date: ${sessionDate}\n` : ""}
Note Content:
${noteContent}

Create a brief professional summary suitable for session follow-up notifications and quick reference.`;

  try {
    const { text } = await generateText({
      model: gateway(model),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3,
    });

    return text.trim();
  } catch (error) {
    console.error("Failed to generate summary:", error);
    throw new Error(
      error instanceof Error ? error.message : "Summary generation failed"
    );
  }
}

type GenerateFollowUpSuggestionsOptions = {
  noteContent: string;
  previousFollowUps?: string[];
  model?: string;
};

export async function generateFollowUpSuggestions({
  noteContent,
  previousFollowUps = [],
  model = DEFAULT_GENERATION_MODEL,
}: GenerateFollowUpSuggestionsOptions): Promise<string[]> {
  const systemPrompt = `You are a clinical notes assistant helping practitioners identify actionable follow-up items from session notes.

Generate 2-4 specific, actionable follow-up items that should be addressed in the next session. Each item should be:

1. Specific and actionable
2. Clinically relevant
3. Brief (one sentence each)
4. Focused on client progress and treatment goals

Format: Return items as a JSON array of strings.`;

  const userPrompt = `Based on the following session note, identify key follow-up items for the next session:

${
  previousFollowUps.length > 0
    ? `Previous Follow-ups (for context):
${previousFollowUps.map((item, i) => `${i + 1}. ${item}`).join("\n")}

`
    : ""
}Note Content:
${noteContent}

Generate 2-4 specific follow-up items for the next session.`;

  try {
    const { text } = await generateText({
      model: gateway(model),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.5,
    });

    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === "string");
    }

    return [];
  } catch (error) {
    console.error("Failed to generate follow-up suggestions:", error);
    return [];
  }
}
