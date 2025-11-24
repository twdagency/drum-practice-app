-- Drum Practice App Database Schema
-- PostgreSQL database schema for patterns, collections, and progress

-- Patterns table
CREATE TABLE IF NOT EXISTS patterns (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  time_signature VARCHAR(10) NOT NULL,
  subdivision INTEGER NOT NULL,
  phrase TEXT NOT NULL,
  drum_pattern TEXT NOT NULL,
  sticking_pattern TEXT,
  left_foot BOOLEAN DEFAULT FALSE,
  right_foot BOOLEAN DEFAULT FALSE,
  repeat_count INTEGER DEFAULT 1,
  advanced_mode BOOLEAN DEFAULT FALSE,
  per_beat_subdivisions INTEGER[],
  per_beat_voicing TEXT[],
  per_beat_sticking TEXT[],
  polyrhythm_right_notes INTEGER[],
  polyrhythm_left_notes INTEGER[],
  preset_accents INTEGER[],
  pattern_data JSONB, -- Store full pattern object for flexibility
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  pattern_ids BIGINT[] NOT NULL,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Progress table
CREATE TABLE IF NOT EXISTS progress (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  pattern_id BIGINT NOT NULL,
  practice_type VARCHAR(20) NOT NULL CHECK (practice_type IN ('midi', 'microphone', 'recording')),
  accuracy DECIMAL(5,2) DEFAULT 0,
  timing DECIMAL(5,2) DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  best_accuracy DECIMAL(5,2) DEFAULT 0,
  best_timing DECIMAL(5,2) DEFAULT 0,
  last_practiced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_time INTEGER DEFAULT 0, -- seconds
  notes JSONB, -- Array of note-level progress
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, pattern_id, practice_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patterns_user_id ON patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_patterns_created_at ON patterns(created_at);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_pattern_id ON progress(pattern_id);
CREATE INDEX IF NOT EXISTS idx_progress_practice_type ON progress(practice_type);
CREATE INDEX IF NOT EXISTS idx_progress_user_pattern ON progress(user_id, pattern_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_patterns_updated_at BEFORE UPDATE ON patterns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_progress_updated_at BEFORE UPDATE ON progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

