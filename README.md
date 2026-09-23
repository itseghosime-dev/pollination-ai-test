# PicForge AI — Turn Words into Images

**PicForge AI** is a polished, lightweight AI text-to-image web application built with Next.js, React, TypeScript, Tailwind CSS, Pollinations.AI, and the native browser Web Speech API.

Users enter a natural-language description using text or native speech-to-text, listen to prompts read aloud via speech synthesis, choose an artistic style, and generate high-fidelity AI images powered by Pollinations.AI.

---

## Features

- **Prompt Studio**: Rich input interface with live character counting, keyboard shortcuts (`Ctrl+Enter` / `Cmd+Enter`), and sample prompts.
- **Native Speech-to-Text Input**: Speak your prompt directly into the application using the browser's native `SpeechRecognition` / `webkitSpeechRecognition` API (zero external API calls or quota consumption).
- **Native Text-to-Speech Read Aloud**: Listen to your prompt read aloud with browser `SpeechSynthesis` and instant Stop controls.
- **Style Customization**: Selectable styles including *Photorealistic*, *Cinematic*, *Illustration*, and *3D Render*.
- **Interactive Output**: Full-resolution image canvas with instant download and one-click regeneration.
- **Server-Side Proxy for Images**: Image generation requests are routed through `/api/generate` to protect client integrity and format base64 image responses.
- **Polished UX**: Warm off-white minimal aesthetic, shimmer skeleton loaders, accessible controls, and inline error handling.

---

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Image Generation Provider**: [Pollinations.AI](https://pollinations.ai/) (`flux` model)
- **Voice Capabilities**: Native Browser Web Speech API (`SpeechRecognition` & `SpeechSynthesis`)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## Installation

Clone or navigate to the project directory and install dependencies:

```bash
npm install
```

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

> **Note**: Pollinations.AI works out-of-the-box without requiring an API key. If you have an authenticated Pollinations API key, you can optionally set `POLLINATIONS_API_KEY=your_key` in `.env.local`.

---

## Architecture & Flows

### 1. Voice Input (Speech-to-Text)
```text
User speaks
  ↓
Browser SpeechRecognition (en-US)
  ↓
Text appended to prompt textarea (preserving existing text)
```

### 2. Read Aloud (Text-to-Speech)
```text
Prompt textarea
  ↓
Browser SpeechSynthesis (SpeechSynthesisUtterance)
  ↓
Audio plays natively in browser
```

### 3. Image Generation
```text
User prompt + Style
  ↓ (POST /api/generate)
Next.js Server API
  ↓ (Requests image from Pollinations with model=flux)
Pollinations.AI
  ↓ (Returns binary image stream converted to base64 data URL)
Browser Result Canvas (Displays image with Download & Regenerate)
```
