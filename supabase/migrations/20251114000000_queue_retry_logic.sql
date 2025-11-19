/**
 * Story 2.5.1: Bulk Import Ontology Analysis - Retry Tracking
 *
 * Adds retry metadata to ontology_analysis_queue so background workers
 * can safely retry transient failures before marking the queue as failed.
 * Also updates helper functions consumed by the API route.
 */

-- ============================================================================
-- Table Updates
-- ============================================================================

ALTER TABLE ontology_analysis_queue
ADD COLUMN IF NOT EXISTS retry_attempts INT NOT NULL DEFAULT 0;

ALTER TABLE ontology_analysis_queue
ADD COLUMN IF NOT EXISTS max_retries INT NOT NULL DEFAULT 3;

-- Existing rows inherit the defaults automatically; ensure no NULLs remain.
UPDATE ontology_analysis_queue
SET retry_attempts = COALESCE(retry_attempts, 0),
    max_retries = COALESCE(max_retries, 3)
WHERE retry_attempts IS NULL OR max_retries IS NULL;

-- ============================================================================
-- Function Updates
-- ============================================================================

/**
 * Return the next pending queue job along with retry metadata.
 */
CREATE OR REPLACE FUNCTION get_next_queue_job()
RETURNS TABLE (
  queue_id UUID,
  user_id UUID,
  import_id UUID,
  import_snapshot_timestamp TIMESTAMP,
  remaining_notes INT,
  retry_attempts INT,
  max_retries INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.user_id,
    q.import_id,
    q.import_snapshot_timestamp,
    COUNT(CASE WHEN NOT qn.processed THEN 1 END)::INT,
    q.retry_attempts,
    q.max_retries
  FROM ontology_analysis_queue q
  LEFT JOIN ontology_analysis_queue_notes qn ON q.id = qn.queue_id
  WHERE q.status = 'pending'
  ORDER BY q.created_at ASC
  LIMIT 1
  FOR UPDATE OF q
  GROUP BY q.id, q.user_id, q.import_id, q.import_snapshot_timestamp,
           q.retry_attempts, q.max_retries;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Update queue job status, progress, and error/retry metadata.
 */
CREATE OR REPLACE FUNCTION update_queue_status(
  p_queue_id UUID,
  p_status TEXT,
  p_processed_notes INT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_retry_attempts INT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE ontology_analysis_queue
  SET
    status = p_status,
    processed_notes = COALESCE(p_processed_notes, processed_notes),
    error_message = p_error_message,
    retry_attempts = COALESCE(p_retry_attempts, retry_attempts),
    updated_at = NOW()
  WHERE id = p_queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
