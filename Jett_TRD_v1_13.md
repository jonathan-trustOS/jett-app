# Jett TRD v1.13.1 - Launch Ready

## Version History
- v1.13.1: Live Stripe integration + GitHub repo setup
- v1.13: Week 4 - Account Management (User dropdown with logout, password reset, subscription)
- v1.12: Week 3 - Cloud Data Sync for projects and ideas
- v1.11: Added Ralph Loop-inspired autonomous features roadmap
- v1.10: User Management system with Supabase Auth + Stripe payments

## What's New in v1.13.1

### Live Stripe Integration (COMPLETE)
- **Customer Portal** — Now using live URL (not test)
- **GitHub Repo** — Code pushed to `jonathan-trustOS/jett-app`
- **Secret keys redacted** — Safe for version control

### Account Management (COMPLETE)
- **User dropdown** — Separate from Settings, to the right of gear icon
- **Logout** — Signs out and clears session
- **Change Password** — Sends reset email via Supabase
- **Account Info** — Shows email and subscription status
- **Manage Subscription** — Links to Stripe Customer Portal

### Files Added
```
src/components/UserMenu.tsx              # User dropdown component
```

### Files Modified
```
src/App.tsx                              # Added UserMenu to header
```

## User Menu Features

### Component: UserMenu
A dropdown menu triggered by a user avatar icon in the header.

```
┌─────────────────────────────┐
│ 👤 jonathan@example.com     │
│ ─────────────────────────── │
│ Status: Active ✓            │
│ ─────────────────────────── │
│ Change Password             │
│ Manage Subscription →       │
│ ─────────────────────────── │
│ Log Out                     │
└─────────────────────────────┘
```

### Stripe Customer Portal
Users can manage their subscription (update payment, cancel) via Stripe's hosted portal.

**Live Portal URL**: `https://billing.stripe.com/p/login/9B614o1hR6wa1xT74GcIE00`

### Password Reset Flow
1. User clicks "Change Password"
2. App calls `supabase.auth.resetPasswordForEmail()`
3. User receives email with reset link
4. User clicks link, sets new password
5. Session auto-updates

---

## Implementation

### UserMenu Component
```typescript
// src/components/UserMenu.tsx
// Features:
// - Shows user avatar (first letter of email)
// - Dropdown with account info
// - Logout, change password, manage subscription actions
// - Uses existing AuthContext hooks
```

### Header Layout
```
[Logo] [Projects | Ideas | PRD | Build | Review] ... [Sync Status] [Settings ⚙️] [User 👤]
```

---

## Configuration

### Stripe (LIVE)
- **Customer Portal**: `https://billing.stripe.com/p/login/9B614o1hR6wa1xT74GcIE00`
- **Mode**: Live (real payments)

### Stripe (Sandbox - for testing)
- **Portal URL**: `https://billing.stripe.com/p/login/test_9B69AT1Bn1Tp7MQdnPb7y00`
- **Test Card**: `4242 4242 4242 4242`

### Supabase (Unchanged)
- **Project URL**: `https://crmimpveipjwwaqicwxx.supabase.co`
- **Anon Key**: `sb_publishable_Fsa_eJ592Mr10Z4cN0j5rQ_47G-YMA2`

### GitHub Repository
- **URL**: `https://github.com/jonathan-trustOS/jett-app`
- **Visibility**: Private

---

## Complete Feature Status

### ✅ Completed
**Core Features (v1.0-1.7)**
- Electron shell with React renderer
- Split pane layout (chat + preview)
- Screenshot capture from webview
- AI integration (Claude + DeepSeek fallback)
- PRD generation from intake questions
- Task generation & execution
- File parsing & writing
- Vercel deployment
- Code view (FileTree + CodeViewer)
- Terminal panel
- Ideas/Brainstorm view with PRD captures
- Template gallery
- Figma import
- Code review plugin
- Learning system (pattern extraction)

**User Management (v1.8-1.12)**
- ✅ Week 1: Supabase Auth (email/password, email verification)
- ✅ Week 2: Stripe payments ($12.99/month, trial banner)
- ✅ Week 3: Cloud data sync (projects + ideas to Supabase)
- ✅ Week 4: Account management (logout, password reset, subscription portal)

### 🔲 Not Yet Built
**From Original "Not Yet Built" list:**
- Task locking (prevent edits during execution)
- History & rollback UI
- Auto-fix limits (max 3 attempts) — partially done
- Build completion celebration
- Re-deployment flow
- Chat during execution (queuing)
- Empty states polish
- Unsaved changes warning
- Project rename
- Keyboard shortcuts
- Accessibility basics

**From Ralph Loop Features (Phase 2-3):**
- Progress Log (PROGRESS.md)
- Configurable Max Iterations
- Explicit Completion Signals
- AFK/Batch Mode

**Post-MVP Roadmap:**
- Week 9-10: Dogfooding (use Jett daily)
- Week 11-12: Beta prep (Windows build, installer, onboarding, landing page)
- Month 3+: Public beta, team features

---

## Next Steps

### Launch Checklist
1. ✅ Run migration in Supabase (done in Week 3)
2. ✅ Test full flow: Sign up → Verify → Use trial → Subscribe
3. ✅ Live Stripe Customer Portal configured
4. ✅ Code pushed to GitHub
5. ⬜ Test on clean machine (verify Electron build works)
6. ⬜ Test Windows build (if targeting Windows users)

---

## Changelog

### v1.13.1 (January 15, 2026)
- Updated: Stripe Customer Portal to live URL
- Added: GitHub repo at `jonathan-trustOS/jett-app`
- Fixed: Redacted secret keys from documentation
- Ready: Launch ready

### v1.13 (January 15, 2026)
- Added: UserMenu dropdown component
- Added: Logout functionality
- Added: Change Password (sends reset email)
- Added: Subscription status display
- Added: Manage Subscription link (Stripe Customer Portal)
- Updated: Feature status (marked Weeks 1-4 complete)

### v1.12 (January 14, 2026)
- Added: Cloud data sync for projects and ideas
- Added: Local-first architecture with background sync
- Added: RLS policies for data isolation

### v1.11 (January 14, 2026)
- Added: Ralph Loop-inspired autonomous features roadmap

### v1.10 (January 13, 2026)
- Added: Supabase Auth integration
- Added: Stripe payment integration
- Added: Trial system with 14-day free trial

---

*The AI must see everything. That's how it learns to build.*
