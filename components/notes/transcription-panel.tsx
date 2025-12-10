"use client";

import { Mic, MicOff, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranscription } from "@/hooks/use-transcription";

type TranscriptionPanelProps = {
  onFinalTranscript?: (text: string) => void;
};

export function TranscriptionPanel({
  onFinalTranscript,
}: TranscriptionPanelProps) {
  const {
    transcript,
    isRecording,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
  } = useTranscription();

  const handleStopRecording = () => {
    stopRecording();
    if (onFinalTranscript && transcript) {
      onFinalTranscript(transcript);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Live Transcription</h3>
        <div className="flex items-center gap-2">
          {isRecording ? (
            <>
              <Button
                className="gap-2"
                onClick={pauseRecording}
                size="sm"
                variant="outline"
              >
                <MicOff className="h-4 w-4" />
                Pause
              </Button>
              <Button
                className="gap-2"
                onClick={handleStopRecording}
                size="sm"
                variant="destructive"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
            </>
          ) : (
            <Button
              className="gap-2"
              onClick={startRecording}
              size="sm"
              variant="default"
            >
              <Mic className="h-4 w-4" />
              Start Recording
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-destructive text-sm">
          <p className="font-medium">Error: {error.message}</p>
        </div>
      )}

      {isRecording && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-destructive text-sm">
          <div className="h-2 w-2 animate-pulse rounded-full bg-destructive" />
          <span className="font-medium">Recording...</span>
        </div>
      )}

      <div className="max-h-[400px] min-h-[200px] overflow-y-auto rounded-md border border-input bg-background p-4">
        {transcript ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {transcript}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm italic">
            {isRecording
              ? "Listening... Start speaking to see transcription."
              : "Click 'Start Recording' to begin transcription."}
          </p>
        )}
      </div>

      <div className="text-muted-foreground text-xs">
        <p>
          Tip: Speak clearly and at a moderate pace for best results. The
          transcription will appear here in real-time.
        </p>
      </div>
    </div>
  );
}
