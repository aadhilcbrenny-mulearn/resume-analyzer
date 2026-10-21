CREATE TABLE IF NOT EXISTS analyses (
  id         SERIAL PRIMARY KEY,
  filename   TEXT NOT NULL,
  job_title  TEXT NOT NULL,
  score      INTEGER NOT NULL,
  details    JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
