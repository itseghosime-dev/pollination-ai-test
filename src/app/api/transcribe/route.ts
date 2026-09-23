import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData().catch(() => null);

    if (!formData) {
      return NextResponse.json(
        { error: "No form data provided." },
        { status: 400 }
      );
    }

    const file = (formData.get("file") || formData.get("audio")) as Blob | null;

    if (!file || !(file instanceof Blob) || file.size === 0) {
      return NextResponse.json(
        { error: "No audio recording received or the recording is empty." },
        { status: 400 }
      );
    }

    // Verify audio MIME type
    const mimeType = file.type || "audio/webm";
    if (!mimeType.startsWith("audio/") && !mimeType.startsWith("video/webm")) {
      return NextResponse.json(
        { error: "Unsupported audio format. Please use a valid audio recording." },
        { status: 400 }
      );
    }

    // Prepare outbound FormData for Pollinations Whisper API
    const outboundFormData = new FormData();
    const fileName = mimeType.includes("webm")
      ? "recording.webm"
      : mimeType.includes("wav")
      ? "recording.wav"
      : mimeType.includes("mp4") || mimeType.includes("m4a")
      ? "recording.m4a"
      : mimeType.includes("ogg")
      ? "recording.ogg"
      : "recording.mp3";

    outboundFormData.append("file", file, fileName);
    outboundFormData.append("model", "openai/whisper-large-v3");

    const headers: Record<string, string> = {};
    const apiKey = process.env.POLLINATIONS_API_KEY;
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const response = await fetch("https://gen.pollinations.ai/v1/audio/transcriptions", {
      method: "POST",
      headers,
      body: outboundFormData,
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(
        `[PicForge Transcribe] Pollinations transcription failed (${response.status}): ${errorText}`
      );
      let userMsg = "We couldn't transcribe that recording. Please try again.";
      if (response.status === 401) {
        userMsg = "Pollinations API key is missing or unauthorized. Set POLLINATIONS_API_KEY in .env.local.";
      } else if (response.status === 402) {
        userMsg = "Pollinations credit limit reached. Please check your Pollinations balance or API key.";
      }
      return NextResponse.json(
        { error: userMsg },
        { status: response.status >= 500 ? 502 : response.status }
      );
    }

    const data = await response.json().catch(() => null);
    const transcription = data?.text?.trim() || "";

    if (!transcription) {
      return NextResponse.json(
        { error: "No speech could be recognized. Please try speaking clearly." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text: transcription,
    });
  } catch (error: unknown) {
    console.error("[PicForge Transcribe] Unexpected error:", error);
    return NextResponse.json(
      { error: "We couldn't transcribe that recording. Please try again." },
      { status: 500 }
    );
  }
}
