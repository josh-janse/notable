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
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
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

type Client = {
  id: string;
  full_name: string;
};

type Template = {
  id: string;
  name: string;
  structure: {
    headers?: Array<{ level: number; text: string; locked?: boolean }>;
    prompting_questions?: string[];
    sections: Array<{
      title: string;
      placeholder?: string;
      required?: boolean;
    }>;
  };
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Planned refactor
function NewNotePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [noteId, setNoteId] = useState<string>("");
  const [content, setContent] = useState<Record<string, string>>({});
  const [editableTranscript, setEditableTranscript] = useState("");
  const [sessionDate, setSessionDate] = useState<Date | undefined>(new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const {
    transcript,
    isRecording,
    startRecording,
    stopRecording,
    error: transcriptionError,
  } = useTranscription();

  const { extractFields, isExtracting } = useNoteExtraction({
    noteId,
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
    async function fetchClients() {
      try {
        const response = await fetch("/api/clients");
        if (response.ok) {
          const data = await response.json();
          setClients(data.clients || []);
        }
      } catch (error) {
        console.error("Failed to fetch clients:", error);
      } finally {
        setLoadingClients(false);
      }
    }

    async function fetchTemplates() {
      try {
        const response = await fetch("/api/templates");
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.templates || []);
        }
      } catch (error) {
        console.error("Failed to fetch templates:", error);
      } finally {
        setLoadingTemplates(false);
      }
    }

    fetchClients();
    fetchTemplates();
  }, []);

  // Pre-select client from URL params if provided
  useEffect(() => {
    const clientIdParam = searchParams?.get("clientId");
    if (clientIdParam && !selectedClientId && clients.length > 0) {
      const clientExists = clients.some((c) => c.id === clientIdParam);
      if (clientExists) {
        setSelectedClientId(clientIdParam);
      }
    }
  }, [searchParams, clients, selectedClientId]);

  useEffect(() => {
    const template = templates.find((t) => t.id === selectedTemplateId);
    setSelectedTemplate(template || null);
  }, [selectedTemplateId, templates]);

  const handleExtractFields = async () => {
    if (!(noteId && (transcript || editableTranscript))) {
      return;
    }

    await extractFields(editableTranscript || transcript, selectedTemplateId);
  };

  const handleSaveNote = async () => {
    if (!noteId) {
      return;
    }

    setIsSaving(true);
    try {
      const markdownContent = Object.entries(content)
        .map(([title, text]) => `## ${title}\n\n${text}\n`)
        .join("\n");

      await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markdown_content: markdownContent,
          raw_transcription: editableTranscript || transcript,
          session_date: sessionDate?.toISOString(),
          status: "completed",
        }),
      });

      router.push(`/clients/${selectedClientId}`);
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    async function createNote() {
      if (!(selectedClientId && selectedTemplateId)) {
        return;
      }

      try {
        const response = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: selectedClientId,
            template_id: selectedTemplateId,
            status: "draft",
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setNoteId(data.note.id);
        }
      } catch (error) {
        console.error("Failed to create note:", error);
      }
    }

    if (selectedClientId && selectedTemplateId && !noteId) {
      createNote();
    }
  }, [selectedClientId, selectedTemplateId, noteId]);
  const hasTranscriptionContent = Boolean(
    editableTranscript?.trim() || transcript?.trim()
  );

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

  const renderReviewTab = () => {
    if (!selectedTemplate) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="font-medium">Select a template to begin</p>
            <p className="mt-2 text-sm">
              Go to Setup tab to choose a client and template
            </p>
          </div>
        </div>
      );
    }

    if (Object.values(content).some(Boolean)) {
      return (
        <TemplateRenderer
          content={content}
          onSectionChange={(title, value) => {
            setContent((prev) => ({ ...prev, [title]: value }));
          }}
          template={selectedTemplate}
        />
      );
    }

    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-lg border-2 border-dashed bg-muted/20 p-6 text-center">
          <p className="text-muted-foreground text-sm">
            Add notes in the Input tab, then click "Generate Note" to Create a
            structured clinical note
          </p>
        </div>
      </div>
    );
  };

  const renderDesktopPreviewContent = () => {
    if (!selectedTemplate) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="font-medium">Select a template to begin</p>
            <p className="mt-2 text-sm">
              Go to Setup tab to choose a client and template
            </p>
          </div>
        </div>
      );
    }

    if (Object.values(content).some(Boolean)) {
      return (
        <TemplateRenderer
          content={content}
          onSectionChange={(title, value) => {
            setContent((prev) => ({ ...prev, [title]: value }));
          }}
          template={selectedTemplate}
        />
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h3 className="mb-2 font-semibold text-lg">Prompting Questions</h3>
          <p className="text-muted-foreground text-sm">
            Use these questions to guide your note-taking
          </p>
        </div>

        {selectedTemplate.structure.prompting_questions &&
        selectedTemplate.structure.prompting_questions.length > 0 ? (
          <ul className="space-y-3">
            {selectedTemplate.structure.prompting_questions.map(
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
            Add notes in the left pane, then click "Generate Note" below to
            create a structured clinical note
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100vh-73px)] flex-col overflow-hidden">
      {/* Desktop: Unified Header (always visible) */}
      <div className="hidden shrink-0 space-y-3 border-b bg-background px-6 py-4 md:block">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          {/* Client Selector */}
          <div className="flex flex-1 items-center gap-2">
            <Select
              disabled={loadingClients || !!noteId}
              onValueChange={setSelectedClientId}
              value={selectedClientId}
            >
              <SelectTrigger className="w-full flex-1">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    <div className="flex items-center gap-2">
                      <Image
                        alt={client.full_name}
                        className="rounded-full"
                        height={20}
                        src={`https://avatar.vercel.sh/${encodeURIComponent(client.full_name)}`}
                        width={20}
                      />
                      {client.full_name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template Selector */}
          <div className="flex flex-1 items-center gap-2">
            <Select
              disabled={
                loadingTemplates ||
                hasTranscriptionContent ||
                Object.values(content).some(Boolean)
              }
              onValueChange={setSelectedTemplateId}
              value={selectedTemplateId}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Picker */}
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
        defaultValue="setup"
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
                <Select
                  disabled={loadingClients || !!noteId}
                  onValueChange={setSelectedClientId}
                  value={selectedClientId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        <div className="flex items-center gap-2">
                          <Image
                            alt={client.full_name}
                            className="rounded-full"
                            height={20}
                            src={`https://avatar.vercel.sh/${encodeURIComponent(client.full_name)}`}
                            width={20}
                          />
                          {client.full_name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Template Selector */}
              <div className="space-y-2">
                <span className="font-medium text-sm">Template</span>
                <Select
                  disabled={
                    loadingTemplates ||
                    hasTranscriptionContent ||
                    Object.values(content).some(Boolean)
                  }
                  onValueChange={setSelectedTemplateId}
                  value={selectedTemplateId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
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

              {/* Prompting Questions (if template selected) */}
              {selectedTemplate && (
                <div className="mt-6 space-y-4">
                  <div>
                    <h3 className="mb-2 font-semibold text-lg">
                      Prompting Questions
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Use these questions to guide your note-taking
                    </p>
                  </div>

                  {selectedTemplate.structure.prompting_questions &&
                  selectedTemplate.structure.prompting_questions.length > 0 ? (
                    <ul className="space-y-3">
                      {selectedTemplate.structure.prompting_questions.map(
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
              )}
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
              placeholder="Type your unstructured notes here, or use the transcription button below to dictate..."
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
                  disabled={!noteId}
                  onClick={startRecording}
                  size="lg"
                  variant="outline"
                >
                  <Mic className="mr-2 hidden h-4 w-4 sm:inline" />
                  <span className="sm:hidden">Record</span>
                  <span className="hidden sm:inline">Start Transcribing</span>
                </Button>
              )}
              <Button
                className="flex-1"
                disabled={
                  !hasTranscriptionContent ||
                  isExtracting ||
                  !noteId ||
                  isRecording
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
                    <span className="sm:hidden">Generate</span>
                    <span className="hidden sm:inline">Generate Note</span>
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
            {renderReviewTab()}
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
                  Save to Client Record
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
              placeholder="Type your unstructured notes here, or use the transcription button below to dictate..."
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
                  disabled={!noteId}
                  onClick={startRecording}
                  size="lg"
                  variant="outline"
                >
                  <Mic className="mr-2 h-4 w-4" />
                  Start Transcribing
                </Button>
              )}
              <Button
                className="flex-1"
                disabled={
                  !hasTranscriptionContent ||
                  isExtracting ||
                  !noteId ||
                  isRecording
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
                    Generate Note
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
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            {renderDesktopPreviewContent()}
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
                  Save to Client Record
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewNotePage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-73px)] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <NewNotePageContent />
    </Suspense>
  );
}
