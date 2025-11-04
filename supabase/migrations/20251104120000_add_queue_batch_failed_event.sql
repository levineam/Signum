-- Add 'queue_batch_failed' to telemetry event_type CHECK constraint
-- Story 2.5.1: P1 Fix - Track extraction failures in telemetry

-- Drop the old constraint
ALTER TABLE ontology_analysis_telemetry
DROP CONSTRAINT IF EXISTS ontology_analysis_telemetry_event_type_check;

-- Add the new constraint with 'queue_batch_failed'
ALTER TABLE ontology_analysis_telemetry
ADD CONSTRAINT ontology_analysis_telemetry_event_type_check
CHECK (event_type IN (
  'import_sample_start',
  'import_sample_complete',
  'queue_created',
  'queue_batch_complete',
  'queue_batch_failed',
  'queue_complete',
  'manual_trigger'
));
