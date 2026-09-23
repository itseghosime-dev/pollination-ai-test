"use client";

import { Sparkles, Info } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const [showAboutModal, setShowAboutModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-stone-200/60 bg-[#FAF9F6]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-amber-400 shadow-xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-stone-900">
              PicForge <span className="text-amber-700">AI</span>
            </span>
          </div>

          <nav className="flex items-center gap-4">
            <button
              onClick={() => setShowAboutModal(true)}
              className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 rounded-md px-2.5 py-1"
            >
              About
            </button>
          </nav>
        </div>
      </header>

      {/* About Modal */}
      {showAboutModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="about-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xs"
          onClick={() => setShowAboutModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <h3 id="about-dialog-title" className="text-base font-semibold text-stone-900">
                  About PicForge AI
                </h3>
                <p className="text-xs text-stone-500">AI Text-to-Image Studio</p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-stone-600">
              PicForge AI is a clean, classroom-ready web application that transforms text descriptions into high-fidelity AI imagery using <span className="font-medium text-stone-800">Pollinations.AI</span>.
            </p>

            <div className="mt-4 rounded-xl bg-stone-50 p-3.5 text-xs text-stone-600 space-y-1.5 border border-stone-100">
              <div className="flex justify-between">
                <span className="font-medium text-stone-500">Framework:</span>
                <span className="text-stone-800">Next.js App Router (TypeScript)</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-stone-500">AI Engine:</span>
                <span className="text-stone-800">Pollinations.AI</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-stone-500">Model:</span>
                <span className="text-stone-800">FLUX</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowAboutModal(false)}
                className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

