-- Festify Database Schema
-- Safe to re-run — drops and recreates everything cleanly

DROP TABLE IF EXISTS festivals CASCADE;
DROP TYPE IF EXISTS premiere_requirement CASCADE;
DROP TYPE IF EXISTS festival_grade CASCADE;
DROP TYPE IF EXISTS festival_status CASCADE;

-- Enums
CREATE TYPE premiere_requirement AS ENUM (
  'world',
  'international',
  'north_american',
  'regional',
  'none'
);

CREATE TYPE festival_grade AS ENUM ('A', 'B', 'C', 'D');

CREATE TYPE festival_status AS ENUM (
  'open',
  'closing_soon',
  'closed',
  'upcoming',
  'previous_edition',
  'unknown'
);

-- Festivals table
CREATE TABLE festivals (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  VARCHAR(255) NOT NULL,
  slug                  VARCHAR(255) NOT NULL UNIQUE,
  country               VARCHAR(100) NOT NULL,
  city                  VARCHAR(100),
  website_url           TEXT,
  submission_url        TEXT,
  premiere_requirement  premiere_requirement NOT NULL DEFAULT 'none',
  oscar_qualifying      BOOLEAN NOT NULL DEFAULT false,
  grade                 festival_grade,
  submission_price_usd  DECIMAL(6,2),
  waiver_available      BOOLEAN NOT NULL DEFAULT false,
  deadline              DATE,
  early_deadline        DATE,
  festival_start_date   DATE,
  festival_end_date     DATE,
  festival_dates_raw    TEXT,
  status                festival_status NOT NULL DEFAULT 'unknown',
  enrichment_confidence TEXT,
  notes                 TEXT,
  last_checked_at       TIMESTAMPTZ,
  is_archived           BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common filter/search operations
CREATE INDEX idx_festivals_country        ON festivals (country);
CREATE INDEX idx_festivals_grade          ON festivals (grade);
CREATE INDEX idx_festivals_status         ON festivals (status);
CREATE INDEX idx_festivals_oscar          ON festivals (oscar_qualifying);
CREATE INDEX idx_festivals_premiere       ON festivals (premiere_requirement);
CREATE INDEX idx_festivals_deadline       ON festivals (deadline);
CREATE INDEX idx_festivals_is_archived    ON festivals (is_archived);
CREATE INDEX idx_festivals_name_search    ON festivals USING gin(to_tsvector('english', name));

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER festivals_updated_at
  BEFORE UPDATE ON festivals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security (read-only for public, full access for authenticated admin)
ALTER TABLE festivals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read" ON festivals
  FOR SELECT TO anon, authenticated
  USING (is_archived = false);

CREATE POLICY "admin_all" ON festivals
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
