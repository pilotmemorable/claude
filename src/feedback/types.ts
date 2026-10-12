// Shared feedback model, used by both the browser widget and the Worker.

export const MAX_MESSAGE_LENGTH = 2000;
export const MIN_RATING = 1;
export const MAX_RATING = 5;

export interface FeedbackInput {
  /** Free-text feedback. Required, trimmed, 1–2000 characters. */
  message: string;
  /** Optional 1–5 star rating. */
  rating?: number;
  /** Optional page or screen the feedback was given on. */
  page?: string;
}

export type ValidationResult =
  | { ok: true; value: FeedbackInput }
  | { ok: false; errors: string[] };

export function validateFeedback(raw: unknown): ValidationResult {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ok: false, errors: ["body must be a JSON object"] };
  }
  const data = raw as Record<string, unknown>;
  const errors: string[] = [];

  const message = typeof data.message === "string" ? data.message.trim() : "";
  if (message.length === 0) {
    errors.push("message is required");
  } else if (message.length > MAX_MESSAGE_LENGTH) {
    errors.push(`message must be at most ${MAX_MESSAGE_LENGTH} characters`);
  }

  let rating: number | undefined;
  if (data.rating !== undefined && data.rating !== null) {
    if (
      typeof data.rating !== "number" ||
      !Number.isInteger(data.rating) ||
      data.rating < MIN_RATING ||
      data.rating > MAX_RATING
    ) {
      errors.push(`rating must be an integer from ${MIN_RATING} to ${MAX_RATING}`);
    } else {
      rating = data.rating;
    }
  }

  let page: string | undefined;
  if (data.page !== undefined && data.page !== null) {
    if (typeof data.page !== "string" || data.page.length > 500) {
      errors.push("page must be a string of at most 500 characters");
    } else {
      page = data.page;
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: { message, rating, page } };
}
