-- Marketplace Tables

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

DO $$ BEGIN
    ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE;
    ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS commit_id UUID REFERENCES commits(id);
    ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS publisher_id UUID REFERENCES auth.users(id);
    ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id);
    ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS title TEXT;
    ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS short_description TEXT;
    ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS category TEXT;
    ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS difficulty TEXT;
    ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS estimated_duration TEXT;
    ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS agent_compatibility JSONB;
    ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS install_count INTEGER DEFAULT 0;
    ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS fork_count INTEGER DEFAULT 0;
    ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3,2) DEFAULT 0;
    ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;
    ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
    ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
    ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS featured_at TIMESTAMPTZ;
    ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
    ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE marketplace_listings ALTER COLUMN title SET NOT NULL;
    ALTER TABLE marketplace_listings ALTER COLUMN category SET NOT NULL;
    ALTER TABLE marketplace_listings ADD CONSTRAINT marketplace_listings_difficulty_check CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'));
    ALTER TABLE marketplace_listings ADD CONSTRAINT marketplace_listings_status_check CHECK (status IN ('draft', 'pending_review', 'published', 'featured', 'deprecated'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;


CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

DO $$ BEGIN
    ALTER TABLE marketplace_reviews ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE;
    ALTER TABLE marketplace_reviews ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
    ALTER TABLE marketplace_reviews ADD COLUMN IF NOT EXISTS rating INTEGER;
    ALTER TABLE marketplace_reviews ADD COLUMN IF NOT EXISTS review_text TEXT;
    ALTER TABLE marketplace_reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;
    ALTER TABLE marketplace_reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE marketplace_reviews ADD CONSTRAINT marketplace_reviews_rating_check CHECK (rating BETWEEN 1 AND 5);
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;


CREATE TABLE IF NOT EXISTS marketplace_installs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

DO $$ BEGIN
    ALTER TABLE marketplace_installs ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES marketplace_listings(id) ON DELETE CASCADE;
    ALTER TABLE marketplace_installs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
    ALTER TABLE marketplace_installs ADD COLUMN IF NOT EXISTS forked_repo_id UUID REFERENCES repositories(id);
    ALTER TABLE marketplace_installs ADD COLUMN IF NOT EXISTS installed_at TIMESTAMPTZ DEFAULT now();
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- RLS
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_installs ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  -- Listings
  DROP POLICY IF EXISTS "Public can view published listings" ON marketplace_listings;
  DROP POLICY IF EXISTS "Users can manage their own listings" ON marketplace_listings;
  
  -- Reviews
  DROP POLICY IF EXISTS "Public can view reviews" ON marketplace_reviews;
  DROP POLICY IF EXISTS "Users can write reviews" ON marketplace_reviews;
  
  -- Installs
  DROP POLICY IF EXISTS "Users can view their installs" ON marketplace_installs;
  DROP POLICY IF EXISTS "Users can record installs" ON marketplace_installs;
END $$;

-- Public read access for published listings
CREATE POLICY "Public can view published listings"
  ON marketplace_listings FOR SELECT
  USING (status = 'published' OR status = 'featured');

-- Publisher write access
CREATE POLICY "Users can manage their own listings"
  ON marketplace_listings FOR ALL
  USING (publisher_id = auth.uid());

-- Reviews
CREATE POLICY "Public can view reviews"
  ON marketplace_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can write reviews"
  ON marketplace_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Installs (Record keeping)
CREATE POLICY "Users can view their installs"
  ON marketplace_installs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can record installs"
  ON marketplace_installs FOR INSERT
  WITH CHECK (user_id = auth.uid());
