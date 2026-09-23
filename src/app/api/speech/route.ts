import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body.text !== "string" || !body.text.trim()) {
      return NextResponse.json(
        { error: "Please provide valid text to speak." },
        { status: 400 }
      );
    }

    const textToSpeak = body.text.trim();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const apiKey = process.env.POLLINATIONS_API_KEY;
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const payload = {
      model: "tts-1",
      input: textToSpeak,
      voice: "nova",
      response_format: "mp3",
    };

    const response = await fetch("https://gen.pollinations.ai/v1/audio/speech", {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(
        `[PicForge Speech] Pollinations TTS failed (${response.status}): ${errorText}`
      );
      let userMsg = "Unable to generate speech audio. Please try again.";
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

    const audioBuffer = await response.arrayBuffer();
    if (!audioBuffer || audioBuffer.byteLength === 0) {
      console.error("[PicForge Speech] Empty audio buffer received from Pollinations.");
      return NextResponse.json(
        { error: "No audio generated from the prompt." },
        { status: 502 }
      );
    }

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: unknown) {
    console.error("[PicForge Speech] Unexpected error:", error);
    return NextResponse.json(
      { error: "Unable to generate speech audio. Please try again." },
      { status: 500 }
    );
  }
}
