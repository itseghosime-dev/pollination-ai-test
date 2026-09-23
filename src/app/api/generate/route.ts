import { NextRequest, NextResponse } from "next/server";

const STYLE_PROMPTS: Record<string, string> = {
  Photorealistic: "photorealistic, highly detailed, realistic lighting",
  Cinematic: "cinematic composition, dramatic lighting, cinematic color grading",
  Illustration: "digital illustration, detailed artwork, polished illustration",
  "3D Render": "high quality 3D render, realistic materials, detailed lighting",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body.prompt !== "string") {
      return NextResponse.json(
        { error: "Please provide a valid prompt." },
        { status: 400 }
      );
    }

    const trimmedPrompt = body.prompt.trim();
    if (!trimmedPrompt) {
      return NextResponse.json(
        { error: "Prompt cannot be empty." },
        { status: 400 }
      );
    }

    if (trimmedPrompt.length > 500) {
      return NextResponse.json(
        { error: "Prompt exceeds the 500 character limit." },
        { status: 400 }
      );
    }

    const style = typeof body.style === "string" ? body.style : "Photorealistic";
    const styleModifier = STYLE_PROMPTS[style] || STYLE_PROMPTS.Photorealistic;

    const finalPrompt = `${trimmedPrompt}, ${styleModifier}`;
    const encodedPrompt = encodeURIComponent(finalPrompt);
    const seed = Math.floor(Math.random() * 1_000_000);

    // Primary endpoint as specified in requirements
    const primaryUrl = `https://gen.pollinations.ai/image/${encodedPrompt}?model=flux&width=1024&height=1024&seed=${seed}`;
    const fallbackUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&width=1024&height=1024&seed=${seed}&nologo=true`;

    const headers: Record<string, string> = {};
    const apiKey = process.env.POLLINATIONS_API_KEY;
    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    let response = await fetch(primaryUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    // If primary endpoint requires an API key and none was provided, fallback to public endpoint
    if (!response.ok && (response.status === 401 || response.status === 403 || response.status === 429)) {
      console.warn(
        `[PicForge Server] Primary Pollinations endpoint returned ${response.status}. Attempting public image fallback...`
      );
      response = await fetch(fallbackUrl, {
        method: "GET",
        headers,
        cache: "no-store",
      });
    }

    if (!response.ok) {
      console.error(
        `[PicForge Server] Pollinations API responded with status ${response.status}: ${response.statusText}`
      );
      return NextResponse.json(
        { error: "We couldn't generate that image. Please try again or adjust your prompt." },
        { status: response.status >= 500 ? 502 : 400 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      console.error("[PicForge Server] Pollinations returned an empty image buffer.");
      return NextResponse.json(
        { error: "We couldn't generate that image. Please try again or adjust your prompt." },
        { status: 502 }
      );
    }

    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({
      success: true,
      imageUrl: dataUrl,
      image: dataUrl,
      prompt: trimmedPrompt,
      style,
    });
  } catch (error: unknown) {
    console.error("[PicForge Server] Generation Error:", error);

    return NextResponse.json(
      { error: "We couldn't generate that image. Please try again or adjust your prompt." },
      { status: 500 }
    );
  }
}
