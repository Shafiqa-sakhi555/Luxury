import { NextResponse } from "next/server";
import { z } from "zod";
import { runAssistantChat } from "@/server/assistant/chat";
import { isAssistantEnabled } from "@/server/assistant/config";
import { checkRateLimit } from "@/server/assistant/rate-limit";

const bodySchema = z.object({
  sessionId: z.string().min(8).max(64),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      })
    )
    .min(1)
    .max(24),
});

export async function POST(request: Request) {
  if (!isAssistantEnabled()) {
    return NextResponse.json({ error: "Assistant disabled" }, { status: 503 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateKey = `${ip}:${body.sessionId}`;
  const rate = checkRateLimit(rateKey);

  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec ?? 60) } }
    );
  }

  try {
    const result = await runAssistantChat(body.messages);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[assistant/chat]", error);
    return NextResponse.json(
      { error: "Failed to generate a response. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Jalal Assistance",
    enabled: isAssistantEnabled(),
    endpoint: "/api/assistant/chat",
  });
}
