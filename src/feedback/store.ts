import type { FeedbackInput } from "./types";

export interface StoredFeedback extends FeedbackInput {
  id: string;
  createdAt: string;
}

/** Storage behind the feedback endpoint. Swap implementations without touching the handler. */
export interface FeedbackStore {
  save(feedback: FeedbackInput): Promise<StoredFeedback>;
}

function toStored(feedback: FeedbackInput): StoredFeedback {
  return { ...feedback, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
}

/** Cloudflare D1 store. Table is created by migrations/0001_feedback.sql. */
export class D1FeedbackStore implements FeedbackStore {
  constructor(private readonly db: D1Database) {}

  async save(feedback: FeedbackInput): Promise<StoredFeedback> {
    const row = toStored(feedback);
    await this.db
      .prepare(
        "INSERT INTO feedback (id, message, rating, page, created_at) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(row.id, row.message, row.rating ?? null, row.page ?? null, row.createdAt)
      .run();
    return row;
  }
}

/** In-memory store for tests and local experiments. */
export class MemoryFeedbackStore implements FeedbackStore {
  readonly items: StoredFeedback[] = [];

  async save(feedback: FeedbackInput): Promise<StoredFeedback> {
    const row = toStored(feedback);
    this.items.push(row);
    return row;
  }
}
