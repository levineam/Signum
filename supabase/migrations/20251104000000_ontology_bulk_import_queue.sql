/**
 * Story 2.5.1: Bulk Import Ontology Analysis - Queue Infrastructure
 *
 * Creates three tables for managing bulk import ontology analysis:
 * 1. ontology_analysis_queue - Main queue tracking per import
 * 2. ontology_analysis_queue_notes - Note-level tracking (join table)
 * 3. ontology_analysis_telemetry - Event tracking for metrics
 */

-- ============================================================================
-- Table 1: ontology_analysis_queue
-- Main queue tracking for bulk import analysis jobs
-- ============================================================================

CREATE TABLE ontology_analysis_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  import_id UUID NOT NULL,  -- Links to import session for tracking
  import_snapshot_timestamp TIMESTAMP NOT NULL,  -- Max updated_at from import batch
  total_notes INT NOT NULL CHECK (total_notes > 0),
  processed_notes INT DEFAULT 0 CHECK (processed_notes >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  error_message TEXT,  -- Only populated if status='failed'
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX idx_queue_user_status ON ontology_analysis_queue(user_id, status);
CREATE INDEX idx_queue_pending ON ontology_analysis_queue(status) WHERE status = 'pending';
CREATE INDEX idx_queue_created_at ON ontology_analysis_queue(created_at);
CREATE INDEX idx_queue_import_id ON ontology_analysis_queue(import_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_ontology_analysis_queue_updated_at
  BEFORE UPDATE ON ontology_analysis_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policy: Users can only view their own queue jobs
ALTER TABLE ontology_analysis_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own queue jobs"
  ON ontology_analysis_queue
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role (background workers) can update queue status
CREATE POLICY "Service role manages queue jobs"
  ON ontology_analysis_queue
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- Table 2: ontology_analysis_queue_notes
-- Explicit note-level tracking for idempotent queue processing
-- Prevents double-processing and handles overlapping imports
-- ============================================================================

CREATE TABLE ontology_analysis_queue_notes (
  queue_id UUID NOT NULL REFERENCES ontology_analysis_queue(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (queue_id, note_id)
);

-- Index for efficient fetching of pending notes
CREATE INDEX idx_queue_notes_pending ON ontology_analysis_queue_notes(queue_id, processed) WHERE NOT processed;

-- RLS Policy: Service role only (background workers)
ALTER TABLE ontology_analysis_queue_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages queue notes"
  ON ontology_analysis_queue_notes
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- Table 3: ontology_analysis_telemetry
-- Event tracking for metrics and analytics (Codex Finding #4)
-- ============================================================================

CREATE TABLE ontology_analysis_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'import_sample_start',
    'import_sample_complete',
    'queue_created',
    'queue_batch_complete',
    'queue_complete',
    'manual_trigger'
  )),
  import_id UUID,  -- Links related events from same import
  queue_id UUID REFERENCES ontology_analysis_queue(id) ON DELETE SET NULL,

  -- Performance metrics
  note_count INT,
  runtime_ms INT,
  token_estimate INT,

  -- Success tracking
  extracted_values INT,
  extracted_beliefs INT,
  extracted_aims INT,

  -- Error tracking
  error_message TEXT,

  -- Flexible field for additional context
  metadata JSONB,

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for analytical queries
CREATE INDEX idx_telemetry_user_event ON ontology_analysis_telemetry(user_id, event_type);
CREATE INDEX idx_telemetry_import ON ontology_analysis_telemetry(import_id);
CREATE INDEX idx_telemetry_queue ON ontology_analysis_telemetry(queue_id);
CREATE INDEX idx_telemetry_created ON ontology_analysis_telemetry(created_at DESC);

-- RLS Policy: Users can view own telemetry, service role can insert
ALTER TABLE ontology_analysis_telemetry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own telemetry"
  ON ontology_analysis_telemetry
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role inserts telemetry"
  ON ontology_analysis_telemetry
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- Helper Functions
-- ============================================================================

/**
 * Get next pending queue job for processing
 * Uses FOR UPDATE to prevent race conditions between workers
 */
CREATE OR REPLACE FUNCTION get_next_queue_job()
RETURNS TABLE (
  queue_id UUID,
  user_id UUID,
  import_id UUID,
  import_snapshot_timestamp TIMESTAMP,
  remaining_notes INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.user_id,
    q.import_id,
    q.import_snapshot_timestamp,
    COUNT(CASE WHEN NOT qn.processed THEN 1 END)::INT
  FROM ontology_analysis_queue q
  LEFT JOIN ontology_analysis_queue_notes qn ON q.id = qn.queue_id
  WHERE q.status = 'pending'
  ORDER BY q.created_at ASC
  LIMIT 1
  FOR UPDATE OF q
  GROUP BY q.id, q.user_id, q.import_id, q.import_snapshot_timestamp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Get unprocessed notes for a queue job
 * Fetches up to batch_size notes at a time
 */
CREATE OR REPLACE FUNCTION get_unprocessed_notes(
  p_queue_id UUID,
  p_batch_size INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  content TEXT,
  note_type TEXT,
  is_pinned BOOLEAN,
  metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
) AS $$
BEGIN
  -- Enforce service role only
  IF current_setting('request.jwt.claim.role', true) IS NULL
     OR current_setting('request.jwt.claim.role', true) <> 'service_role' THEN
    RAISE EXCEPTION 'get_unprocessed_notes is restricted to service_role';
  END IF;

  RETURN QUERY
  SELECT
    n.id,
    n.user_id,
    n.title,
    n.content,
    n.note_type,
    n.is_pinned,
    n.metadata,
    n.created_at,
    n.updated_at
  FROM notes n
  INNER JOIN ontology_analysis_queue_notes qn ON n.id = qn.note_id
  WHERE qn.queue_id = p_queue_id AND NOT qn.processed
  ORDER BY n.created_at ASC
  LIMIT p_batch_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION get_unprocessed_notes(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_unprocessed_notes(UUID, INT) TO service_role;

/**
 * Mark notes as processed in queue
 */
CREATE OR REPLACE FUNCTION mark_notes_processed(
  p_queue_id UUID,
  p_note_ids UUID[]
)
RETURNS void AS $$
BEGIN
  UPDATE ontology_analysis_queue_notes
  SET processed = TRUE
  WHERE queue_id = p_queue_id AND note_id = ANY(p_note_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Update queue job status and progress
 */
CREATE OR REPLACE FUNCTION update_queue_status(
  p_queue_id UUID,
  p_status TEXT,
  p_processed_notes INT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE ontology_analysis_queue
  SET
    status = p_status,
    processed_notes = COALESCE(p_processed_notes, processed_notes),
    error_message = p_error_message,
    updated_at = NOW()
  WHERE id = p_queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Insert telemetry event
 */
CREATE OR REPLACE FUNCTION insert_telemetry(
  p_user_id UUID,
  p_event_type TEXT,
  p_import_id UUID DEFAULT NULL,
  p_queue_id UUID DEFAULT NULL,
  p_note_count INT DEFAULT NULL,
  p_runtime_ms INT DEFAULT NULL,
  p_token_estimate INT DEFAULT NULL,
  p_extracted_values INT DEFAULT NULL,
  p_extracted_beliefs INT DEFAULT NULL,
  p_extracted_aims INT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_telemetry_id UUID;
BEGIN
  INSERT INTO ontology_analysis_telemetry (
    user_id,
    event_type,
    import_id,
    queue_id,
    note_count,
    runtime_ms,
    token_estimate,
    extracted_values,
    extracted_beliefs,
    extracted_aims,
    error_message,
    metadata
  ) VALUES (
    p_user_id,
    p_event_type,
    p_import_id,
    p_queue_id,
    p_note_count,
    p_runtime_ms,
    p_token_estimate,
    p_extracted_values,
    p_extracted_beliefs,
    p_extracted_aims,
    p_error_message,
    p_metadata
  )
  RETURNING id INTO v_telemetry_id;

  RETURN v_telemetry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Cleanup Function (runs via cron)
-- Removes completed queue jobs and telemetry after 7 days
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_ontology_queue()
RETURNS TABLE (
  cleaned_queue_jobs INT,
  cleaned_telemetry_events INT
) AS $$
DECLARE
  v_queue_count INT;
  v_telemetry_count INT;
BEGIN
  -- Delete completed queue jobs older than 7 days
  DELETE FROM ontology_analysis_queue
  WHERE status = 'completed'
    AND created_at < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS v_queue_count = ROW_COUNT;

  -- Delete telemetry events older than 30 days (keep longer for analysis)
  DELETE FROM ontology_analysis_telemetry
  WHERE created_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS v_telemetry_count = ROW_COUNT;

  RETURN QUERY SELECT v_queue_count, v_telemetry_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
