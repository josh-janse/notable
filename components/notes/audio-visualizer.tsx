"use client";

import { useCallback, useEffect, useRef } from "react";

type AudioVisualizerProps = {
  mediaStream: MediaStream | null;
  isActive: boolean;
};

export function AudioVisualizer({
  mediaStream,
  isActive,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;

    if (!(canvas && analyser)) {
      return;
    }

    // Set canvas size
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    context.clearRect(0, 0, width, height);

    // Draw bars
    const barWidth = 8;
    const gap = 4;
    const totalBarWidth = barWidth + gap;
    const barCount = Math.floor(width / totalBarWidth);
    const centerY = height / 2;

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * dataArray.length);
      const value = dataArray[dataIndex] || 0;
      const barHeight = (value / 255) * (height / 2);

      const x = i * totalBarWidth;
      const y = centerY - barHeight / 2;

      // Color gradient from muted to vibrant based on amplitude
      const intensity = value / 255;
      const hue = 200; // Blue-ish color
      const saturation = 50 + intensity * 50;
      const lightness = 60 - intensity * 20;

      context.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      context.fillRect(x, y, barWidth, barHeight);
    }

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(draw);
  }, []);

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Visualization cleanup logic is complex
  useEffect(() => {
    if (!(mediaStream && isActive)) {
      // Clean up and stop animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
        analyserRef.current = null;
      }

      // Clear canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const context = canvas.getContext("2d");
        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);
        }
      }

      return;
    }

    // Set up audio analysis
    const audioContext = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    )();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    const source = audioContext.createMediaStreamSource(mediaStream);
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    // Start visualization
    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaStream, isActive, draw]); // draw is stable, context/analyser refs are stable

  return (
    <div className="relative h-24 w-full rounded-lg bg-muted/30">
      <canvas
        aria-label="Audio visualizer"
        className="h-full w-full"
        ref={canvasRef}
      />
    </div>
  );
}
