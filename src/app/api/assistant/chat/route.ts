import { NextResponse } from "next/server";
import { z } from "zod";
import { runAssistantChat, streamAssistantChat } from "@/server/assistant/chat";
import { isAssistantEnabled } from "@/server/assistant/config";
import { resolveAssistantUserContext } from "@/server/assistant/context";
import { checkRateLimit } from "@/server/assistant/rate-limit";

const bodySchema = z.object({
  sessionId: z.string().min(8).max(64),
  stream: z.boolean().optional(),
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

function sseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

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

  const userContext = await resolveAssistantUserContext();
  const chatOptions = {
    sessionKey: body.sessionId,
    userContext,
    persist: true,
  };

  if (body.stream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = streamAssistantChat(body.messages, chatOptions);
          let result = await generator.next();

          while (!result.done) {
            const chunk = result.value;
            if (chunk.type === "meta") {
              controller.enqueue(encoder.encode(sseEvent("meta", chunk.data)));
            } else {
              controller.enqueue(encoder.encode(sseEvent("token", { text: chunk.data })));
            }
            result = await generator.next();
          }

          controller.enqueue(encoder.encode(sseEvent("done", result.value)));
          controller.close();
        } catch (error) {
          console.error("[assistant/chat stream]", error);
          controller.enqueue(
            encoder.encode(
              sseEvent("error", { error: "Failed to generate a response. Please try again." })
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  try {
    const result = await runAssistantChat(body.messages, chatOptions);
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
    features: ["consultation", "rag", "orders", "cart", "handoff", "streaming"],
  });
}
