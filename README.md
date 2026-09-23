# PicForge AI — Turn Words into Images

**PicForge AI** is a polished, lightweight AI text-to-image web application built with Next.js, React, TypeScript, Tailwind CSS, and Pollinations.AI.

Users enter a natural-language description using text or voice input, listen to their prompts read aloud, choose an artistic style, and generate high-fidelity AI images powered by Pollinations.AI.

---

## Features

- **Prompt Studio**: Rich input interface with live character counting, keyboard shortcuts (`Ctrl+Enter` / `Cmd+Enter`), and sample prompts.
- **Speech-to-Text Input**: Speak your prompt directly into the application using browser recording powered by the `openai/whisper-large-v3` transcription model.
- **Text-to-Speech Read Aloud**: Listen to your prompt read aloud with natural speech audio powered by `tts-1` (`nova` voice).
- **Style Customization**: Selectable styles including *Photorealistic*, *Cinematic*, *Illustration*, and *3D Render*.
- **Interactive Output**: Full-resolution image canvas with instant download and one-click regeneration.
- **Server-Side Security**: All AI generation, transcription, and speech requests are proxied server-side via Next.js API routes (`/api/generate`, `/api/transcribe`, `/api/speech`).
- **Polished UX**: Warm off-white minimal aesthetic, shimmer skeleton loaders, accessible controls, and inline error handling.

---

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI Provider**: [Pollinations.AI](https://pollinations.ai/)
  - **Image Generation Model**: `flux`
  - **Speech Transcription Model**: `openai/whisper-large-v3`
  - **Text-to-Speech Model**: `tts-1` (`nova` voice)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## Installation

Clone or navigate to the project directory and install dependencies:

```bash
npm install
```

---

## Environment Variables

Pollinations.AI provides access without requiring an API key. For authenticated access or higher tier rates, configure `POLLINATIONS_API_KEY` in `.env.local`:

```bash
cp .env.example .env.local
```

Inside `.env.local`:

```env
POLLINATIONS_API_KEY=your_pollinations_api_key_here
```

> **Security Note**: `POLLINATIONS_API_KEY` is strictly accessed server-side and never exposed to the client browser.

---

## Running the Application

Start the local development server:

```bash
npm run dev
```

Open your browser and navigate to:

```text
http://localhost:3000
```

---

## How It Works

### 1. Speech-to-Text Input Flow
```text
Voice Recording (Browser MediaRecorder)
  ↓ (POST multipart/form-data audio to /api/transcribe)
Next.js Server API
  ↓ (Forwards audio to Pollinations Whisper API: openai/whisper-large-v3)
Transcribed Text
  ↓ (Appends naturally to prompt textarea)
Prompt Studio
```

### 2. Text-to-Speech Read Aloud Flow
```text
Prompt Text
  ↓ (POST { text: "..." } to /api/speech)
Next.js Server API
  ↓ (Requests TTS from Pollinations: tts-1 with nova voice)
Audio Stream (audio/mpeg)
  ↓ (Browser Audio API playback with Stop control)
Audio Playback
```

### 3. Image Generation Flow
```text
Prompt & Selected Style
  ↓ (POST { prompt: "...", style: "..." } to /api/generate)
Next.js Server API
  ↓ (Appends style modifier & requests FLUX image with random seed)
Pollinations.AI (flux model)
  ↓ (Returns binary image stream converted to base64 data URL)
Browser Result View (Renders image, supports Download & Regenerate)
```
