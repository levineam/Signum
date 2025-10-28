-- Story 1.1: Core NLP Infrastructure & Database Schema
-- Creates tables for term tracking, entities, tasks, reminders, daily metrics, and embeddings
-- Epic: Content Intelligence & Feedback System (Issue #50)

-- ============================================================================
-- Enable PGVector extension for embeddings
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- Create term_frequencies table
-- ============================================================================

CREATE TABLE term_frequencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  term TEXT NOT NULL,
  count_alltime INT NOT NULL DEFAULT 0,
  count_this_week INT NOT NULL DEFAULT 0,
  count_last_week INT NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Unique constraint for upsert operations
  CONSTRAINT unique_user_term UNIQUE(user_id, term)
);

-- Index for efficient term lookups
CREATE INDEX idx_term_freq_user_term ON term_frequencies(user_id, term);

-- Index for top terms queries
CREATE INDEX idx_term_freq_user_alltime ON term_frequencies(user_id, count_alltime DESC);

-- ============================================================================
-- Create entities table
-- ============================================================================

CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
  sentiment_avg FLOAT NOT NULL DEFAULT 0.0,
  centrality INT NOT NULL DEFAULT 0,

  -- Type constraint
  CONSTRAINT check_entity_type CHECK (type IN ('person', 'project', 'value', 'domain', 'note'))
);

-- Index for entity type queries
CREATE INDEX idx_entities_user_type ON entities(user_id, type);

-- Index for centrality queries (top entities)
CREATE INDEX idx_entities_centrality ON entities(user_id, centrality DESC);

-- Add column comment
COMMENT ON COLUMN entities.centrality IS 'Rolling mention count weighted by recency (formula defined in Story 1.3)';

-- ============================================================================
-- Create tasks table
-- ============================================================================

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  due_at TIMESTAMPTZ,
  remind_at TIMESTAMPTZ,
  rrule TEXT,
  est_minutes INT,
  priority INT,
  source_entry_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  source_para_anchor TEXT,
  person_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  project_id UUID REFERENCES entities(id) ON DELETE SET NULL,
  value_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  snooze_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,

  -- Status constraint
  CONSTRAINT check_task_status CHECK (status IN ('pending', 'completed', 'cancelled'))
);

-- Partial index for active tasks (most common query)
CREATE INDEX idx_tasks_user_due ON tasks(user_id, due_at) WHERE status != 'completed';

-- Index for task status queries
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);

-- Add FK comments
COMMENT ON COLUMN tasks.source_entry_id IS 'Foreign key to notes(id) - expects note_type = ''journal-entry''';
COMMENT ON COLUMN tasks.value_id IS 'Foreign key to notes(id) - expects note_type IN (''ontology-value'', ''ontology-belief'', ''ontology-aim'')';

-- ============================================================================
-- Create reminders table
-- ============================================================================

CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL,
  rrule TEXT,
  snooze_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Rule type constraint
  CONSTRAINT check_reminder_rule_type CHECK (rule_type IN ('oneoff', 'rrule'))
);

-- Index for reminder queries by task
CREATE INDEX idx_reminders_task ON reminders(task_id);

-- Index for reminder queries by user
CREATE INDEX idx_reminders_user ON reminders(user_id);

-- Add column comment
COMMENT ON COLUMN reminders.rrule IS 'RFC 5545 recurrence rule (iCalendar format)';

-- ============================================================================
-- Create meters_daily table
-- ============================================================================

CREATE TABLE meters_daily (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  self_score FLOAT,
  others_score FLOAT,
  greater_score FLOAT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Composite primary key (prevents duplicates)
  PRIMARY KEY (user_id, date)
);

-- Index for date range queries
CREATE INDEX idx_meters_daily_user_date ON meters_daily(user_id, date DESC);

-- ============================================================================
-- Create paragraph_embeddings table
-- ============================================================================

CREATE TABLE paragraph_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Unique constraint for cache lookups
  CONSTRAINT unique_user_content_hash UNIQUE(user_id, content_hash)
);

-- IVFFlat index for vector similarity search (cosine distance)
CREATE INDEX idx_paragraph_embeddings_vector
  ON paragraph_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Index for cache lookups by hash
CREATE INDEX idx_paragraph_embeddings_hash ON paragraph_embeddings(user_id, content_hash);

-- ============================================================================
-- Row-Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE term_frequencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE meters_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE paragraph_embeddings ENABLE ROW LEVEL SECURITY;

-- term_frequencies RLS
CREATE POLICY "Users can CRUD their own term frequencies"
  ON term_frequencies
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- entities RLS
CREATE POLICY "Users can CRUD their own entities"
  ON entities
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- tasks RLS
CREATE POLICY "Users can CRUD their own tasks"
  ON tasks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- reminders RLS
CREATE POLICY "Users can CRUD their own reminders"
  ON reminders
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- meters_daily RLS
CREATE POLICY "Users can CRUD their own daily metrics"
  ON meters_daily
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- paragraph_embeddings RLS
CREATE POLICY "Users can CRUD their own embeddings"
  ON paragraph_embeddings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
