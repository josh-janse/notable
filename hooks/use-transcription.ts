"use client";

import {
  createClient,
  type LiveClient,
  LiveTranscriptionEvents,
} from "@deepgram/sdk";
import { useCallback, useEffect, useRef, useState } from "react";

type UseTranscriptionOptions = {
  apiKey?: string;
  model?: string;
  language?: string;
  interimResults?: boolean;
  smartFormat?: boolean;
  punctuate?: boolean;
};

type UseTranscriptionReturn = {
  transcript: string;
  isRecording: boolean;
  isConnected: boolean;
  error: Error | null;
  mediaStream: MediaStream | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  clearTranscript: () => void;
};

export function useTranscription(
  options: UseTranscriptionOptions = {}
): UseTranscriptionReturn {
  const {
    apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || "",
    model = "nova-3",
    language = "en-US",
    interimResults = true,
    smartFormat = true,
    punctuate = true,
  } = options;

  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const connectionRef = useRef<LiveClient | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const clearTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (mediaStreamRef.current) {
      for (const track of mediaStreamRef.current.getTracks()) {
        track.stop();
      }
      mediaStreamRef.current = null;
    }

    if (connectionRef.current) {
      connectionRef.current.finish();
      connectionRef.current = null;
    }

    setIsRecording(false);
    setIsConnected(false);
  }, []);

  const pauseRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.pause();
      setIsRecording(false);
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "paused"
    ) {
      mediaRecorderRef.current.resume();
      setIsRecording(true);
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!apiKey) {
      setError(new Error("Deepgram API key is required"));
      return;
    }

    try {
      setError(null);

      // Get microphone access first
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;

      // Create Deepgram connection
      const deepgram = createClient(apiKey);
      const connection = deepgram.listen.live({
        model,
        language,
        smart_format: smartFormat,
        punctuate,
        interim_results: interimResults,
        utterance_end_ms: 3000,
        filler_words: true,
      });

      connectionRef.current = connection;

      // Set up event listeners BEFORE opening connection
      connection.on(LiveTranscriptionEvents.Open, () => {
        console.log("Deepgram connection opened");
        setIsConnected(true);

        // Set up MediaRecorder event handlers
        mediaRecorder.ondataavailable = (event) => {
          if (
            event.data.size > 0 &&
            connectionRef.current &&
            connectionRef.current.getReadyState() === 1
          ) {
            connectionRef.current.send(event.data);
          }
        };

        mediaRecorder.onstart = () => {
          // Only set recording to true when MediaRecorder actually starts
          setIsRecording(true);
          console.log("MediaRecorder started");
        };

        mediaRecorder.onstop = () => {
          setIsRecording(false);
          console.log("MediaRecorder stopped");
        };

        // Start recording - but don't set isRecording=true until onstart fires
        mediaRecorder.start(250);
      });

      connection.on(LiveTranscriptionEvents.Close, () => {
        console.log("Deepgram connection closed");
        setIsConnected(false);
      });

      connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const { is_final: isFinal, speech_final: speechFinal } = data;
        const newTranscript = data.channel?.alternatives?.[0]?.transcript;

        // Only accumulate final transcripts to avoid duplication
        if (newTranscript?.trim() && isFinal && speechFinal) {
          setTranscript((prev) => {
            const separator = prev && !prev.endsWith(" ") ? " " : "";
            return prev + separator + newTranscript;
          });
        }
      });

      connection.on(LiveTranscriptionEvents.Error, (err) => {
        console.error("Deepgram error:", err);
        setError(new Error(err.message || "Transcription error occurred"));
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      console.error("Failed to start transcription:", errorMessage);
      setError(new Error(errorMessage));
      setIsRecording(false);
      setIsConnected(false);
    }
  }, [apiKey, model, language, smartFormat, punctuate, interimResults]);

  useEffect(
    () => () => {
      stopRecording();
    },
    [stopRecording]
  );

  return {
    transcript,
    isRecording,
    isConnected,
    error,
    mediaStream: mediaStreamRef.current,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    clearTranscript,
  };
}
