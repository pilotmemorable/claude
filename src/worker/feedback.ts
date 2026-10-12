import type { FeedbackStore } from "../feedback/store";
import { validateFeedback } from "../feedback/types";

const MAX_BODY_BYTES = 16 * 1024;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

/** Handles POST /api/feedback. */
export async function handleFeedback(request: Request, store: FeedbackStore): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(null, { status: 405, headers: { Allow: "POST" } });
  }
  if (!request.headers.get("Content-Type")?.includes("application/json")) {
    return json(415, { errors: ["Content-Type must be application/json"] });
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    return json(413, { errors: ["body too large"] });
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return json(400, { errors: ["body must be valid JSON"] });
  }

  const result = validateFeedback(raw);
  if (!result.ok) return json(400, { errors: result.errors });

  const saved = await store.save(result.value);
  return json(201, { id: saved.id });
}
