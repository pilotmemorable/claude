import { describe, expect, it } from "vitest";
import { MemoryFeedbackStore } from "../src/feedback/store";
import { handleFeedback } from "../src/worker/feedback";

function post(body: unknown, contentType = "application/json"): Request {
  return new Request("https://example.test/api/feedback", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/feedback", () => {
  it("stores valid feedback and returns 201 with an id", async () => {
    const store = new MemoryFeedbackStore();
    const res = await handleFeedback(post({ message: "Çok güzeldi", rating: 4 }), store);

    expect(res.status).toBe(201);
    const body = (await res.json()) as { id: string };
    expect(body.id).toBe(store.items[0].id);
    expect(store.items).toHaveLength(1);
    expect(store.items[0]).toMatchObject({ message: "Çok güzeldi", rating: 4 });
    expect(Date.parse(store.items[0].createdAt)).not.toBeNaN();
  });

  it("returns 400 with errors for invalid feedback and stores nothing", async () => {
    const store = new MemoryFeedbackStore();
    const res = await handleFeedback(post({ message: "", rating: 9 }), store);

    expect(res.status).toBe(400);
    const body = (await res.json()) as { errors: string[] };
    expect(body.errors).toHaveLength(2);
    expect(store.items).toHaveLength(0);
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await handleFeedback(post("{not json"), new MemoryFeedbackStore());
    expect(res.status).toBe(400);
  });

  it("returns 415 for non-JSON content type", async () => {
    const res = await handleFeedback(post("message=hi", "text/plain"), new MemoryFeedbackStore());
    expect(res.status).toBe(415);
  });

  it("returns 413 for an oversized body", async () => {
    const res = await handleFeedback(
      post({ message: "a".repeat(20_000) }),
      new MemoryFeedbackStore(),
    );
    expect(res.status).toBe(413);
  });

  it("returns 405 for non-POST methods", async () => {
    const res = await handleFeedback(
      new Request("https://example.test/api/feedback"),
      new MemoryFeedbackStore(),
    );
    expect(res.status).toBe(405);
    expect(res.headers.get("Allow")).toBe("POST");
  });
});
