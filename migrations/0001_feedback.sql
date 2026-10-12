-- Feedback submitted through the feedback button (stage 3).
CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL,
  rating INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  page TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback (created_at);
