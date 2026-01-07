CREATE TABLE exercise_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('values', 'strengths', 'impact', 'purpose')),
  selections JSONB NOT NULL DEFAULT '[]'::jsonb,
  free_text TEXT,
  completed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  version INTEGER DEFAULT 1 NOT NULL,
  generated_items JSONB DEFAULT '[]'::jsonb
);

CREATE INDEX idx_exercise_results_user_id ON exercise_results(user_id);
CREATE INDEX idx_exercise_results_user_type ON exercise_results(user_id, exercise_type, completed_at DESC);

ALTER TABLE exercise_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY exercise_results_select_own ON exercise_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY exercise_results_insert_own ON exercise_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY exercise_results_update_own ON exercise_results FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY exercise_results_delete_own ON exercise_results FOR DELETE USING (auth.uid() = user_id);
