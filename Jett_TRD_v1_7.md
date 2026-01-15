# Jett - Technical Requirements Document

**The AI that builds apps for designers.**

**Version:** 1.7.6  
**Date:** January 10, 2026  
**Status:** Active Development

---

# Table of Contents

1. [Vision & Principles](#1-vision--principles)
2. [Target User](#2-target-user)
3. [Core Architecture: Feedback Loops](#3-core-architecture-feedback-loops)
4. [PRD System](#4-prd-system)
5. [Build System](#5-build-system)
6. [Project Modes: DEV → TEST → PROD](#6-project-modes-dev--test--prod)
7. [Learning System](#7-learning-system)
8. [Suggestion Engine](#8-suggestion-engine)
9. [Plugin Architecture](#9-plugin-architecture) ✨ NEW
10. [Plugin Validation System](#10-plugin-validation-system) ✨ NEW
11. [Project Template](#11-project-template)
12. [Project Management](#12-project-management)
13. [Storage & Persistence](#13-storage--persistence)
14. [History & Rollback](#14-history--rollback)
15. [Error Handling](#15-error-handling)
16. [Technical Architecture](#16-technical-architecture)
17. [Data Models](#17-data-models)
18. [UI Specifications](#18-ui-specifications)
19. [AI Configuration](#19-ai-configuration)
20. [Settings & Configuration](#20-settings--configuration)
21. [Loading States & Timeouts](#21-loading-states--timeouts)
22. [Limits & Constraints](#22-limits--constraints)
23. [Accessibility](#23-accessibility)
24. [Current Status](#24-current-status)
25. [Roadmap](#25-roadmap)
26. [Success Metrics](#26-success-metrics)
27. [Open Questions](#27-open-questions)

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
7. **Plugins extend capabilities** - Modular plugins add specialized functionality. ✨ NEW

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

```
Task: "Add a login button"
     ↓
AI writes code
     ↓
Screenshot captured (auto, 2s delay)
     ↓
AI analyzes: "I see a blue button labeled 'Login' in the header. WORKING."
     ↓
Simplify code → Learn patterns → Next task
```

### Loop 2: Pattern Learning ✅ IMPLEMENTED (v1.4.0)
**What AI learns:** Tailwind classes, components, conventions from generated code  
**When:** After every successful task  
**How:** Extract patterns, inject into next task's context  
**AI response:** Maintains consistency across tasks

### Loop 3: Code Review ✅ IMPLEMENTED (v1.6.0)
**What AI sees:** Generated code analyzed for design/a11y violations  
**When:** After task completion, before deploy  
**How:** Pattern matching + AI analysis against Impeccable Design rules  
**AI response:** Issues flagged with suggestions for improvement

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

# 4. PRD System

The PRD System is how users define what they want to build before Jett generates tasks and code.

## Current Implementation: 5-Question Intake ✅ IMPLEMENTED

Quick intake flow with 5 questions:
1. What kind of app? (dropdown)
2. App name
3. What should it do? (textarea)
4. Key features (textarea)
5. Design preferences (textarea)

AI generates full PRD from answers.

---

# 5. Build System

## Task Generation

### Task Count
Fixed at **5 tasks** per project.

### Default Tasks (when AI generation fails)
```
1. Set up project structure and dependencies
2. Build the main UI component
3. Add state management and interactivity
4. Style the interface with Tailwind CSS
5. Final polish and user experience improvements
```

## Build Loop ✅ IMPLEMENTED

For each task:
1. **Display task** in task panel
2. **User clicks "Do it"** to start execution
3. **AI executes task** - writes files via `---FILE-START---` / `---FILE-END---` format
4. **Preview updates** - hot reload shows changes
5. **AI captures screenshot** (auto, 2s/5s delay)
6. **AI verifies** - WORKING or BROKEN
7. **If BROKEN:** AI triggers fix, re-verifies (max 3 attempts)
8. **If WORKING:** Run code review → Simplify (future) → Extract patterns → Task complete

## Post-Task Pipeline ✅ IMPLEMENTED (v1.6.0)

```
Task WORKING
     ↓
Code Review (design/a11y check)
     ↓
Code Simplification (future)
     ↓
Pattern Extraction
     ↓
Task Complete → Next Task
```

## Auto-Fix Limits ✅ IMPLEMENTED

| Attempt | Behavior |
|---------|----------|
| 1st BROKEN | Auto-fix triggered automatically |
| 2nd BROKEN | Auto-fix triggered automatically |
| 3rd BROKEN | Stop. Task marked as `'failed'` |

---

# 6. Project Modes: DEV → TEST → PROD

## Three Modes ✅ IMPLEMENTED

### DEV Mode
- Active development
- Tasks executing
- Suggestions available after build
- Can build suggestions

### TEST Mode 🔲 NOT FULLY IMPLEMENTED
- Pre-production testing
- Manual QA by user

### PROD Mode ✅ IMPLEMENTED
- Deployed to Vercel
- Shows live URL
- Version tracking (v1, v2, etc.)

---

# 7. Learning System

## Overview

Jett learns from every build to improve future builds. The learning system extracts patterns from generated code and injects them into subsequent task contexts.

## What Jett Learns

### 1. Tailwind Patterns
- **Colors:** `bg-slate-800`, `text-indigo-400`, etc.
- **Components:** `rounded-lg`, `shadow-md`, `hover:bg-blue-600`
- **Layout:** `flex`, `grid`, `gap-4`, `p-6`

### 2. Component Registry
- Component names and purposes
- File locations
- Component relationships

### 3. Project Conventions
- State management (useState, Zustand, Redux)
- Styling approach (Tailwind, Styled Components)
- Icon library (Lucide, Heroicons)

---

# 8. Suggestion Engine

## Overview

After build completion, Jett generates smart suggestions for improvements.

## Suggestion Categories

| Category | Examples |
|----------|----------|
| Accessibility | Focus states, color contrast, ARIA labels |
| UX | Loading indicators, feedback, keyboard shortcuts |
| Performance | Image optimization, lazy loading, bundle size |
| Polish | Transitions, empty states, error messages |
| Responsive | Mobile layout, breakpoints |

---

# 9. Plugin Architecture ✨ NEW

## Overview

Jett uses a modular plugin system to extend capabilities. Plugins add specialized AI behaviors that run at specific points in the build lifecycle.

## Plugin Categories

| Category | Purpose | Run When |
|----------|---------|----------|
| Code Review | Check design/a11y violations | After task completion |
| Code Simplifier | Clean up AI-generated code | After verification |
| Memory | Persist user preferences | Throughout session |
| GitHub | Version control & deploy | On commit/deploy |

## Planned Plugins

### 1. Code Review Plugin ✅ IMPLEMENTED (v1.6.0)

**Purpose:** Catch design and accessibility violations before deploy.

**Success Criteria:**
- Reviews run in < 5 seconds
- Catches 80% of Impeccable Design violations
- Zero false positives on critical issues

**Violations Detected:**
| Category | Issue |
|----------|-------|
| Design | Wrong fonts (Inter, Roboto) |
| Design | Pure black/white (#000, #fff) |
| Design | Cyan-on-dark scheme |
| Design | Nested cards |
| Design | Uniform spacing |
| Design | Bounce animations |
| A11y | Missing alt text |
| A11y | Missing form labels |
| A11y | Low contrast |
| A11y | No focus indicators |

### 2. Code Simplifier Plugin 🔲 NOT YET IMPLEMENTED

**Purpose:** Simplify AI-generated code without changing functionality.

**Principles (from Anthropic's official plugin):**
1. **Preserve Functionality:** Never change what code does - only how it does it
2. **Apply Project Standards:** Follow established coding conventions
3. **Prioritize Readability:** Explicit code over overly compact solutions
4. **Avoid Anti-patterns:** No nested ternaries, proper imports

**What It Simplifies:**
- Remove unnecessary complexity
- Flatten nested structures
- Consolidate duplicate code
- Improve naming
- Sort imports
- Remove dead code

### 3. Memory Plugin 🔲 NOT YET IMPLEMENTED

**Purpose:** Remember user preferences across sessions.

### 4. GitHub Plugin 🔲 NOT YET IMPLEMENTED

**Purpose:** Version control and deployment integration.

## Plugin Lifecycle

```
┌──────────────────────────────────────────────────────┐
│                    BUILD LIFECYCLE                    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Task Start                                          │
│      ↓                                               │
│  AI Generates Code                                   │
│      ↓                                               │
│  Visual Verification (screenshot)                    │
│      ↓                                               │
│  ┌─────────────────────────────────┐                │
│  │  PLUGIN: Code Review            │                │
│  │  - Check design violations      │                │
│  │  - Check a11y issues            │                │
│  └─────────────────────────────────┘                │
│      ↓                                               │
│  ┌─────────────────────────────────┐                │
│  │  PLUGIN: Code Simplifier        │  (future)     │
│  │  - Preserve functionality       │                │
│  │  - Apply project standards      │                │
│  └─────────────────────────────────┘                │
│      ↓                                               │
│  Pattern Extraction                                  │
│      ↓                                               │
│  ┌─────────────────────────────────┐                │
│  │  PLUGIN: GitHub                 │  (future)     │
│  │  - Auto-commit changes          │                │
│  └─────────────────────────────────┘                │
│      ↓                                               │
│  Task Complete → Next Task                           │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

# 10. Plugin Validation System ✨ NEW

## Overview

The validation system tests plugins against known fixtures to ensure they work correctly.

```
Current Loop (Tasks):
  executeTask() → verifyTask() → WORKING/BROKEN

Validation Loop (Plugins):
  runPlugin() → validatePlugin() → PASS/FAIL
```

## Architecture

```
electron/validation/
├── index.ts              # Orchestrator
├── ipc-handlers.ts       # IPC handlers
├── preload-additions.ts  # Renderer API
└── fixtures/
    ├── violations/       # Known bad code (10 files)
    │   ├── bad-fonts.tsx
    │   ├── pure-black.tsx
    │   ├── cyan-dark.tsx
    │   ├── nested-cards.tsx
    │   ├── uniform-spacing.tsx
    │   ├── bounce-animation.tsx
    │   ├── missing-alt.tsx
    │   ├── no-labels.tsx
    │   ├── low-contrast.tsx
    │   └── no-focus.tsx
    └── clean/            # Known good code (2 files)
        ├── impeccable-button.tsx
        └── accessible-form.tsx
```

## Validation Results

```typescript
interface ValidationResult {
  criterion: string
  plugin: 'code-review' | 'memory' | 'github' | 'simplifier'
  passed: boolean
  actual: string | number
  expected: string | number
  duration?: number
  details?: string
}
```

## Success Criteria by Plugin

### Code Review Plugin

| Criterion | Target |
|-----------|--------|
| Speed | < 5 seconds |
| Detection rate | ≥ 80% caught |
| False positives | 0 critical issues |

### Memory Plugin

| Criterion | Target |
|-----------|--------|
| Persistence | Data intact after restart |
| Clear safety | No crashes |

### GitHub Plugin

| Criterion | Target |
|-----------|--------|
| OAuth speed | < 30 seconds |
| Auto-commit | Works reliably |

## Validation UI

```
┌─────────────────────────────────────────────────────┐
│ 🧪 Plugin Validation                                │
├─────────────────────────────────────────────────────┤
│ 📝 Code Review               3/3 ✓                  │
│ 🧠 Memory                    3/3 ✓                  │
│ 🐙 GitHub                    3/3 ✓                  │
│                                                     │
│ [Run Validation]                                    │
└─────────────────────────────────────────────────────┘
```

---

# 11. Project Template

## Template Files ✅ IMPLEMENTED

```
{projectPath}/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    └── index.css
```

---

# 12. Project Management

## Project CRUD ✅ IMPLEMENTED

| Operation | Method |
|-----------|--------|
| Create | Click "New Project" → 5-question intake |
| Read | Project list shows all projects |
| Update | Edit project name |
| Delete | Remove from list |

---

# 13. Storage & Persistence

## Storage Locations

| Data | Location |
|------|----------|
| App settings | `~/.config/jett/settings.json` |
| Projects list | `~/.config/jett/projects.json` |
| Learning data | `~/.config/jett/learning/learning.json` |
| Project files | `~/Documents/Jett/{project-name}/` |

---

# 14. History & Rollback 🔲 NOT YET IMPLEMENTED

## Snapshot System

After each task completion:
1. Create snapshot of project state
2. Save to `.jett/history/`
3. Allow rollback to any snapshot

---

# 15. Error Handling

## Error Categories

| Category | Handling |
|----------|----------|
| API Error | Show message, retry button |
| Build Error | Show error, suggest fix |
| Task Error | Auto-fix (max 3 attempts) |
| Network Error | Offline message |

---

# 16. Technical Architecture

## Stack

| Layer | Technology |
|-------|------------|
| Shell | Electron |
| Renderer | React + TypeScript |
| Styling | Tailwind CSS |
| AI | Claude API / OpenRouter |
| Build | Vite |
| Deploy | Vercel CLI |

## Directory Structure

```
jett/
├── electron/
│   ├── main/
│   ├── preload/
│   ├── learning/
│   ├── history/
│   └── validation/    ← NEW
├── src/
│   ├── App.tsx
│   ├── components/
│   │   └── ValidationPanel.tsx  ← NEW
│   └── styles/
└── package.json
```

---

# 17. Data Models

## Task Model

```typescript
interface Task {
  id: string
  description: string
  status: 'pending' | 'executing' | 'verifying' | 'complete' | 'failed'
  attempts: number
  verificationResult?: 'WORKING' | 'BROKEN'
  reviewIssues?: ReviewIssue[]
}
```

## Review Issue Model

```typescript
interface ReviewIssue {
  category: 'design' | 'a11y' | 'perf' | 'types'
  severity: 'critical' | 'warning' | 'suggestion'
  message: string
  line?: number
  suggestion?: string
}
```

## Validation Result Model

```typescript
interface ValidationResult {
  criterion: string
  plugin: 'code-review' | 'memory' | 'github' | 'simplifier'
  passed: boolean
  actual: string | number
  expected: string | number
  duration?: number
  details?: string
}
```

---

# 18. UI Specifications

## Color Palette

| Element | Color |
|---------|-------|
| Background | `#0f172a` (slate-900) |
| Panel | `#1e293b` (slate-800) |
| Primary | `#6366f1` (indigo-500) |
| Success | `#22c55e` (green-500) |
| Warning | `#f59e0b` (amber-500) |
| Error | `#ef4444` (red-500) |

---

# 19. AI Configuration

## Providers ✅ IMPLEMENTED

| Provider | Models |
|----------|--------|
| Anthropic | claude-sonnet-4-20250514 |
| OpenRouter | Multiple |

---

# 20. Settings & Configuration

## Settings Panel ✅ IMPLEMENTED

| Setting | Type | Default |
|---------|------|---------|
| API Key | password | Required |
| Provider | select | "anthropic" |

---

# 21. Loading States & Timeouts

## Timeouts

| Operation | Timeout |
|-----------|---------|
| Task execution | 60s |
| Verification | 30s |
| npm install | 120s |
| Deployment | 120s |
| Validation | 30s |

---

# 22. Limits & Constraints

## System Limits

| Limit | Value |
|-------|-------|
| Tasks per project | 5 |
| Max auto-fix attempts | 3 |
| Suggestions shown | 3 |
| Validation fixtures | 12 |

---

# 23. Accessibility

| Requirement | Status |
|-------------|--------|
| Keyboard navigation | 🔲 Partial |
| Focus indicators | 🔲 Partial |
| Button labels | ✅ Done |
| Color contrast | ✅ Done |

---

# 24. Current Status

## Working ✅
- Electron shell with React renderer
- Screenshot capture from webview
- AI integration (Claude API + OpenRouter)
- File writing to project directory
- Dev server management
- Live preview with hot reload
- Auto-verification flow
- BROKEN → auto-fix trigger (max 3 attempts)
- Vercel deployment
- PRD generation
- Project CRUD
- Learning system
- Smart suggestions
- **Building suggestions** (AI implementation complete)
- **History & Rollback** (snapshots + restore)
- DEV/TEST/PROD modes
- **Plugin validation system**
- **Code review plugin**
- **Code simplifier plugin** (wired into pipeline)
- **Memory plugin** (preferences + pattern learning)
- **GitHub plugin** (auth + auto-commit + push + Pages deploy)
- **Error capture plugin** (detect + auto-fix npm/TS/runtime errors)
- **Build error modal** (UI for viewing/fixing errors)
- **Editable tasks** (edit task descriptions before execution)
- **Task stop button** (cancel running build mid-execution)
- **Settings Panel** (API config, plugins, GitHub, memory prefs)
- **Model Selector** (Opus 4.5 default + Sonnet/Haiku + OpenRouter)
- **Figma Import** (paste URL → extract design → generate PRD)
- **Project Search** (typeahead filter on projects page)
- **Pagination** (12 projects per page)
- **Platform Selector** (Web/Mobile/Both in PRD)
- **Multi-page Apps** (React Router when multiple screens defined)
- **Skip Task** (bypass false-positive verification failures)
- **Resume Build** (continue from last incomplete task)
- **Suggest Data Model** (AI auto-fills data types from PRD)
- **Save Confirmation** (toast + button state on API key save)
- **Generate Tasks Button** (in empty task state)

## Not Yet Built 🔲
- Template Gallery
- Visual verification tuning (reduce false positives)

---

# 25. Roadmap

## Phase 1: Core Loop ✅ COMPLETE
- Visual verification loop
- Auto-fix on BROKEN
- Vercel deployment
- Learning system

## Phase 2: Plugins & Polish ✅ COMPLETE
- ✅ Plugin validation system
- ✅ Code Review plugin
- ✅ Code Simplifier plugin
- ✅ Memory plugin
- ✅ GitHub plugin

## Phase 3: Feedback Completion ✅ COMPLETE
- ✅ Error capture loop (auto-fix npm/TS/runtime errors)
- ✅ Build error modal UI

## Phase 4: Scale
- Figma import
- Multi-page app support

---

# 26. Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Task success rate (first attempt) | > 70% | ~60% |
| Task success rate (with auto-fix) | > 90% | ~80% |
| Code review detection rate | ≥ 80% | Tracking |
| Error auto-fix success rate | ≥ 70% | Tracking |
| Validation pass rate | 100% | 100% |

---

# 27. Open Questions

1. **Code Simplifier:** Run on every task or only on demand?
2. **AI vs Pattern Matching:** When should code review use AI vs regex?
3. **Pattern quality:** How to validate patterns are helpful?
4. **Model costs:** Claude API costs for verification - sustainable?

---

# Appendix A: Changelog

## v1.7.6 (January 10, 2026)
- Added: Skip Task button (bypass false-positive verification failures)
- Added: Resume Build (continue from last incomplete task instead of restarting)
- Added: Suggest Data Model (AI analyzes PRD and auto-fills data types)
- Added: Generate Tasks button (visible in empty task state)
- Added: Save confirmation (toast notification + button state change)
- Added: Light mode fixes (CSS variables across all components)
- Fixed: Task text wrapping (break-words + overflow handling)
- Fixed: Confidence scoring (new projects start at 0%)
- Renamed: "Entity" → "Data Type" in PRD form
- Improved: Error modal with Retry/Skip/Auto-Fix options

## v1.7.5 (January 10, 2026)
- Added: Project Search (typeahead filter on projects page)
- Added: Pagination (12 projects per page)
- Added: Platform Selector (Web/Mobile/Both in PRD)
- Added: Multi-page Apps (React Router when 2+ screens defined)
- Added: Smart Figma platform detection based on screen sizes

## v1.7 (January 10, 2026)
- Added: Figma Import (paste URL → extract colors, typography, components → generate PRD)
- Added: Code Simplifier wired into build loop
- Added: Memory Plugin (preferences + pattern learning)
- Added: GitHub Plugin (auth + auto-commit + push + Pages)
- Added: Error Capture Plugin (detect + auto-fix npm/TS/runtime errors)
- Added: Build Error Modal (categorized errors + auto-fix UI)
- Added: Editable tasks (click ✏️ on pending tasks to edit)
- Added: Task stop button (⏹️ to cancel running build)
- Added: Settings Panel (API config, plugins, GitHub, memory)
- Added: Model Selector (Sonnet/Opus/Haiku + OpenRouter)
- Added: OpenRouter provider support with multiple models
- Added: Auto-commit after each task (when enabled)
- Added: npm install error auto-fix (up to 2 retries)
- Added: "Fix" button on failed tasks
- Updated: Build loop with full post-task pipeline
- Updated: Validation system with real plugin tests

## v1.6 (January 10, 2026)
- Added: Plugin Architecture (Section 9)
- Added: Plugin Validation System (Section 10)
- Added: Code Review Plugin with 10 violation fixtures
- Added: Code Simplifier Plugin spec (from Anthropic's official plugin)
- Added: ValidationPanel UI component
- Updated: Core Architecture with 5 feedback loops
- Updated: Build System with post-task pipeline

## v1.5 (January 10, 2026)
- Added: Learning System
- Added: Suggestion Engine
- Added: Project Modes DEV/TEST/PROD
- Added: OpenRouter provider support

## v1.4 (January 7, 2026)
- Added: Keyboard shortcuts, Empty states
- Added: Manual verification flow
- Added: Auto-fix limits - max 3

## v1.3-v1.0 (January 6, 2026)
- Initial TRD through iterative refinement

---

*The AI must see everything. That's how it learns to build.*
