-- Week 3 Migration: Cloud Data Sync
-- Run this in Supabase SQL Editor

-- ============================================
-- UPDATE PROJECTS TABLE
-- Add missing fields from App.tsx Project interface
-- ============================================

-- Add mode column
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'dev' CHECK (mode IN ('dev', 'test', 'prod'));

-- Add modules (JSONB for complex task structure)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '[]';

-- Add tasks (legacy flat task list)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS tasks JSONB DEFAULT '[]';

-- Add priority_stack (module IDs in order)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS priority_stack JSONB DEFAULT '[]';

-- Add suggestions
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS suggestions JSONB DEFAULT '[]';

-- Add prod deployment fields
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS prod_url TEXT;

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS prod_version INTEGER DEFAULT 0;

ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS version_history JSONB DEFAULT '[]';

-- ============================================
-- UPDATE IDEAS TABLE
-- Add missing status field
-- ============================================

ALTER TABLE public.ideas 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'raw' 
CHECK (status IN ('raw', 'chatting', 'ready', 'promoted'));

-- ============================================
-- FIX RLS POLICIES
-- Drop old policies and create new ones
-- ============================================

-- First, enable RLS (in case it was disabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can manage own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can manage own ideas" ON public.ideas;

-- ============================================
-- PROFILES POLICIES
-- ============================================
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Note: INSERT handled by trigger on auth.users

-- ============================================
-- USER SETTINGS POLICIES
-- ============================================
CREATE POLICY "settings_all_own" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PROJECTS POLICIES
-- ============================================
CREATE POLICY "projects_select_own" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "projects_insert_own" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_update_own" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "projects_delete_own" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- IDEAS POLICIES
-- ============================================
CREATE POLICY "ideas_select_own" ON public.ideas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ideas_insert_own" ON public.ideas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ideas_update_own" ON public.ideas
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ideas_delete_own" ON public.ideas
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- VERIFY
-- ============================================
-- Run these to verify:
-- SELECT * FROM public.projects LIMIT 1;
-- SELECT * FROM public.ideas LIMIT 1;
