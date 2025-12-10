"use client";

import {
  CalendarIcon,
  Loader2,
  Mic,
  MicOff,
  Save,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TemplateRenderer } from "@/components/notes/template-renderer";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useNoteExtraction } from "@/hooks/use-note-extraction";
import { useTranscription } from "@/hooks/use-transcription";
import { cn } from "@/lib/utils";

type Note = {
  id: string;
  markdown_content: string;
  raw_transcription: string;
  status: "draft" | "completed" | "approved";
  session_date: string;
  duration_minutes: number | null;
  follow_up_items: string[] | null;
  client: {
    id: string;
    full_name: string;
  };
  note_template: {
    id: string;
    name: string;
    structure: {
      headers?: { level: number; text: string; locked?: boolean }[];
      prompting_questions?: string[];
      sections: {
        title: string;
        placeholder?: string;
        required?: boolean;
      }[];
    };
  };
};

function parseMarkdownSections(markdown: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = markdown.split("\n");
  let currentSection = "";
  const sectionContent: string[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (currentSection) {
        sections[currentSection] = sectionContent.join("\n").trim();
        sectionContent.length = 0;
      }
      currentSection = line.slice(3).trim();
    } else if (currentSection) {
      sectionContent.push(line);
    }
  }

  if (currentSection) {
    sections[currentSection] = sectionContent.join("\n").trim();
  }

  return sections;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Planned refactor
export default function NoteEditPage() {
  const params = useParams<{ clientId: string; noteId: string }>();
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [content, setContent] = useState<Record<string, string>>({});
  const [editableTranscript, setEditableTranscript] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionDate, setSessionDate] = useState<Date | undefined>();
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // We can treat client and template as "selected" but fixed
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const {
    transcript,
    isRecording,
    startRecording,
    stopRecording,
    error: transcriptionError,
  } = useTranscription();

  const { extractFields, isExtracting } = useNoteExtraction({
    noteId: params?.noteId || "",
    onSuccess: (result) => {
      console.log("Extraction onSuccess called with result:", result);
      const extractedContent: Record<string, string> = {};
      for (const [key, value] of Object.entries(result)) {
        if (key !== "missingFields" && key !== "clarifyingQuestions") {
          extractedContent[key] = typeof value === "string" ? value : "";
        }
      }
      console.log("Setting content to:", extractedContent);
      setContent(extractedContent);
    },
  });

  // Sync transcript to editable version when recording stops
  useEffect(() => {
    if (!isRecording && transcript) {
      setEditableTranscript(transcript);
    }
  }, [isRecording, transcript]);

  useEffect(() => {
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Planned refactor
    async function fetchNote() {
      if (!params?.noteId) {
        return;
      }

      try {
        const response = await fetch(`/api/notes/${params.noteId}`);
        if (response.ok) {
          const data = await response.json();
          setNote(data.note);

          // Set initial metadata
          setSelectedClientId(data.note.client.id);
          setSelectedTemplateId(data.note.note_template.id);
          if (data.note.session_date) {
            setSessionDate(new Date(data.note.session_date));
          }

          if (data.note.markdown_content) {
            const sections = parseMarkdownSections(data.note.markdown_content);
            setContent(sections);
          }

          if (data.note.raw_transcription) {
            setEditableTranscript(data.note.raw_transcription);
          }
        }
      } catch (error) {
        console.error("Failed to fetch note:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNote();
  }, [params?.noteId]);

  const handleExtractFields = async () => {
    if (!(params?.noteId && (transcript || editableTranscript))) {
      return;
    }

    await extractFields(
      editableTranscript || transcript,
      note?.note_template.id || ""
    );
  };

  const handleSaveNote = async () => {
    if (!params?.noteId) {
      return;
    }

    setIsSaving(true);
    try {
      const markdownContent = Object.entries(content)
        .map(([title, text]) => `## ${title}\n\n${text}\n`)
        .join("\n");

      await fetch(`/api/notes/${params.noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markdown_content: markdownContent,
          raw_transcription: editableTranscript || transcript,
          session_date: sessionDate?.toISOString(),
          status: note?.status || "draft",
        }),
      });

      router.push(`/clients/${params.clientId}/notes/${params.noteId}`);
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) {
      return "";
    }
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Note not found</p>
      </div>
    );
  }

  const hasTranscriptionContent = Boolean(
    editableTranscript?.trim() || transcript?.trim()
  );

  return (
    <div className="flex h-[calc(100vh-73px)] flex-col overflow-hidden">
      {/* Desktop: Unified Header (always visible) */}
      <div className="hidden shrink-0 space-y-3 border-b bg-background px-6 py-4 md:block">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          {/* Client Selector (Read-only/Disabled for Edit) */}
          <div className="flex flex-1 items-center gap-2">
            <Select disabled value={selectedClientId}>
              <SelectTrigger className="w-full flex-1">
                <SelectValue placeholder="Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={note.client.id}>
                  <div className="flex items-center gap-2">
                    <Image
                      alt={note.client.full_name}
                      className="rounded-full"
                      height={20}
                      src={`https://avatar.vercel.sh/${encodeURIComponent(note.client.full_name)}`}
                      width={20}
                    />
                    {note.client.full_name}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template Selector (Read-only/Disabled for Edit) */}
          <div className="flex flex-1 items-center gap-2">
            <Select disabled value={selectedTemplateId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={note.note_template.id}>
                  {note.note_template.name}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Picker (Editable) */}
          <div className="flex flex-1 items-center gap-2">
            <Popover onOpenChange={setDatePickerOpen} open={datePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  className="flex-1 justify-start text-left font-normal"
                  variant="outline"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {sessionDate ? formatDate(sessionDate) : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  disabled={(date) => date > new Date()}
                  initialFocus
                  mode="single"
                  onSelect={(date) => {
                    setSessionDate(date);
                    setDatePickerOpen(false);
                  }}
                  selected={sessionDate}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Mobile: Tabs Interface */}
      <Tabs
        className="flex min-h-0 flex-1 flex-col gap-0 md:hidden"
        defaultValue="input"
      >
        <TabsList className="w-full shrink-0 rounded-none">
          <TabsTrigger className="flex-1" value="setup">
            Setup
          </TabsTrigger>
          <TabsTrigger className="flex-1" value="input">
            Input
          </TabsTrigger>
          <TabsTrigger className="flex-1" value="review">
            Review
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Setup */}
        <TabsContent
          className="mt-0 flex min-h-0 flex-1 flex-col"
          value="setup"
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6">
            <div className="space-y-4">
              {/* Client Selector */}
              <div className="space-y-2">
                <span className="font-medium text-sm">Client</span>
                <Select disabled value={selectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={note.client.id}>
                      <div className="flex items-center gap-2">
                        <Image
                          alt={note.client.full_name}
                          className="rounded-full"
                          height={20}
                          src={`https://avatar.vercel.sh/${encodeURIComponent(note.client.full_name)}`}
                          width={20}
                        />
                        {note.client.full_name}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Template Selector */}
              <div className="space-y-2">
                <span className="font-medium text-sm">Template</span>
                <Select disabled value={selectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={note.note_template.id}>
                      {note.note_template.name}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Picker */}
              <div className="space-y-2">
                <span className="font-medium text-sm">Session Date</span>
                <Popover onOpenChange={setDatePickerOpen} open={datePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      className="w-full justify-start text-left font-normal"
                      variant="outline"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {sessionDate ? formatDate(sessionDate) : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto p-0">
                    <Calendar
                      disabled={(date) => date > new Date()}
                      initialFocus
                      mode="single"
                      onSelect={(date) => {
                        setSessionDate(date);
                        setDatePickerOpen(false);
                      }}
                      selected={sessionDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Prompting Questions */}
              <div className="mt-6 space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold text-lg">
                    Prompting Questions
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Use these questions to guide your note-taking
                  </p>
                </div>

                {note.note_template.structure.prompting_questions &&
                note.note_template.structure.prompting_questions.length > 0 ? (
                  <ul className="space-y-3">
                    {note.note_template.structure.prompting_questions.map(
                      (question, index) => (
                        <li
                          className="flex gap-3 rounded-lg border bg-muted/30 p-4"
                          key={`${index}-${question.substring(0, 10)}`}
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-sm">
                            {index + 1}
                          </span>
                          <p className="text-sm">{question}</p>
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm italic">
                    No prompting questions available for this template.
                  </p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Input */}
        <TabsContent
          className="mt-0 flex min-h-0 flex-1 flex-col"
          value="input"
        >
          <div className="relative min-h-0 flex-1 overflow-y-auto">
            <Textarea
              className="min-h-full resize-none border-0 p-6 font-mono text-sm focus-visible:ring-0"
              disabled={isRecording}
              onChange={(e) => setEditableTranscript(e.target.value)}
              placeholder="Edit your notes here, or use the transcription button below to re-record..."
              value={isRecording ? transcript : editableTranscript}
            />
            {isRecording && (
              <div className="absolute top-4 right-4">
                <div className="flex items-center gap-2 rounded-lg border bg-destructive/10 px-3 py-1.5">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
                  <span className="font-medium text-destructive text-xs">
                    Recording
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Buttons - Fixed at bottom */}
          <div className="shrink-0 border-t p-4">
            <div className="flex flex-row gap-2">
              {isRecording ? (
                <Button
                  className="flex-1"
                  onClick={stopRecording}
                  size="lg"
                  variant="destructive"
                >
                  <MicOff className="mr-2 hidden h-4 w-4 sm:inline" />
                  <span className="sm:hidden">Stop</span>
                  <span className="hidden sm:inline">Stop Transcribing</span>
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  onClick={startRecording}
                  size="lg"
                  variant="outline"
                >
                  <Mic className="mr-2 hidden h-4 w-4 sm:inline" />
                  <span className="sm:hidden">Record</span>
                  <span className="hidden sm:inline">Re-record Notes</span>
                </Button>
              )}
              <Button
                className="flex-1"
                disabled={
                  !hasTranscriptionContent || isExtracting || isRecording
                }
                onClick={handleExtractFields}
                size="lg"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="sm:hidden">Gen...</span>
                    <span className="hidden sm:inline">Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 hidden h-4 w-4 sm:inline" />
                    <span className="sm:hidden">Regenerate</span>
                    <span className="hidden sm:inline">Regenerate Note</span>
                  </>
                )}
              </Button>
            </div>
            {transcriptionError && (
              <p className="text-destructive text-sm">
                {transcriptionError.message}
              </p>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Review */}
        <TabsContent
          className="mt-0 flex min-h-0 flex-1 flex-col"
          value="review"
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            {Object.values(content).some(Boolean) ? (
              <TemplateRenderer
                content={content}
                onSectionChange={(title, value) => {
                  setContent((prev) => ({ ...prev, [title]: value }));
                }}
                template={note.note_template}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="rounded-lg border-2 border-dashed bg-muted/20 p-6 text-center">
                  <p className="text-muted-foreground text-sm">
                    Edit notes in the Input tab, then click "Regenerate Note" to
                    update the clinical note
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Save Button - Fixed at bottom */}
          <div className="shrink-0 border-t p-4">
            <Button
              className="w-full"
              disabled={!Object.values(content).some(Boolean) || isSaving}
              onClick={handleSaveNote}
              size="lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Desktop: Side-by-side Layout */}
      <div className={cn("hidden min-h-0 flex-1 flex-row md:flex")}>
        {/* Left Pane - Note Transcription */}
        <div className="flex w-1/2 shrink-0 flex-col border-r">
          {/* Transcription Area - Scrollable */}
          <div className="relative min-h-0 flex-1 overflow-y-auto">
            <Textarea
              className="min-h-full resize-none border-0 p-6 font-mono text-sm focus-visible:ring-0"
              disabled={isRecording}
              onChange={(e) => setEditableTranscript(e.target.value)}
              placeholder="Edit your notes here, or use the transcription button below to re-record..."
              value={isRecording ? transcript : editableTranscript}
            />
            {isRecording && (
              <div className="absolute top-4 right-4">
                <div className="flex items-center gap-2 rounded-lg border bg-destructive/10 px-3 py-1.5">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
                  <span className="font-medium text-destructive text-xs">
                    Recording
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Buttons - Fixed at bottom */}
          <div className="shrink-0 border-t p-4">
            <div className="flex gap-2">
              {isRecording ? (
                <Button
                  className="flex-1"
                  onClick={stopRecording}
                  size="lg"
                  variant="destructive"
                >
                  <MicOff className="mr-2 h-4 w-4" />
                  Stop Transcribing
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  onClick={startRecording}
                  size="lg"
                  variant="outline"
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Re-record Notes
                </Button>
              )}
              <Button
                className="flex-1"
                disabled={
                  !hasTranscriptionContent || isExtracting || isRecording
                }
                onClick={handleExtractFields}
                size="lg"
              >
                {isExtracting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Regenerate Note
                  </>
                )}
              </Button>
            </div>
            {transcriptionError && (
              <p className="text-destructive text-sm">
                {transcriptionError.message}
              </p>
            )}
          </div>
        </div>

        {/* Right Pane - Clinical Note */}
        <div className="flex w-1/2 shrink-0 flex-col">
          {/* Content Area */}
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            {Object.values(content).some(Boolean) ? (
              <TemplateRenderer
                content={content}
                onSectionChange={(title, value) => {
                  setContent((prev) => ({ ...prev, [title]: value }));
                }}
                template={note.note_template}
              />
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-2 font-semibold text-lg">
                    Prompting Questions
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Use these questions to guide your note-taking
                  </p>
                </div>

                {note.note_template.structure.prompting_questions &&
                note.note_template.structure.prompting_questions.length > 0 ? (
                  <ul className="space-y-3">
                    {note.note_template.structure.prompting_questions.map(
                      (question, index) => (
                        <li
                          className="flex gap-3 rounded-lg border bg-muted/30 p-4"
                          key={`${index}-${question.substring(0, 10)}`}
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-sm">
                            {index + 1}
                          </span>
                          <p className="text-sm">{question}</p>
                        </li>
                      )
                    )}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm italic">
                    No prompting questions available for this template.
                  </p>
                )}

                <div className="rounded-lg border-2 border-dashed bg-muted/20 p-6 text-center">
                  <p className="text-muted-foreground text-sm">
                    Edit notes in the left pane, then click "Regenerate Note"
                    below to update the clinical note
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Save Button - Fixed at bottom */}
          <div className="shrink-0 border-t p-4">
            <Button
              className="w-full"
              disabled={!Object.values(content).some(Boolean) || isSaving}
              onClick={handleSaveNote}
              size="lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
