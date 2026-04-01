ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS wake_word_enabled boolean DEFAULT false;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS wake_word_threshold float DEFAULT -35;
