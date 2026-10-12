import { describe, expect, it } from "vitest";
import { MAX_MESSAGE_LENGTH, validateFeedback } from "../src/feedback/types";

describe("validateFeedback", () => {
  it("accepts a message and trims it", () => {
    expect(validateFeedback({ message: "  Harika tur!  " })).toEqual({
      ok: true,
      value: { message: "Harika tur!", rating: undefined, page: undefined },
    });
  });

  it("accepts a rating and page", () => {
    const r = validateFeedback({ message: "ok", rating: 5, page: "/tours" });
    expect(r).toEqual({ ok: true, value: { message: "ok", rating: 5, page: "/tours" } });
  });

  it.each([null, "text", 42, ["message"]])("rejects non-object body %j", (body) => {
    expect(validateFeedback(body).ok).toBe(false);
  });

  it("rejects missing or blank message", () => {
    expect(validateFeedback({})).toEqual({ ok: false, errors: ["message is required"] });
    expect(validateFeedback({ message: "   " }).ok).toBe(false);
  });

  it("rejects a message over the length limit", () => {
    const r = validateFeedback({ message: "a".repeat(MAX_MESSAGE_LENGTH + 1) });
    expect(r.ok).toBe(false);
  });

  it.each([0, 6, 3.5, "5"])("rejects invalid rating %j", (rating) => {
    expect(validateFeedback({ message: "ok", rating }).ok).toBe(false);
  });
});
