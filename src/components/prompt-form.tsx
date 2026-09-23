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

// Type declarations for browser SpeechRecognition API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

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

  // Browser speech recognition state
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [speechError, setSpeechError] = useState<string | null>(null);

  // Browser speech synthesis (read aloud) state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  // Helper to obtain Web Speech constructor safely
  const getSpeechRecognitionConstructor = (): (new () => ISpeechRecognition) | null => {
    if (typeof window === "undefined") return null;
    const win = window as unknown as {
      SpeechRecognition?: new () => ISpeechRecognition;
      webkitSpeechRecognition?: new () => ISpeechRecognition;
    };
    return win.SpeechRecognition || win.webkitSpeechRecognition || null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
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
  // Native Browser SpeechRecognition (Speech-to-Text)
  // -------------------------------------------------------------
  const handleToggleListening = () => {
    setSpeechError(null);

    // If currently listening, stop manually
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
      setInterimText("");
      return;
    }

    const SpeechRecognitionClass = getSpeechRecognitionConstructor();
    if (!SpeechRecognitionClass) {
      setSpeechError(
        "Voice input isn't supported by this browser. You can still type your prompt."
      );
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
        setInterimText("");
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";
        let currentInterim = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            currentInterim += item[0].transcript;
          }
        }

        if (currentInterim) {
          setInterimText(currentInterim);
        }

        if (finalTranscript) {
          setPrompt((prevText) => {
            const current = typeof prevText === "string" ? prevText.trim() : "";
            const addition = finalTranscript.trim();
            if (!current) return addition;
            return `${current} ${addition}`;
          });
          setInterimText("");
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false);
        setInterimText("");

        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setSpeechError("Microphone access was denied.");
        } else if (event.error === "no-speech") {
          setSpeechError("I couldn't hear anything. Try speaking again.");
        } else if (event.error === "audio-capture") {
          setSpeechError("Microphone capture is unavailable.");
        } else if (event.error !== "aborted") {
          setSpeechError("Voice recognition error. Please try again.");
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText("");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: unknown) {
      console.error("Speech recognition startup error:", err);
      setSpeechError("Unable to start speech recognition. Please try again.");
      setIsListening(false);
      setInterimText("");
    }
  };

  // -------------------------------------------------------------
  // Native Browser SpeechSynthesis (Text-to-Speech)
  // -------------------------------------------------------------
  const handleToggleSpeech = () => {
    setSpeechError(null);

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSpeechError("Text-to-speech is not supported in this browser.");
      return;
    }

    // Stop current reading if playing
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    if (isPromptEmpty) return;

    window.speechSynthesis.cancel(); // Clear any queued utterances

    const utterance = new SpeechSynthesisUtterance(prompt.trim());
    utterance.lang = "en-US";
    utterance.rate = 1.0;

    utterance.onstart = () => {
      setIsPlayingAudio(true);
    };

    utterance.onend = () => {
      setIsPlayingAudio(false);
    };

    utterance.onerror = (e) => {
      setIsPlayingAudio(false);
      if (e.error !== "canceled" && e.error !== "interrupted") {
        setSpeechError("Speech playback error. Please try again.");
      }
    };

    window.speechSynthesis.speak(utterance);
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
            disabled={isLoading}
            rows={4}
            maxLength={MAX_CHAR_COUNT}
            placeholder="Describe the image you want to create..."
            className="w-full resize-none border-0 bg-transparent p-1 text-base text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60 leading-relaxed"
          />

          {/* Prompt Controls Bar: Native SpeechRecognition & SpeechSynthesis */}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3">
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Speech controls">
              {/* Native SpeechRecognition Button */}
              <button
                type="button"
                aria-label={isListening ? "Stop listening" : "Speak your prompt"}
                disabled={isLoading}
                onClick={handleToggleListening}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  isListening
                    ? "bg-red-600 text-white shadow-xs animate-pulse"
                    : "bg-stone-100/90 text-stone-700 hover:bg-stone-200/80 hover:text-stone-900"
                } disabled:opacity-50`}
              >
                {isListening ? (
                  <>
                    <Square className="h-3.5 w-3.5 fill-current" />
                    <span>Listening...</span>
                  </>
                ) : (
                  <>
                    <Mic className="h-3.5 w-3.5 text-stone-600" />
                    <span>Speak prompt</span>
                  </>
                )}
              </button>

              {/* Native SpeechSynthesis Button */}
              <button
                type="button"
                aria-label={isPlayingAudio ? "Stop reading prompt" : "Read prompt aloud"}
                disabled={isPromptEmpty || isLoading || isListening}
                onClick={handleToggleSpeech}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  isPlayingAudio
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-stone-100/90 text-stone-700 hover:bg-stone-200/80 hover:text-stone-900"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {isPlayingAudio ? (
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

          {/* Interim speech recognition live preview */}
          {isListening && interimText && (
            <div className="mt-2 text-xs text-amber-800 italic animate-pulse">
              Listening: {interimText}...
            </div>
          )}

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
                disabled={isLoading || isListening}
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
                    disabled={isLoading || isListening}
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
              disabled={isPromptEmpty || isLoading || isOverLimit || isListening}
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
