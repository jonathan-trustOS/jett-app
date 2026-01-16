# Jett TRD v1.12 - Cloud Data Sync

## Version History
- v1.12: Week 3 - Cloud Data Sync for projects and ideas
- v1.11: Added Ralph Loop-inspired autonomous features roadmap
- v1.10: User Management system with Supabase Auth + Stripe payments

## What's New in v1.12

### Cloud Data Sync (Week 3)
- **Projects sync to Supabase** — All project data now syncs to cloud
- **Ideas sync to Supabase** — Brainstorm ideas also sync
- **Local-first architecture** — App works offline, syncs when online
- **Conflict resolution** — Most recently updated version wins
- **RLS enabled** — Users can only access their own data

### Files Added
```
src/lib/sync.ts                      # Sync service (upsert, fetch, delete)
supabase-migration-week3.sql         # Schema updates + RLS policies
```

### Files Modified
```
src/App.tsx                          # Added sync integration
```

## Setup Instructions

### Step 1: Run the Migration
In Supabase SQL Editor, run the contents of `supabase-migration-week3.sql`:

1. Go to Supabase Dashboard → SQL Editor → New Query
2. Copy/paste the entire contents of `supabase-migration-week3.sql`
3. Click "Run"

This will:
- Add missing columns to projects table (mode, modules, tasks, etc.)
- Add status column to ideas table
- Enable RLS on all tables
- Create proper policies for user data isolation

### Step 2: Verify RLS
After running the migration, verify RLS is working:

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Should show 'true' for profiles, user_settings, projects, ideas
```

### Step 3: Test Sync
1. Start Jett: `npm run dev`
2. Sign in with your account
3. Create a project
4. Check Supabase: Dashboard → Table Editor → projects
5. Your project should appear with your user_id

## How Cloud Sync Works

### On App Load
1. Load local projects/ideas first (instant UI)
2. If user is logged in, sync with cloud in background
3. Merge strategy: most recent `updatedAt` wins
4. Upload any local-only items to cloud
5. Update local storage with cloud items

### On Save
1. Save locally first (immediate feedback)
2. Upsert to cloud in background
3. If cloud fails, local data is preserved

### On Delete
1. Delete locally
2. Delete from cloud

### Offline Support
- App works fully offline
- Changes queue locally
- Next login syncs everything

## Database Schema

### projects table
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES profiles(id)
name            TEXT
status          TEXT (draft/building/complete)
mode            TEXT (dev/test/prod)
prd             JSONB
tasks           JSONB
modules         JSONB
priority_stack  JSONB
build_steps     JSONB
suggestions     JSONB
review          JSONB
deploy_url      TEXT
prod_url        TEXT
prod_version    INTEGER
version_history JSONB
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

### ideas table
```sql
id                      UUID PRIMARY KEY
user_id                 UUID REFERENCES profiles(id)
title                   TEXT
description             TEXT
tags                    JSONB
chat                    JSONB
prd_captures            JSONB
status                  TEXT (raw/chatting/ready/promoted)
promoted_to_project_id  UUID REFERENCES projects(id)
created_at              TIMESTAMPTZ
updated_at              TIMESTAMPTZ
```

## RLS Policies

Each table has four policies:
- `select_own` — Can only read own data
- `insert_own` — Can only insert with own user_id
- `update_own` — Can only update own data
- `delete_own` — Can only delete own data

## Configuration (Unchanged from v1.11)

### Supabase
- **Project URL**: `https://crmimpveipjwwaqicwxx.supabase.co`
- **Anon Key**: `sb_publishable_Fsa_eJ592Mr10Z4cN0j5rQ_47G-YMA2`

### Stripe (Sandbox)
- **Payment Link**: `https://buy.stripe.com/test_9B69AT1Bn1Tp7MQdnPb7y00`
- **Product**: TrustOS Monthly - $12.99/month

## Troubleshooting

### "permission denied for table"
RLS is blocking access. Check:
1. User is authenticated (session exists)
2. Policies are created (run migration)
3. user_id matches auth.uid()

### Projects not syncing
Check browser console for errors:
- Network errors → Check Supabase URL
- 401 errors → Session expired, re-login
- RLS errors → Run migration SQL

### Ideas not appearing from cloud
Ideas are synced on load. If missing:
1. Check `ideas` table in Supabase
2. Verify user_id matches your account
3. Try refresh/re-login

## Next Steps (Week 4+)

- [ ] Add manual "Sync Now" button
- [ ] Show last sync timestamp
- [ ] Conflict resolution UI (show diff)
- [ ] Selective sync (choose which projects)
- [ ] Team collaboration (shared projects)

---

## Quick Start

```bash
# 1. Run migration in Supabase SQL Editor (supabase-migration-week3.sql)

# 2. Install and run
cd jett-1.7.2
npm install
npm run dev

# 3. Sign in and create projects - they sync automatically!
```
