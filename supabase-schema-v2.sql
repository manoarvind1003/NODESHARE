-- ============================================
-- Academic File Management System — Supabase Schema V2 (Idempotent)
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles table (Extended for Auth V2)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'pending_admin' CHECK (role IN ('super_admin', 'admin', 'pending_admin')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'suspended')),
  must_change_password BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  actor_role TEXT,
  action TEXT NOT NULL,
  target_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  target_email TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Resources table
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  semester INT NOT NULL CHECK (semester BETWEEN 1 AND 13),
  category TEXT DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- 5. Videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  subject TEXT NOT NULL,
  semester INT NOT NULL CHECK (semester BETWEEN 1 AND 13),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_resources_semester ON resources(semester);
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_title ON resources USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_id);

-- Helper function to check super admin status without RLS recursion
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'super_admin' AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Row Level Security — Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Service role can manage all profiles" ON profiles;
CREATE POLICY "Service role can manage all profiles"
  ON profiles FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Super admin can read all profiles" ON profiles;
CREATE POLICY "Super admin can read all profiles"
  ON profiles FOR SELECT
  USING (public.is_super_admin(auth.uid()));

-- 8. Row Level Security — Audit Logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admin can read audit logs" ON audit_logs;
CREATE POLICY "Super admin can read audit logs"
  ON audit_logs FOR SELECT
  USING (public.is_super_admin(auth.uid()));
  
DROP POLICY IF EXISTS "Service role can insert audit logs" ON audit_logs;
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- 9. Row Level Security — Resources
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read resources" ON resources;
CREATE POLICY "Anyone authenticated can read resources"
  ON resources FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert resources" ON resources;
CREATE POLICY "Admins can insert resources"
  ON resources FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin') AND status = 'active')
  );

DROP POLICY IF EXISTS "Admins can update resources" ON resources;
CREATE POLICY "Admins can update resources"
  ON resources FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin') AND status = 'active')
  );

DROP POLICY IF EXISTS "Admins can delete resources" ON resources;
CREATE POLICY "Admins can delete resources"
  ON resources FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin') AND status = 'active')
  );

-- 10. Row Level Security — Videos
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read videos" ON videos;
CREATE POLICY "Anyone can read videos"
  ON videos FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can manage videos" ON videos;
CREATE POLICY "Admins can manage videos"
  ON videos FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin') AND status = 'active')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin') AND status = 'active')
  );

-- 11. Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Default to pending_admin, status pending
  INSERT INTO public.profiles (id, email, username, full_name, role, status)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'pending_admin',
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log or ignore error so auth signup doesn't throw 500 Internal Server Error
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. Create storage bucket (run separately if needed)
INSERT INTO storage.buckets (id, name, public)
VALUES ('academic-files', 'academic-files', false)
ON CONFLICT (id) DO NOTHING;

-- 13. Storage policies
DROP POLICY IF EXISTS "Authenticated users can read files" ON storage.objects;
CREATE POLICY "Authenticated users can read files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'academic-files');

DROP POLICY IF EXISTS "Admins can upload files" ON storage.objects;
CREATE POLICY "Admins can upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'academic-files'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin') AND status = 'active')
  );

DROP POLICY IF EXISTS "Admins can delete files" ON storage.objects;
CREATE POLICY "Admins can delete files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'academic-files'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin') AND status = 'active')
  );
