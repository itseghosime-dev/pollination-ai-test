"use client";

import { Sparkles, Camera, Film, Palette, Box } from "lucide-react";
import React from "react";

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
  setPrompt: (value: string) => void;
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

          <div className="mt-2 flex items-center justify-between text-xs text-stone-400">
            <span className="hidden sm:inline italic">
              Example: A futuristic city in Lagos at sunset, cinematic lighting, flying vehicles and glass skyscrapers
            </span>
            <span
              className={`ml-auto font-mono ${
                isOverLimit ? "text-red-500 font-medium" : "text-stone-400"
              }`}
            >
              {charCount}/{MAX_CHAR_COUNT}
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
                disabled={isLoading}
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
                    disabled={isLoading}
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
              disabled={isPromptEmpty || isLoading || isOverLimit}
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

