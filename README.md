# PicForge AI — Turn Words into Images

**PicForge AI** is a polished, lightweight AI text-to-image web application built with Next.js, React, TypeScript, Tailwind CSS, and Pollinations.AI.

Users enter a natural-language description, choose an artistic style, and generate high-fidelity AI images powered by the **FLUX** model on Pollinations.AI.

---

## Features

- **Prompt Studio**: Rich input interface with live character counting, keyboard shortcuts (`Ctrl+Enter` / `Cmd+Enter`), and sample prompts.
- **Style Customization**: Selectable styles including *Photorealistic*, *Cinematic*, *Illustration*, and *3D Render*.
- **Interactive Output**: Full-resolution image canvas with instant download and one-click regeneration.
- **Server-Side Proxy**: All requests are routed through a Next.js server API endpoint (`/api/generate`) to protect client integrity and format image responses.
- **Polished UX**: Warm off-white minimal aesthetic, shimmer skeleton loaders, accessible controls, and inline error handling.

---

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Image Generation Provider**: [Pollinations.AI](https://pollinations.ai/)
- **Default Image Model**: `flux`
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

## How Image Generation Works

The generation workflow follows a clean server-proxy architecture:

```text
Browser
  ↓ (POST prompt & style to /api/generate)
Next.js API route
  ↓ (Constructs encoded prompt & requests image with FLUX model)
Pollinations.AI (https://gen.pollinations.ai/image/...)
  ↓ (Returns binary image stream)
Next.js API route (Converts ArrayBuffer to Base64 data URL)
  ↓ (Sends JSON with base64 data URL)
Browser (Renders image, supports Download & Regenerate)
```

1. **Client Submission**: The user enters a descriptive prompt (up to 500 characters) and selects an image style.
2. **Server-Side Proxy**: The frontend sends a `POST` request to `/api/generate` with `{ "prompt": "...", "style": "..." }`.
3. **Prompt Enrichment**: The server validates the prompt and appends photographic/stylistic modifiers matching the selected aesthetic.
4. **Pollinations.AI Request**: The server makes a server-to-server request to `https://gen.pollinations.ai/image/{prompt}?model=flux&width=1024&height=1024&seed={seed}&safe=true`.
5. **Data Transfer**: The binary image data returned from Pollinations is converted into a base64 data URL and returned in JSON format to the client.
6. **Display & Actions**: The frontend renders the generated image with options to download locally or regenerate with a new random seed.
