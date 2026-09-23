"use client";

import {
  Sparkles,
  Camera,
  Film,
  Palette,
  Box,
  Mic,
  Square,
  Volume2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

export type StyleOption = "Photorealistic" | "Cinematic" | "Illustration" | "3D Render";

interface StyleConfig {
  id: StyleOption;
  label: string;
  icon: React.ElementType;
}

const STYLES: StyleConfig[] = [
  { id: "Photorealistic", label: "Photorealistic", icon: Camera },
  { id: "Cinematic", label: "Cinematic", icon: Film },
  { id: "Illustration", label: "Illustration", icon: Palette },
  { id: "3D Render", label: "3D Render", icon: Box },
];

const EXAMPLE_PROMPTS = [
  "A futuristic city floating above the clouds",
  "A cozy Japanese café during heavy rain",
  "An astronaut walking through a field of sunflowers",
];

const MAX_CHAR_COUNT = 500;

interface PromptFormProps {
  prompt: string;
  setPrompt: (value: string | ((prev: string) => string)) => void;
  style: StyleOption;
  setStyle: (value: StyleOption) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export function PromptForm({
  prompt,
  setPrompt,
  style,
  setStyle,
  onGenerate,
  isLoading,
}: PromptFormProps) {
  const charCount = prompt.length;
  const isPromptEmpty = prompt.trim().length === 0;
  const isOverLimit = charCount > MAX_CHAR_COUNT;

  // Speech-to-text states
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Text-to-speech states
  const [isGeneratingSpeech, setIsGeneratingSpeech] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentObjectUrlRef = useRef<string | null>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (currentObjectUrlRef.current) {
        URL.revokeObjectURL(currentObjectUrlRef.current);
        currentObjectUrlRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPromptEmpty && !isLoading && !isOverLimit) {
      onGenerate();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!isPromptEmpty && !isLoading && !isOverLimit) {
        onGenerate();
      }
    }
  };

  // -------------------------------------------------------------
  // Speech-to-Text handler
  // -------------------------------------------------------------
  const handleToggleRecording = async () => {
    setSpeechError(null);

    // Stop if currently recording
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    // Check browser support
    if (typeof window === "undefined" || !navigator.mediaDevices || !window.MediaRecorder) {
      setSpeechError("Voice input is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Determine supported MIME type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release mic
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });

        if (audioBlob.size === 0) {
          setSpeechError("Recording was empty. Please try speaking again.");
          return;
        }

        setIsTranscribing(true);
        try {
          const formData = new FormData();
          formData.append("file", audioBlob, "recording.webm");

          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          const data = await response.json().catch(() => null);

          if (!response.ok || !data?.text) {
            throw new Error(data?.error || "We couldn't transcribe that recording. Please try again.");
          }

          const transcribedText = data.text.trim();
          if (transcribedText) {
            setPrompt((prevText) => {
              const current = typeof prevText === "string" ? prevText.trim() : "";
              if (!current) return transcribedText;
              return `${current} ${transcribedText}`;
            });
          }
        } catch (err: unknown) {
          const msg =
            err instanceof Error
              ? err.message
              : "We couldn't transcribe that recording. Please try again.";
          setSpeechError(msg);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: unknown) {
      console.error("Microphone access error:", err);
      const errorName = (err as { name?: string })?.name;
      if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError") {
        setSpeechError("Microphone access was denied.");
      } else if (errorName === "NotFoundError" || errorName === "DevicesNotFoundError") {
        setSpeechError("No microphone found on your device.");
      } else {
        setSpeechError("Microphone error. Please try again.");
      }
      setIsRecording(false);
    }
  };

  // -------------------------------------------------------------
  // Text-to-Speech handler
  // -------------------------------------------------------------
  const handleToggleSpeech = async () => {
    setSpeechError(null);

    // If currently playing, stop it
    if (isPlayingAudio && currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      if (currentObjectUrlRef.current) {
        URL.revokeObjectURL(currentObjectUrlRef.current);
        currentObjectUrlRef.current = null;
      }
      setIsPlayingAudio(false);
      return;
    }

    if (isPromptEmpty) return;

    setIsGeneratingSpeech(true);

    try {
      // Stop any existing playback
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (currentObjectUrlRef.current) {
        URL.revokeObjectURL(currentObjectUrlRef.current);
        currentObjectUrlRef.current = null;
      }

      const response = await fetch("/api/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: prompt.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Unable to generate speech audio. Please try again.");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      currentObjectUrlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onended = () => {
        setIsPlayingAudio(false);
        if (currentObjectUrlRef.current) {
          URL.revokeObjectURL(currentObjectUrlRef.current);
          currentObjectUrlRef.current = null;
        }
        currentAudioRef.current = null;
      };

      audio.onerror = () => {
        setIsPlayingAudio(false);
        setSpeechError("Audio playback failed. Please try again.");
        if (currentObjectUrlRef.current) {
          URL.revokeObjectURL(currentObjectUrlRef.current);
          currentObjectUrlRef.current = null;
        }
        currentAudioRef.current = null;
      };

      setIsGeneratingSpeech(false);
      setIsPlayingAudio(true);
      await audio.play();
    } catch (err: unknown) {
      console.error("TTS playback error:", err);
      const msg =
        err instanceof Error ? err.message : "Unable to generate speech audio. Please try again.";
      setSpeechError(msg);
      setIsGeneratingSpeech(false);
      setIsPlayingAudio(false);
    }
  };

  return (
    <section className="w-full">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl md:text-5xl">
          Turn your words into images
        </h1>
        <p className="mt-3 text-base text-stone-600 sm:text-lg">
          Describe anything you can imagine and let AI bring it to life.
        </p>
      </div>

      {/* Input Form Card */}
      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-3xl border border-stone-200/90 bg-white p-4 shadow-sm sm:p-6 transition-all duration-200 focus-within:border-stone-400 focus-within:shadow-md"
      >
        <div className="relative">
          <label htmlFor="image-prompt" className="sr-only">
            Image description prompt
          </label>
          <textarea
            id="image-prompt"
            name="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isTranscribing}
            rows={4}
            maxLength={MAX_CHAR_COUNT}
            placeholder="Describe the image you want to create..."
            className="w-full resize-none border-0 bg-transparent p-1 text-base text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 leading-relaxed"
          />

          {/* Prompt Controls Bar: Speech-to-Text & Text-to-Speech */}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3">
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Speech controls">
              {/* Microphone / Speech-to-Text Button */}
              <button
                type="button"
                aria-label="Speak your prompt"
                disabled={isLoading || isTranscribing}
                onClick={handleToggleRecording}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  isRecording
                    ? "bg-red-600 text-white shadow-xs animate-pulse"
                    : isTranscribing
                    ? "bg-stone-100 text-stone-500 cursor-wait"
                    : "bg-stone-100/90 text-stone-700 hover:bg-stone-200/80 hover:text-stone-900"
                } disabled:opacity-50`}
              >
                {isRecording ? (
                  <>
                    <Square className="h-3.5 w-3.5 fill-current" />
                    <span>Listening...</span>
                  </>
                ) : isTranscribing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                    <span>Transcribing...</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-3.5 w-3.5 text-stone-600" />
                    <span>Speak prompt</span>
                  </>
                )}
              </button>

              {/* Text-to-Speech Button */}
              <button
                type="button"
                aria-label={isPlayingAudio ? "Stop reading prompt" : "Read prompt aloud"}
                disabled={isPromptEmpty || isLoading || isRecording || isTranscribing || isGeneratingSpeech}
                onClick={handleToggleSpeech}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  isPlayingAudio
                    ? "bg-amber-600 text-white shadow-xs"
                    : isGeneratingSpeech
                    ? "bg-stone-100 text-stone-500 cursor-wait"
                    : "bg-stone-100/90 text-stone-700 hover:bg-stone-200/80 hover:text-stone-900"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {isGeneratingSpeech ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
                    <span>Preparing voice...</span>
                  </>
                ) : isPlayingAudio ? (
                  <>
                    <Square className="h-3.5 w-3.5 fill-current" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-3.5 w-3.5 text-stone-600" />
                    <span>Read aloud</span>
                  </>
                )}
              </button>
            </div>

            {/* Character Counter */}
            <span
              className={`font-mono text-xs ${
                isOverLimit ? "text-red-500 font-medium" : "text-stone-400"
              }`}
            >
              {charCount}/{MAX_CHAR_COUNT}
            </span>
          </div>

          {/* Inline Speech Status/Error Banner */}
          {speechError && (
            <div
              role="alert"
              className="mt-3 flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 border border-amber-200/70"
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                <span>{speechError}</span>
              </div>
              <button
                type="button"
                onClick={() => setSpeechError(null)}
                className="ml-2 font-semibold text-amber-800 hover:text-amber-950 cursor-pointer"
              >
                &times;
              </button>
            </div>
          )}

          <div className="mt-2 text-xs text-stone-400">
            <span className="hidden sm:inline italic">
              Example: A futuristic city in Lagos at sunset, cinematic lighting, flying vehicles and glass skyscrapers
            </span>
          </div>
        </div>

        {/* Example prompts */}
        <div className="mt-4 pt-4 border-t border-stone-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-stone-400">Try these:</span>
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example}
                type="button"
                disabled={isLoading || isRecording || isTranscribing}
                onClick={() => setPrompt(example)}
                className="rounded-full bg-stone-100/90 px-3 py-1 text-xs text-stone-600 transition-colors hover:bg-stone-200/80 hover:text-stone-900 disabled:opacity-50 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 text-left"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Style Selection & Generate Button */}
        <div className="mt-5 flex flex-col gap-4 pt-4 border-t border-stone-100 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 text-xs font-medium text-stone-500">Choose a style</div>
            <div
              role="radiogroup"
              aria-label="Image style options"
              className="flex flex-wrap gap-1.5"
            >
              {STYLES.map((s) => {
                const Icon = s.icon;
                const isSelected = style === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={isLoading || isRecording || isTranscribing}
                    onClick={() => setStyle(s.id)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 ${
                      isSelected
                        ? "bg-stone-900 text-white shadow-xs"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900"
                    } disabled:opacity-50`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isSelected ? "text-amber-400" : "text-stone-500"}`} />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="sm:self-end">
            <button
              type="submit"
              disabled={isPromptEmpty || isLoading || isOverLimit || isRecording || isTranscribing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
            >
              <Sparkles
                className={`h-4 w-4 text-amber-400 ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
              <span>{isLoading ? "Generating..." : "Generate image"}</span>
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
