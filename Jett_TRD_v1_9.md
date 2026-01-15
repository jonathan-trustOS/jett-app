# Jett - Technical Requirements Document

**The AI that builds apps for designers.**

**Version:** 1.9.2  
**Date:** January 13, 2026  
**Status:** Isolated Module System Implemented + Timer System Complete

---

# Table of Contents

1. [Vision & Principles](#1-vision--principles)
2. [Target User](#2-target-user)
3. [Core Architecture: Feedback Loops](#3-core-architecture-feedback-loops)
4. [Design System](#4-design-system)
5. [Navigation & Information Architecture](#5-navigation--information-architecture)
6. [PRD System](#6-prd-system)
7. [Brainstorm Mode](#7-brainstorm-mode)
8. [Build System](#8-build-system)
9. [Review System](#9-review-system)
10. [Project Modes: DEV → TEST → PROD](#10-project-modes-dev--test--prod)
11. [Learning System](#11-learning-system)
12. [Plugin Architecture](#12-plugin-architecture)
13. [Project Management](#13-project-management)
14. [Storage & Persistence](#14-storage--persistence)
15. [Known Issues & Limitations](#15-known-issues--limitations)
16. [Current Status](#16-current-status)
17. [Proposed: CI/CD for Built Apps](#17-proposed-cicd-for-built-apps)
18. [Proposed: User Management System](#18-proposed-user-management-system)
19. [Success Metrics](#19-success-metrics)

---

# 1. Vision & Principles

## Vision

Jett enables designers with zero coding experience to build complete web and mobile applications. The AI does the work. The designer provides vision and approval.

**Core Insight:** The biggest problem in AI-assisted development is that AI can't see its own output. Jett solves this through comprehensive feedback loops at every stage of the build process.

## Core Principles

1. **AI must see everything it creates** - Screenshots, code, errors, file structure. No blind spots.
2. **Feedback loops at every step** - Every action has verification. Nothing proceeds unchecked.
3. **Simplicity above all** - Fewer options, better defaults. Designers don't configure.
4. **Working is the only metric** - Does it work? Is the user satisfied? Nothing else matters.
5. **Auto-diagnosis over user debugging** - AI reviews its own work and fixes problems.
6. **Learning compounds** - Every build makes Jett smarter for the next one.
7. **Plugins extend capabilities** - Modular plugins add specialized functionality.
8. **Modular builds scale** - Features become independent modules that can be built, tested, and improved separately.
9. **Ideas before projects** - Capture and research ideas before committing to build.
10. **The dumbest thing that works** - Prefer simple solutions over elegant complexity.

---

# 2. Target User

## Primary User
Designers who want to build software but don't code.

## Characteristics
- Can visualize what they want (Figma, sketches, or words)
- Can recognize when something is right or wrong
- Cannot write code and don't want to learn
- Want to create, not configure

## Not For
- Developers who want AI assistance (use Cursor, Copilot)
- Users who want to understand the code
- Teams collaborating on a single project (v1)

---

# 3. Core Architecture: Feedback Loops

This is the most important section. Every feature exists to close feedback loops.

## Why Feedback Loops Matter

**Traditional AI code generation:**
```
User describes → AI writes code → User hopes it works → Usually broken → Repeat
```

**Jett's approach:**
```
User describes → AI writes code → AI verifies output → AI fixes if broken → AI simplifies → AI learns → User confirms
```

## The Five Feedback Loops

### Loop 1: Visual Verification ✅ IMPLEMENTED
**What AI sees:** Screenshot of the running application  
**When:** After every task completion  
**How:** Electron captures webview, sends to AI with verification prompt  
**AI response:** WORKING (proceed) or BROKEN (diagnose and fix)

### Loop 2: Pattern Learning ✅ IMPLEMENTED
**What AI learns:** Tailwind classes, components, conventions from generated code  
**When:** After every successful task  
**How:** Extract patterns, inject into next task's context  
**AI response:** Maintains consistency across tasks

### Loop 3: Code Review ✅ IMPLEMENTED (v1.9.1)
**What AI sees:** Generated code analyzed for errors, UX issues, and simplification opportunities  
**When:** After task completion, before deploy  
**How:** AI analysis against quality rules  
**AI response:** Three categories - Errors, Improvements, Simplifications

**Categories:**
| Category | Icon | What it checks |
|----------|------|----------------|
| Error | ❌ | Bugs, missing imports, broken code |
| UX | 👁️ | User experience improvements |
| A11y | ✨ | Accessibility issues |
| Performance | ⚙️ | Performance optimizations |
| Simplify | 💡 | Code that could be simpler |

### Loop 4: Code Simplification 🔲 NOT YET IMPLEMENTED
**What AI does:** Simplifies generated code without changing functionality  
**When:** After task verification succeeds  
**How:** AI refactors for clarity, consistency, maintainability  
**AI response:** Cleaner code that's easier to maintain

### Loop 5: Error Verification 🔲 NOT YET IMPLEMENTED
**What AI sees:** Console errors, terminal output, build failures  
**When:** Continuously during development  
**How:** Capture stderr, console.error, build output  
**AI response:** Diagnose error, propose fix, execute fix

---

# 4. Design System

Jett uses a consistent design system for visual coherence and maintainability.

## Color Tokens

All colors are defined as CSS custom properties and adapt to light/dark themes.

### Background Colors
| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `--bg-primary` | `#0f1419` | `#ffffff` | Main background |
| `--bg-secondary` | `#1a2332` | `#f1f5f9` | Cards, panels |
| `--bg-tertiary` | `#243040` | `#e2e8f0` | Nested elements |
| `--bg-elevated` | `#1e2836` | `#ffffff` | Modals, popovers |
| `--bg-hover` | `#2a3545` | `#e2e8f0` | Hover states |
| `--bg-active` | `#354050` | `#cbd5e1` | Active/pressed states |

### Text Colors
| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `--text-primary` | `#f1f5f9` | `#0f172a` | Primary text |
| `--text-secondary` | `#e2e8f0` | `#334155` | Secondary text |
| `--text-tertiary` | `#94a3b8` | `#64748b` | Muted text, labels |

### Border Colors
| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `--border-primary` | `#475569` | `#cbd5e1` | Primary borders |
| `--border-secondary` | `#64748b` | `#94a3b8` | Stronger borders |

### Accent Colors
| Token | Dark Mode | Light Mode | Usage |
|-------|-----------|------------|-------|
| `--accent-primary` | `#a5b4fc` | `#4f46e5` | Primary actions, links |
| `--accent-primary-light` | `#312e81` | `#e0e7ff` | Accent backgrounds |
| `--success` | `#4ade80` | `#059669` | Success states |
| `--warning` | `#fcd34d` | `#d97706` | Warning states |
| `--error` | `#fca5a5` | `#dc2626` | Error states |

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace; /* Code */
```

### Scale
| Class | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-2xl` | 1.5rem | 600 | Page titles |
| `text-xl` | 1.25rem | 600 | Section headers |
| `text-lg` | 1.125rem | 600 | Card titles |
| `text-sm` | 0.875rem | 400-500 | Body text, buttons |
| `text-xs` | 0.75rem | 500 | Labels, badges, metadata |

## Iconography

All icons are inline SVGs using the `Icons.tsx` component library. Icons use `currentColor` for theming.

### Icon Sizes
| Size | Pixels | Usage |
|------|--------|-------|
| 12 | 12px | Inline with small text |
| 14 | 14px | Buttons, list items |
| 16 | 16px | Default icon size |
| 20 | 20px | Section headers |
| 24 | 24px | Navigation, large buttons |

---

# 5. Navigation & Information Architecture

## Main Navigation Flow

```
Ideas → Projects → PRD → Build → Review → Deploy
```

### Tab Structure
| Tab | Icon | Content | When Visible |
|-----|------|---------|--------------|
| Ideas | 💡 | Brainstorm view | Always |
| Projects | 📁 | Project list | Always |
| PRD | 📋 | PRD form/canvas | When project selected |
| Build | 🔨 | Module builder | When project selected |
| Review | <> | Code review | After first build |

### Mode Indicator
Shows current project mode: `DEV` | `TEST` | `PROD`

Displayed after project name in header: `DEV Project Name`

---

# 6. PRD System

## PRD Structure

```typescript
interface PRD {
  overview: {
    name: string
    description: string
    coreGoal: string
    platform: 'web' | 'mobile' | 'desktop'
  }
  targetUsers: {
    primaryUser: string
    userNeeds: string
  }
  features: Feature[]
  screens: Screen[]
  dataModel: {
    needsDatabase: boolean
    entities: Entity[]
  }
  designNotes: string
  competitors: string
}
```

## PRD Views

### Form View (Default)
Traditional form with sections for each PRD component.

### Canvas View
Visual mind-map style view showing PRD as connected cards.

## PRD Import
- Download template (markdown)
- Paste markdown into import modal
- AI parses into structured PRD

---

# 7. Brainstorm Mode

## Overview

Pre-project ideation space. Capture ideas, chat with AI to develop them, promote to projects when ready.

## Idea Lifecycle

```
raw → chatting → ready → promoted
```

## Chat-Driven PRD Assembly (v1.9.0+)

Instead of static research notes, users chat with AI to develop ideas. AI extracts structured data into PRD captures.

### Data Model

```typescript
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  captures?: PRDCapture[]
}

interface PRDCapture {
  id: string
  section: 'overview' | 'features' | 'users' | 'screens' | 'data' | 'design'
  content: string
  timestamp: string
}

interface Idea {
  id: string
  title: string
  description: string
  tags: string[]
  chat: ChatMessage[]
  prdCaptures: {
    overview: PRDCapture[]
    features: PRDCapture[]
    users: PRDCapture[]
    screens: PRDCapture[]
    data: PRDCapture[]
    design: PRDCapture[]
  }
  status: 'raw' | 'chatting' | 'ready' | 'promoted'
  createdAt: string
  updatedAt: string
  projectId?: string
}
```

### PRD Capture Format

AI extracts information using tagged format:
```
[CAPTURE:section:content]
```

Example:
```
[CAPTURE:features:Real-time collaboration between authors and editors]
[CAPTURE:users:Independent authors who self-publish]
[CAPTURE:screens:Dashboard showing all book projects]
```

### Confidence Score

Weighted score based on PRD completeness:

| Section | Weight | Target Items |
|---------|--------|--------------|
| Overview | 15% | 2 |
| Features | 30% | 5 |
| Users | 20% | 2 |
| Screens | 15% | 3 |
| Data Model | 10% | 2 |
| Design | 10% | 2 |

**Deploy Gate:** 60% confidence required to promote to project.

### Bulk Extraction Mode

When user pastes > 500 characters, AI switches to extraction mode:
- Aims for 10-20 captures
- Each feature, screen, data entity = separate capture
- Summarizes what was captured

### UI Layout

```
┌─────────────┬──────────────────────────────────────┬──────────────┐
│ Ideas List  │ Chat Interface                       │ PRD Captures │
│             │ AI asks questions                    │ Overview (2) │
│ Book App    │ User responds naturally              │ Features (4) │
│ Chatting    │ Auto-extracts captures               │ Users (1)    │
│             │                                      │ Screens (0)  │
│             │ [Type thoughts...]          [Send]   │ [View PRD →] │
└─────────────┴──────────────────────────────────────┴──────────────┘
```

---

# 8. Build System

## Current Architecture: Sequential Tasks

```
PRD → Module Breakdown → Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → App
```

### Module Structure

```typescript
interface Module {
  id: string
  name: string
  description: string
  status: 'draft' | 'building' | 'complete' | 'needs-work'
  version: number
  tasks: Task[]
  suggestions: Suggestion[]
  files: string[]
}
```

### Task Execution Flow

1. AI receives task description + existing code context
2. AI generates code with file markers
3. Files extracted and written to project
4. Dev server started/refreshed
5. Screenshot captured
6. AI verifies: WORKING or BROKEN
7. If BROKEN: diagnose and retry (max 3 attempts)
8. If WORKING: proceed to next task

### Known Issue: Context Accumulation

Each task sees all previous code. By Task 5, context is very large. This causes:
- Slower responses
- AI "helping" with things outside current task scope
- Cascading failures when early tasks over-build

---

# 9. Review System

## Three-Part Analysis (v1.9.1)

| Category | Question | Action |
|----------|----------|--------|
| **Errors** | Is it broken? | Block deploy if critical |
| **Improvements** | Could UX be better? | Suggest for later |
| **Simplifications** | Can this be simpler? | Reduce complexity |

## Review Data Model

```typescript
interface ReviewItem {
  id: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: 'error' | 'ux' | 'a11y' | 'performance' | 'simplify'
  title: string
  description: string
  file?: string
  line?: number
  suggestion?: string
  status: 'open' | 'fixed' | 'dismissed' | 'building'
}

interface Review {
  status: 'pending' | 'running' | 'complete' | 'skipped'
  errors: ReviewItem[]
  improvements: ReviewItem[]
  simplifications: ReviewItem[]
  completedAt?: string
}
```

## Simplification Examples

| Before | After | Why |
|--------|-------|-----|
| 5 state variables for form | 1 object state | Less to track |
| 3 useEffects doing similar things | 1 combined effect | Clearer flow |
| Custom modal component | Native `<dialog>` | Built-in wins |
| 200-line component | 2 focused components | Single responsibility |
| Complex ternary chain | Early returns | Readable |

## Actions

- **Fix This**: AI implements the suggested fix
- **Dismiss**: Hide from list (won't block deploy)
- **Deploy Gate**: Critical errors block deployment

---

# 10. Project Modes: DEV → TEST → PROD

## Mode Progression

| Mode | Purpose | Deploy Target |
|------|---------|---------------|
| DEV | Active development | Preview URL |
| TEST | Validation | Preview URL |
| PROD | Released | Production URL |

## Version History

Each production deploy creates a version entry:
```typescript
interface VersionEntry {
  version: number
  deployedAt: string
  url: string
}
```

---

# 11. Learning System

## Pattern Extraction

After successful tasks, extract:
- Tailwind classes used
- Component patterns
- File naming conventions
- Import structures

## Pattern Injection

Inject learned patterns into subsequent task prompts for consistency.

## Suggestion System

```typescript
interface Suggestion {
  id: string
  type: 'pattern' | 'improvement' | 'warning'
  title: string
  description: string
  source: 'learning' | 'review' | 'validation'
  applied: boolean
}
```

---

# 12. Plugin Architecture

## Available Plugins

| Plugin | Status | Purpose |
|--------|--------|---------|
| Memory | ✅ | Remember preferences across sessions |
| GitHub | ✅ | Version control integration |
| Code Simplifier | 🔲 | Post-task simplification |
| Error Capture | 🔲 | Console error monitoring |

## Plugin Interface

```typescript
interface Plugin {
  name: string
  version: string
  enabled: boolean
  initialize(): Promise<void>
  execute(context: PluginContext): Promise<PluginResult>
}
```

---

# 13. Project Management

## Project Structure

```typescript
interface Project {
  id: string
  name: string
  status: 'draft' | 'building' | 'complete'
  mode: 'dev' | 'test' | 'prod'
  prd: PRD
  modules: Module[]
  priorityStack: string[]
  deployUrl: string | null
  prodUrl: string | null
  prodVersion: number
  versionHistory: VersionEntry[]
  suggestions: Suggestion[]
  review: Review
  createdAt: string
  updatedAt: string
}
```

## Project Operations

- Create from blank
- Create from idea promotion
- Import from Figma
- Delete with confirmation

---

# 14. Storage & Persistence

## Electron Store
- API key
- Provider settings
- Model selection
- Theme preference
- Last project ID

## LocalStorage
- Ideas list (`jett-ideas`)
- Provider/model overrides

## File System
- Projects stored in app data directory
- Build output in project subdirectories

---

# 15. Known Issues & Limitations

## Critical Issues

### Build System Stuck at Task 2
**Observed:** Task 1 over-builds entire app skeleton instead of just config files. Task 2 then fails because expected files already exist but have errors.

**Root Cause:** AI sees full PRD context and "helps" by building ahead of its assigned task.

**Impact:** 24+ hour builds stuck, 0/18 modules complete.

### Context Window Bloat
**Observed:** Later tasks receive enormous context (all previous code).

**Impact:** Slower responses, higher cost, AI confusion.

## UI Issues

### Selection State Reset (Fixed in v1.9.1)
**Issue:** BrainstormView selection would reset when ideas updated.

**Fix:** Lifted `selectedIdeaId` state to App.tsx.

---

# 16. Current Status

## Implemented ✅

- **Brainstorm Mode**
  - Chat-driven PRD assembly
  - 6-section capture system with weights
  - Confidence score with hover breakdown
  - Auto-extraction from AI responses
  - Bulk paste detection (>500 chars)
  - Migration from legacy research notes
  - Promotion to project with PRD conversion
  - Deploy gate at 60% confidence

- **Review System**
  - Three-part analysis: errors, improvements, simplifications
  - Category filters (error, ux, a11y, performance, simplify)
  - Severity levels (critical, high, medium, low)
  - Fix This / Dismiss actions
  - Auto-review toggle
  - Deploy gate (blocks on critical errors)

- **Design System**
  - Color tokens (light/dark)
  - Typography scale
  - Icon library (30+ SVG icons)
  - Component patterns

- **Build System (Isolated Module Architecture)** ✅ IMPLEMENTED
  - Module-based architecture with step isolation
  - Sub-task decomposition for complex modules (4+ components)
  - Visual verification with screenshots
  - Auto-retry with fix attempts (max 3)
  - Code Simplification Loop (post-build)
  - Error Verification Loop (console capture)
  - 20-template gallery with categories, search, pagination

- **Timer System** ✅ IMPLEMENTED (v1.7.6)
  - Per-step countdown timer with learning
  - Estimates based on step type history (localStorage)
  - Sub-task timer restart for complex modules
  - Total Build Time counter (top right, counts up)
  - Progress bar visualization
  - "Almost done..." state when timer reaches 0

## Not Yet Built 🔲

- CI/CD for deploying built apps (proposed)
- User Management System (proposed)
- Multi-tenant/team collaboration

---

# 17. Proposed: CI/CD for Built Apps

## Overview

After Code Review, users can deploy their Jett-built apps to production. This makes Jett a complete "idea to production" platform.

## Navigation

```
Ideas → Projects → PRD → Build → Review → Deploy
```

New `Deploy` tab appears after Review, containing a Kanban board for release management.

## Kanban Release Pipeline

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   Tested    │   Staging   │  Production │  Archived   │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ v0.1.0 ✓    │ v0.2.0      │ v0.3.0 🟢   │ v0.0.1      │
│ v0.1.1 ✓    │             │             │ v0.0.2      │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

## Promotion Flow

| Stage | Auto-checks | Manual Action |
|-------|-------------|---------------|
| Code Review → Tested | TypeScript compiles, Build succeeds, No console errors | "Mark as Tested" |
| Tested → Staging | All tests pass | "Deploy to Staging" (preview URL) |
| Staging → Production | Manual QA approval | "Deploy to Production" (live URL) |
| Production → Archived | N/A | "Archive Version" |

## Deployment Target

**Primary:** Vercel (free tier, instant deploys, perfect for React)

**Future:** Netlify, AWS S3 + CloudFront, custom domains

## Version Management

- Auto-increment version on each build
- Semantic versioning: `MAJOR.MINOR.PATCH`
- Version history with rollback capability

---

# 18. Proposed: User Management System

## Overview

Authentication and subscription management for Jett users. Built on Supabase. Designed for future LoveOS integration.

## Tech Stack

- **Auth:** Supabase Auth (email/password + email OTP)
- **Database:** Supabase PostgreSQL with Row-Level Security
- **Payments:** Stripe (future)

## Auth Flows

### Sign Up
1. Email + Password
2. Email verification (6-digit code)
3. Account created

### Sign In
1. Email + Password
2. 2FA code (email OTP)
3. Session established (JWT)

### Forgot Password
1. Enter email
2. Receive reset link
3. Set new password

## 2FA Method: Email OTP

Chosen over phone SMS because:
- No SMS costs
- Works globally
- No phone number collection (privacy)
- Supabase has built-in support
- Can add authenticator app later for power users

## User Data Model

```typescript
interface User {
  id: string           // UUID, becomes LoveOS identity
  email: string
  created_at: timestamp
  subscription: {
    plan: 'trustos_monthly'
    price: 12.99
    status: 'active' | 'past_due' | 'cancelled' | 'trialing'
    current_period_end: timestamp
    // Future LoveOS integration
    loveos_tokens?: number
    covenant_accepted?: timestamp
  }
}
```

## Data Scoping

| Data | Scope | Notes |
|------|-------|-------|
| Projects | Per user | Your apps are private |
| API keys | Per user | Bring your own Anthropic key |
| Build history | Per user | Private to your projects |
| Templates | Shared + User | 20 global templates, can create own |
| PRD/Ideas | Per user | Your intellectual property |

## Subscription: TrustOS

- **Price:** $12.99/month
- **Includes:** Full Jett access, deployment, all features
- **Single tenant:** v1 is individual accounts only

## LoveOS Integration (Future)

- User ID = LoveOS identity
- Subscription converts to token balance (1 token = 1 hour)
- "I Am" covenant acceptance stored at signup
- Grace period handling via subscription status
- Fail-safe: seeded tokens provide low downside if system fails

## Security Features

- Password hashing (Supabase/bcrypt)
- JWT session tokens
- Auto-logout after inactivity (30 min)
- Rate limiting on auth endpoints
- Email verification required

---

# 19. Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Module success rate (first attempt) | > 70% | Unknown (builds stuck) |
| Module success rate (with auto-fix) | > 90% | Unknown |
| Full app build completion | > 80% | 0% (blocked) |
| Time to first working preview | < 5 min | Never reached |
| Ideas promoted to projects | > 50% | Tracking |
| Review items fixed | > 60% | New |

---

# Appendix A: Changelog

## v1.9.2 / v1.7.6 (January 13, 2026)
- **Added:** Per-step countdown timer with learning
  - Each step shows individual timer (not global)
  - Estimates based on step type history (localStorage)
  - Default estimates: Types 15s, Shell 20s, Shared UI 25s, Module 30s, Integration 10s
  - Timer restarts for each sub-task in complex modules
- **Added:** Total Build Time counter
  - Displays in top right: "Total Build Time: MM:SS"
  - Counts up from build start
  - Persists after build completes to show final time
- **Added:** Sub-task progress display
  - Shows "Building 2/4: ComponentName" during complex module builds
  - Visible in both step card and center preview panel
- **Fixed:** Preview panel logic
  - Timer now shows while building (previously showed placeholder)
  - Logic: `isBuilding ? timer : previewUrl ? webview : status`
- **Fixed:** JSX syntax error in ternary expressions
- **Documented:** Proposed CI/CD for built apps (Deploy tab)
- **Documented:** Proposed User Management System (Supabase Auth)

## v1.9.1 (January 12, 2026)
- **Added:** Simplifications category in Review System
  - AI looks for: duplicate handlers, complex ternaries, over-abstraction
  - New filter tab in Review view
  - Integrated into review prompt
- **Fixed:** BrainstormView selection reset bug
  - Lifted `selectedIdeaId` state to App.tsx
  - Selection now persists across idea updates
- **Fixed:** Auto-start conversation on new idea
  - Uses fresh state reference instead of stale closure
- **Added:** Bulk extraction mode for long inputs (>500 chars)

## v1.9.0 (January 12, 2026)
- **BREAKING:** Replaced Research Notes with Chat-driven PRD assembly
- **Added:** Chat interface for brainstorming
  - Natural conversation with AI mentor
  - Auto-extraction of PRD captures
  - Real-time confidence scoring
- **Added:** PRD Capture system
  - 6 sections: overview, features, users, screens, data, design
  - Weighted scoring (features 30%, users 20%, etc.)
  - Target counts per section
- **Added:** Confidence score with hover breakdown
- **Added:** Deploy gate at 60% confidence
- **Changed:** Idea data model (chat + prdCaptures instead of research)
- **Added:** Migration support for legacy ideas

## v1.8.2 (January 11, 2026)
- **Added:** Review System - code review and UX improvement suggestions
- **Philosophy:** AI as mentor - teaches users what "good" looks like

## v1.8.1 (January 11, 2026)
- **Added:** Brainstorm Mode - pre-project ideation space
- **Added:** Design System documentation
- **Added:** Icon library (Icons.tsx)
- **Changed:** Navigation redesign

## v1.8.0 (January 10, 2026)
- **BREAKING:** Replaced Classic build with Modular build system
- Added: Module-based architecture
- Added: Visual verification with webview screenshots
- Added: PRD Import

---

# Appendix B: File Structure

```
jett/
├── src/
│   ├── App.tsx              # Main app, routing, state
│   ├── main.tsx             # Entry point
│   ├── components/
│   │   ├── Icons.tsx        # SVG icon library
│   │   ├── BrainstormView.tsx  # Chat-driven ideation
│   │   ├── ProjectList.tsx  # Project management
│   │   ├── PRDForm.tsx      # PRD editor
│   │   ├── PRDCanvas.tsx    # PRD mindmap view
│   │   ├── ModuleView.tsx   # Build interface
│   │   ├── ReviewView.tsx   # Code review
│   │   ├── CodePanel.tsx    # Code viewer
│   │   ├── SettingsPanel.tsx
│   │   ├── FigmaImportModal.tsx
│   │   ├── BuildErrorModal.tsx
│   │   └── ValidationPanel.tsx
│   ├── services/
│   │   └── figma.ts
│   └── styles/
│       └── index.css        # Design tokens, base styles
├── electron/
│   ├── main/
│   │   └── index.ts         # Electron main process
│   ├── preload/
│   │   └── index.ts         # IPC bridge
│   ├── plugins/
│   │   ├── memory.ts
│   │   ├── github.ts
│   │   ├── code-simplifier.ts
│   │   └── error-capture.ts
│   ├── validation/
│   │   └── index.ts
│   ├── learning/
│   │   └── index.ts
│   └── history/
│       └── index.ts
├── Jett_TRD_v1_9.md         # This document
├── DEV-ROADMAP.md
└── FEATURE-CHECKLIST.md
```

---

# Appendix C: API Reference

## Electron IPC Methods

| Method | Purpose |
|--------|---------|
| `claudeApi(key, messages, system, provider, model)` | Call AI API |
| `getSettings()` | Load stored settings |
| `saveSettings(settings)` | Persist settings |
| `getProjects()` | List all projects |
| `saveProject(project)` | Save project state |
| `deleteProject(id)` | Remove project |
| `readProjectFiles(path)` | Read project source files |
| `writeProjectFile(path, content)` | Write file to project |
| `captureWebviewScreenshot()` | Screenshot for verification |
| `deployToVercel(path, token)` | Deploy project |

---

*This document captures Jett v1.9.1 state before implementing the Isolated Module Architecture.*
