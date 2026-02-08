-- =====================================================
-- TEMPLATES AND TAGS SYSTEM
-- One-time migration to add tags and seed default templates
-- =====================================================

-- =====================================================
-- 1. TAGS SYSTEM
-- =====================================================

-- Tags table for categorizing repositories
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT, -- e.g., 'engineering', 'health', 'business'
  color TEXT DEFAULT 'gray', -- For UI display
  icon TEXT, -- Lucide icon name
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table for repository-tag relationships
CREATE TABLE IF NOT EXISTS repository_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(repository_id, tag_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_repository_tags_repo ON repository_tags(repository_id);
CREATE INDEX IF NOT EXISTS idx_repository_tags_tag ON repository_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category);

-- RLS for tags (publicly readable)
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tags are viewable by everyone" ON tags;
CREATE POLICY "Tags are viewable by everyone"
  ON tags FOR SELECT
  USING (true);

-- RLS for repository_tags
ALTER TABLE repository_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Repository tags viewable if repo is public or owned" ON repository_tags;
CREATE POLICY "Repository tags viewable if repo is public or owned"
  ON repository_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM repositories r
      WHERE r.id = repository_id
      AND (r.is_public = true OR r.owner_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Repository tags manageable by repo owner" ON repository_tags;
CREATE POLICY "Repository tags manageable by repo owner"
  ON repository_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM repositories r
      WHERE r.id = repository_id
      AND r.owner_id = auth.uid()
    )
  );

-- =====================================================
-- 2. INSERT TAGS
-- =====================================================

INSERT INTO tags (name, slug, description, category, color, icon) VALUES
-- Engineering & Tech
('Software Engineering', 'software-engineering', 'Software development processes and best practices', 'engineering', 'blue', 'Code'),
('DevOps', 'devops', 'Deployment, infrastructure, and operations', 'engineering', 'purple', 'Server'),
('Code Review', 'code-review', 'Code review and quality assurance', 'engineering', 'indigo', 'GitPullRequest'),
('Security', 'security', 'Security audits and compliance', 'engineering', 'red', 'Shield'),
('API Development', 'api-development', 'API design and implementation', 'engineering', 'cyan', 'Webhook'),
('Testing', 'testing', 'QA and testing procedures', 'engineering', 'green', 'TestTube'),

-- Product & Business
('Product Management', 'product-management', 'Product development and launches', 'business', 'orange', 'Package'),
('Marketing', 'marketing', 'Marketing campaigns and strategies', 'business', 'pink', 'Megaphone'),
('Sales', 'sales', 'Sales processes and pipelines', 'business', 'emerald', 'TrendingUp'),
('Project Management', 'project-management', 'Project planning and execution', 'business', 'amber', 'FolderKanban'),
('Startup', 'startup', 'Startup operations and growth', 'business', 'violet', 'Rocket'),

-- Health & Medical
('Medical', 'medical', 'Medical procedures and protocols', 'health', 'red', 'Stethoscope'),
('Surgery', 'surgery', 'Surgical checklists and protocols', 'health', 'rose', 'Syringe'),
('Hygiene', 'hygiene', 'Personal and professional hygiene', 'health', 'teal', 'Sparkles'),
('Mental Health', 'mental-health', 'Mental wellness and self-care', 'health', 'sky', 'Brain'),
('Fitness', 'fitness', 'Exercise and workout routines', 'health', 'lime', 'Dumbbell'),
('Nutrition', 'nutrition', 'Diet and meal planning', 'health', 'green', 'Apple'),

-- Lifestyle
('Travel', 'travel', 'Travel planning and packing', 'lifestyle', 'blue', 'Plane'),
('Cooking', 'cooking', 'Recipes and cooking procedures', 'lifestyle', 'orange', 'ChefHat'),
('Restaurant', 'restaurant', 'Restaurant operations and service', 'lifestyle', 'amber', 'UtensilsCrossed'),
('Home', 'home', 'Home maintenance and organization', 'lifestyle', 'stone', 'Home'),
('Events', 'events', 'Event planning and management', 'lifestyle', 'fuchsia', 'Calendar'),

-- Personal Development
('Habits', 'habits', 'Habit building and tracking', 'personal', 'violet', 'Target'),
('Finance', 'finance', 'Personal finance and budgeting', 'personal', 'emerald', 'Wallet'),
('Learning', 'learning', 'Learning and skill development', 'personal', 'blue', 'GraduationCap'),
('Productivity', 'productivity', 'Productivity systems and workflows', 'personal', 'yellow', 'Zap'),

-- AI & Technology
('AI Prompting', 'ai-prompting', 'AI prompt engineering and workflows', 'technology', 'purple', 'Bot'),
('Automation', 'automation', 'Workflow automation', 'technology', 'cyan', 'Cog'),

-- Other
('Onboarding', 'onboarding', 'Employee and user onboarding', 'other', 'green', 'UserPlus'),
('Emergency', 'emergency', 'Emergency procedures', 'other', 'red', 'AlertTriangle'),
('Legal', 'legal', 'Legal compliance and contracts', 'other', 'slate', 'Scale')

ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 3. ALLOW NULL OWNER FOR SYSTEM TEMPLATES
-- =====================================================

-- Modify repositories table to allow NULL owner_id for system templates
ALTER TABLE repositories ALTER COLUMN owner_id DROP NOT NULL;

-- Update RLS policies to handle NULL owner_id (system templates)
-- Drop existing policies (note: original schema has different names)
DROP POLICY IF EXISTS "Public repos are viewable by everyone" ON repositories;
DROP POLICY IF EXISTS "Users can view their own repos" ON repositories;
DROP POLICY IF EXISTS "Users can create their own repos" ON repositories;
DROP POLICY IF EXISTS "Users can update their own repos" ON repositories;
DROP POLICY IF EXISTS "Users can delete their own repos" ON repositories;

-- Create new consolidated policies
DROP POLICY IF EXISTS "Users can view their own repositories and public ones" ON public.repositories;
CREATE POLICY "Users can view their own repositories and public ones"
  ON repositories FOR SELECT
  USING (
    is_public = true
    OR owner_id = auth.uid()
    OR owner_id IS NULL  -- System templates are viewable by all
  );

DROP POLICY IF EXISTS "Users can create their own repos" ON public.repositories;
CREATE POLICY "Users can create their own repos"
  ON repositories FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own repos" ON public.repositories;
CREATE POLICY "Users can update their own repos"
  ON repositories FOR UPDATE
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own repos" ON public.repositories;
CREATE POLICY "Users can delete their own repos"
  ON repositories FOR DELETE
  USING (auth.uid() = owner_id);

-- =====================================================
-- 4. HELPER FUNCTION TO CREATE TEMPLATES
-- =====================================================

CREATE OR REPLACE FUNCTION create_template(
  p_title TEXT,
  p_description TEXT,
  p_content JSONB,
  p_tag_slugs TEXT[]
) RETURNS UUID AS $$
DECLARE
  v_repo_id UUID;
  v_commit_id UUID;
  v_tag_slug TEXT;
BEGIN
  -- Create the repository with NULL owner_id for system templates
  INSERT INTO repositories (id, owner_id, title, description, is_public, created_at, updated_at)
  VALUES (gen_random_uuid(), NULL, p_title, p_description, true, NOW(), NOW())
  RETURNING id INTO v_repo_id;

  -- Create initial commit
  INSERT INTO commits (id, repo_id, content, message, created_at)
  VALUES (gen_random_uuid(), v_repo_id, p_content, 'Initial template', NOW())
  RETURNING id INTO v_commit_id;

  -- Add tags
  FOREACH v_tag_slug IN ARRAY p_tag_slugs
  LOOP
    INSERT INTO repository_tags (repository_id, tag_id)
    SELECT v_repo_id, t.id FROM tags t WHERE t.slug = v_tag_slug
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN v_repo_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. CREATE TEMPLATES
-- =====================================================

-- Template 1: Code Review Checklist
SELECT create_template(
  'Code Review Checklist',
  'Comprehensive checklist for reviewing pull requests and ensuring code quality',
  '{
    "version": "1.0",
    "items": {
      "1": {"id": "1", "text": "Code Quality", "parent": null, "order": 0, "type": "header"},
      "2": {"id": "2", "text": "Code follows project style guidelines", "parent": "1", "order": 0},
      "3": {"id": "3", "text": "No unnecessary code duplication", "parent": "1", "order": 1},
      "4": {"id": "4", "text": "Functions are small and focused (single responsibility)", "parent": "1", "order": 2},
      "5": {"id": "5", "text": "Variable and function names are clear and descriptive", "parent": "1", "order": 3},
      "6": {"id": "6", "text": "No hardcoded values (use constants/config)", "parent": "1", "order": 4},
      "7": {"id": "7", "text": "Functionality", "parent": null, "order": 1, "type": "header"},
      "8": {"id": "8", "text": "Code accomplishes the stated requirements", "parent": "7", "order": 0},
      "9": {"id": "9", "text": "Edge cases are handled", "parent": "7", "order": 1},
      "10": {"id": "10", "text": "Error handling is appropriate", "parent": "7", "order": 2},
      "11": {"id": "11", "text": "No obvious bugs or logic errors", "parent": "7", "order": 3},
      "12": {"id": "12", "text": "Security", "parent": null, "order": 2, "type": "header"},
      "13": {"id": "13", "text": "No sensitive data exposed (API keys, passwords)", "parent": "12", "order": 0},
      "14": {"id": "14", "text": "Input validation is present", "parent": "12", "order": 1},
      "15": {"id": "15", "text": "SQL injection prevention (parameterized queries)", "parent": "12", "order": 2},
      "16": {"id": "16", "text": "XSS prevention measures in place", "parent": "12", "order": 3},
      "17": {"id": "17", "text": "Testing", "parent": null, "order": 3, "type": "header"},
      "18": {"id": "18", "text": "Unit tests cover new functionality", "parent": "17", "order": 0},
      "19": {"id": "19", "text": "Tests are meaningful (not just for coverage)", "parent": "17", "order": 1},
      "20": {"id": "20", "text": "All tests pass", "parent": "17", "order": 2},
      "21": {"id": "21", "text": "Documentation", "parent": null, "order": 4, "type": "header"},
      "22": {"id": "22", "text": "Complex logic has explanatory comments", "parent": "21", "order": 0},
      "23": {"id": "23", "text": "Public APIs are documented", "parent": "21", "order": 1},
      "24": {"id": "24", "text": "README updated if needed", "parent": "21", "order": 2}
    }
  }'::jsonb,
  ARRAY['code-review', 'software-engineering', 'testing']
);

-- Template 2: Production Deployment Checklist
SELECT create_template(
  'Production Deployment Checklist',
  'Step-by-step checklist for safe production deployments',
  '{
    "version": "1.0",
    "items": {
      "1": {"id": "1", "text": "Pre-Deployment", "parent": null, "order": 0, "type": "header"},
      "2": {"id": "2", "text": "All tests passing in CI/CD pipeline", "parent": "1", "order": 0},
      "3": {"id": "3", "text": "Code reviewed and approved", "parent": "1", "order": 1},
      "4": {"id": "4", "text": "Database migrations tested on staging", "parent": "1", "order": 2},
      "5": {"id": "5", "text": "Feature flags configured correctly", "parent": "1", "order": 3},
      "6": {"id": "6", "text": "Rollback plan documented", "parent": "1", "order": 4},
      "7": {"id": "7", "text": "Team notified of deployment window", "parent": "1", "order": 5},
      "8": {"id": "8", "text": "Deployment", "parent": null, "order": 1, "type": "header"},
      "9": {"id": "9", "text": "Create database backup", "parent": "8", "order": 0},
      "10": {"id": "10", "text": "Run database migrations", "parent": "8", "order": 1},
      "11": {"id": "11", "text": "Deploy application code", "parent": "8", "order": 2},
      "12": {"id": "12", "text": "Clear application caches", "parent": "8", "order": 3},
      "13": {"id": "13", "text": "Verify deployment completed successfully", "parent": "8", "order": 4},
      "14": {"id": "14", "text": "Post-Deployment Verification", "parent": null, "order": 2, "type": "header"},
      "15": {"id": "15", "text": "Health checks passing", "parent": "14", "order": 0},
      "16": {"id": "16", "text": "Smoke test critical user flows", "parent": "14", "order": 1},
      "17": {"id": "17", "text": "Check error monitoring (no new errors)", "parent": "14", "order": 2},
      "18": {"id": "18", "text": "Verify metrics and logging working", "parent": "14", "order": 3},
      "19": {"id": "19", "text": "Performance metrics within expected range", "parent": "14", "order": 4},
      "20": {"id": "20", "text": "Communication", "parent": null, "order": 3, "type": "header"},
      "21": {"id": "21", "text": "Update deployment log/changelog", "parent": "20", "order": 0},
      "22": {"id": "22", "text": "Notify team of successful deployment", "parent": "20", "order": 1},
      "23": {"id": "23", "text": "Update status page if applicable", "parent": "20", "order": 2}
    }
  }'::jsonb,
  ARRAY['devops', 'software-engineering', 'security']
);
