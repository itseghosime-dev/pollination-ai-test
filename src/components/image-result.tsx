"use client";

import { Download, RotateCw, AlertCircle, Sparkles, Image as ImageIcon, Check } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { StyleOption } from "./prompt-form";

interface ImageResultProps {
  imageUrl: string | null;
  isLoading: boolean;
  error: string | null;
  prompt: string;
  style: StyleOption;
  onRegenerate: () => void;
}

export function ImageResult({
  imageUrl,
  isLoading,
  error,
  prompt,
  style,
  onRegenerate,
}: ImageResultProps) {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    if (!imageUrl) return;

    try {
      const link = document.createElement("a");
      link.href = imageUrl;
      const cleanName = prompt.slice(0, 30).replace(/[^a-z0-9]/gi, "_").toLowerCase() || "image";
      const ext = imageUrl.startsWith("data:image/jpeg") || imageUrl.startsWith("data:image/jpg") ? "jpg" : "png";
      link.download = `picforge_${cleanName}_${Date.now()}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (e) {
      console.error("Download failed:", e);
    }
  };

  return (
    <section aria-live="polite" className="w-full mt-8">
      {/* ERROR STATE */}
      {error && !isLoading && (
        <div className="rounded-3xl border border-red-200 bg-red-50/60 p-6 text-stone-900 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-red-950">
                We couldn&apos;t generate that image.
              </h3>
              <p className="mt-1 text-sm text-red-700 leading-relaxed">
                {error}
              </p>
              <p className="mt-0.5 text-xs text-red-600/80">
                Please try again or adjust your prompt.
              </p>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={onRegenerate}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {isLoading && (
        <div className="overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-6 shadow-sm sm:p-8">
          <div className="relative aspect-square sm:aspect-16/10 w-full overflow-hidden rounded-2xl border border-stone-100 bg-stone-100/70 flex flex-col items-center justify-center text-center p-6">
            <div className="absolute inset-0 animate-shimmer" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md text-amber-600 mb-4 animate-bounce">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold text-stone-900">
                Creating your image...
              </h3>
              <p className="mt-1 text-sm text-stone-500">
                This may take a moment
              </p>
              <div className="mt-5 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-600 animate-ping" />
                <span className="text-xs font-medium text-stone-400">Rendering prompt details</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EMPTY INITIAL STATE */}
      {!isLoading && !error && !imageUrl && (
        <div className="rounded-3xl border border-dashed border-stone-200 bg-white/60 p-8 text-center sm:p-12 shadow-2xs">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400">
            <ImageIcon className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-stone-900">
            Your creation will appear here
          </h3>
          <p className="mt-1 text-sm text-stone-500">
            Enter a prompt above to generate your first image.
          </p>
        </div>
      )}

      {/* SUCCESS / RESULT STATE */}
      {!isLoading && !error && imageUrl && (
        <div className="overflow-hidden rounded-3xl border border-stone-200/90 bg-white p-4 shadow-sm sm:p-6">
          <div className="relative w-full overflow-hidden rounded-2xl bg-stone-900/5 border border-stone-100 flex items-center justify-center">
            {/* Using next/image unoptimized or regular img to display generated base64 */}
            <Image
              src={imageUrl}
              alt={prompt ? `AI generated image: ${prompt}` : "Generated AI image"}
              width={1024}
              height={1024}
              className="w-full h-auto max-h-[650px] object-contain rounded-2xl"
              unoptimized
              priority
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRegenerate}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 shadow-2xs transition-colors hover:bg-stone-50 hover:text-stone-900 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Regenerate</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-stone-800 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                {downloaded ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-400" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>Download</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-xs text-stone-400">
              Format: High-res (1024x1024)
            </div>
          </div>

          {/* Prompt Summary */}
          <div className="mt-6 rounded-2xl bg-stone-50/80 p-4 border border-stone-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                Prompt
              </span>
              <span className="rounded-full bg-stone-200/70 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                {style}
              </span>
            </div>
            <p className="mt-2 text-sm text-stone-800 leading-relaxed">
              {prompt}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

