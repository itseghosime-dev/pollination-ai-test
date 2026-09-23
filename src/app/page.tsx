"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { PromptForm, StyleOption } from "@/components/prompt-form";
import { ImageResult } from "@/components/image-result";
import { Footer } from "@/components/footer";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<StyleOption>("Photorealistic");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [generatedStyle, setGeneratedStyle] = useState<StyleOption>("Photorealistic");

  const executeGeneration = async (targetPrompt: string, targetStyle: StyleOption) => {
    const cleanPrompt = targetPrompt.trim();
    if (!cleanPrompt || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: cleanPrompt,
          style: targetStyle,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "An unexpected error occurred while generating your image.");
      }

      setImageUrl(data.imageUrl);
      setGeneratedPrompt(data.prompt || cleanPrompt);
      setGeneratedStyle(data.style || targetStyle);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Network error. Please check your connection and try again.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = () => {
    executeGeneration(prompt, style);
  };

  const handleRegenerate = () => {
    const targetPrompt = generatedPrompt || prompt;
    const targetStyle = generatedStyle || style;
    executeGeneration(targetPrompt, targetStyle);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF9F6] text-[#1C1917]">
      <Navbar />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12">
        <PromptForm
          prompt={prompt}
          setPrompt={setPrompt}
          style={style}
          setStyle={setStyle}
          onGenerate={handleGenerate}
          isLoading={isLoading}
        />

        <ImageResult
          imageUrl={imageUrl}
          isLoading={isLoading}
          error={error}
          prompt={generatedPrompt || prompt}
          style={generatedStyle || style}
          onRegenerate={handleRegenerate}
        />
      </main>

      <Footer />
    </div>
  );
}
