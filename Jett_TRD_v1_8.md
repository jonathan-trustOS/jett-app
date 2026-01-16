# Jett - Technical Requirements Document

**The AI that builds apps for designers.**

**Version:** 1.8.2  
**Date:** January 11, 2026  
**Status:** Active Development

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
9. [Review System](#9-review-system) ✨ NEW
10. [Project Modes: DEV → TEST → PROD](#10-project-modes-dev--test--prod)
11. [Learning System](#11-learning-system)
12. [Plugin Architecture](#12-plugin-architecture)
13. [Project Management](#13-project-management)
14. [Storage & Persistence](#14-storage--persistence)
15. [Current Status](#15-current-status)
16. [Roadmap](#16-roadmap)
17. [Success Metrics](#17-success-metrics)

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

### Loop 3: Code Review ✅ IMPLEMENTED
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

# 4. Design System ✨ NEW

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
| `--success-light` | `#14532d` | `#d1fae5` | Success backgrounds |
| `--warning` | `#fcd34d` | `#d97706` | Warning states |
| `--warning-light` | `#713f12` | `#fef3c7` | Warning backgrounds |
| `--error` | `#fca5a5` | `#dc2626` | Error states |
| `--error-light` | `#7f1d1d` | `#fee2e2` | Error backgrounds |

### Shadow Tokens
| Token | Dark Mode | Light Mode |
|-------|-----------|------------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` | `0 1px 2px rgba(0,0,0,0.08)` |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.4)` | `0 4px 6px rgba(0,0,0,0.1)` |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.5)` | `0 10px 15px rgba(0,0,0,0.12)` |

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

### Icon Components
```typescript
import { 
  IconLightbulb,    // Ideas, brainstorm
  IconFolder,       // Projects
  IconDocument,     // PRD, documents
  IconBuild,        // Build, hammer
  IconRocket,       // Deploy, launch
  IconSettings,     // Settings gear
  IconPlus,         // Add
  IconSearch,       // Search, research
  IconTrash,        // Delete
  IconCheck,        // Success, complete
  IconX,            // Close, error
  IconAlert,        // Warning
  IconRefresh,      // Reload, retry
  IconCode,         // Code view
  IconEye,          // Preview
  IconClock,        // Loading, time
  IconChart,        // Analytics, market
  IconSparkles,     // Features, magic
  IconCog,          // Tech, processing
  IconNote,         // Notes
  IconBeaker,       // Research
  IconGlobe,        // Web, live
  IconGitBranch,    // Version control
  IconExternalLink, // External link
  IconTag,          // Tags
  IconFilter,       // Filter
  IconFigma,        // Figma import
  IconImage,        // Images
  IconUpload,       // Upload
  IconDownload,     // Download
  IconPlay,         // Execute
  IconPause,        // Pause
  IconArrowLeft,    // Back
  IconChevronRight, // Expand
  IconInfo,         // Information
  IconBuilding,     // Competitor
} from './components/Icons'
```

### Icon Sizes
| Size | Pixels | Usage |
|------|--------|-------|
| 12 | 12px | Inline with small text |
| 14 | 14px | Buttons, list items |
| 16 | 16px | Default, navigation |
| 18 | 18px | Headers |
| 20 | 20px | Section titles |
| 40+ | 40-48px | Empty states, placeholders |

### Icon Usage Rules
1. **Never use emojis in UI** - Always use SVG icons
2. **Log messages may use emojis** - Console output is developer-facing
3. **Icons inherit text color** - Use `currentColor` for stroke
4. **Include text labels** - Icons alone are not accessible

## Spacing

Based on 4px grid:
| Token | Value | Usage |
|-------|-------|-------|
| `gap-1` | 4px | Tight spacing |
| `gap-2` | 8px | Related items |
| `gap-3` | 12px | Group spacing |
| `gap-4` | 16px | Section spacing |
| `gap-6` | 24px | Major sections |

## Border Radius
| Token | Value | Usage |
|-------|-------|-------|
| `rounded` | 4px | Buttons, inputs |
| `rounded-lg` | 8px | Cards, panels |
| `rounded-xl` | 12px | Modals, large cards |
| `rounded-2xl` | 16px | Feature cards |
| `rounded-full` | 9999px | Pills, avatars |

## Component Patterns

### Buttons
```tsx
// Primary
<button style={{ background: 'var(--accent-primary)', color: 'white' }}>
  <IconRocket size={14} /> Deploy
</button>

// Secondary
<button style={{ 
  background: 'var(--bg-secondary)', 
  border: '1px solid var(--border-primary)',
  color: 'var(--text-primary)' 
}}>
  <IconRefresh size={14} /> Retry
</button>

// Danger
<button style={{ color: 'var(--error)' }}>
  <IconTrash size={14} />
</button>
```

### Status Badges
```tsx
// Draft
<span style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
  Draft
</span>

// Building
<span style={{ background: 'var(--accent-primary-light)', color: 'var(--accent-primary)' }}>
  Building
</span>

// Complete
<span style={{ background: 'var(--success-light)', color: 'var(--success)' }}>
  Complete
</span>

// Warning
<span style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
  Needs Work
</span>
```

### Cards
```tsx
<div style={{ 
  background: 'var(--bg-elevated)', 
  border: '1px solid var(--border-primary)',
  borderRadius: '12px',
  boxShadow: 'var(--shadow-sm)'
}}>
  {/* content */}
</div>
```

---

# 5. Navigation & Information Architecture ✨ NEW

## Global Navigation

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [Ideas] [Projects] │ [PRD] [Build: Project Name] │ DEV │        [⚙️]   │
│   ↑         ↑      │   ↑           ↑             │  ↑  │         ↑     │
│ Global    Global   │ Project     Project         │Mode │     Settings  │
│  Nav       Nav     │  Tabs        Tabs           │     │               │
└─────────────────────────────────────────────────────────────────────────┘
```

### Navigation Hierarchy

1. **Ideas** - Pre-project ideation space (Brainstorm Mode)
2. **Projects** - Project list and management
3. **PRD** - Product Requirements Document (when project selected)
4. **Build: [Name]** - Build view with project name (when project selected)
5. **Mode Badge** - DEV/LIVE indicator
6. **Settings** - Global settings (always available)

### Design Decisions

| Decision | Rationale |
|----------|-----------|
| Ideas comes first | Matches creative workflow: idea → project → build |
| Project name only in Build tab | Reduces clutter, shows context where it matters |
| Mode badge after Build | Clear indicator of current environment |
| Separator between global and project nav | Visual hierarchy |

### Tab States
- **Inactive**: `background: transparent`, `color: var(--text-tertiary)`
- **Hover**: `background: var(--bg-hover)`, `color: var(--text-primary)`
- **Active (global)**: `background: var(--bg-tertiary)`, `color: var(--text-primary)`
- **Active (project)**: `background: var(--accent-primary)`, `color: white`

---

# 6. PRD System

The PRD System is how users define what they want to build before Jett generates tasks and code.

## PRD Views ✅ IMPLEMENTED

### Form View
Structured form with collapsible sections.

### Canvas View ✅ NEW (v1.8.0)
Visual mindmap of PRD elements:
- Central project node
- Satellite nodes for each section
- Curved connection lines
- Zoom and pan controls

### View Toggle
```
[📄 Form] [📁 Canvas]
```

## PRD Form Sections

1. **Overview** - App name, description, core goal, platform (Web/Mobile/Both)
2. **Target Users** - Primary user, user needs
3. **Features** - List of features with title, description, priority
4. **Screens** - List of screens/pages with name and description
5. **Data Model** - Entities with fields (AI can suggest from PRD)
6. **Tech Stack** - Frontend, backend, hosting (auto-configured)
7. **Competitors & Inspiration** - Similar apps
8. **Design Notes** - Colors, style, layout preferences

## PRD Readiness Score ✅ IMPLEMENTED
Visual indicator showing completeness:
- 0-40%: Red - Missing critical fields
- 40-70%: Yellow - Needs more detail
- 70-100%: Green - Ready to build

## Import PRD ✅ IMPLEMENTED
- **Download Template**: Get markdown template to fill out externally
- **Import PRD**: Paste markdown, AI parses into form fields
- **AI-Powered Parsing**: Uses Claude to extract features, screens, data model from any format

## Suggest Data Model ✅ IMPLEMENTED
AI analyzes PRD content and auto-generates appropriate data types/entities.

---

# 7. Brainstorm Mode ✨ NEW (v1.8.1)

Pre-project ideation space for capturing, researching, and developing ideas.

## Purpose
Ideas need incubation before becoming projects. Brainstorm mode provides a lightweight space to:
- Capture raw ideas quickly
- Research viability with AI assistance
- Organize and tag for later
- Promote to full project when ready

## Data Model

```typescript
interface Idea {
  id: string
  title: string
  description: string
  tags: string[]
  research: ResearchNote[]
  createdAt: string
  updatedAt: string
  status: 'raw' | 'researching' | 'ready' | 'promoted'
  projectId?: string  // Set when promoted
}

interface ResearchNote {
  id: string
  type: 'competitor' | 'market' | 'feature' | 'tech' | 'general'
  content: string
  source?: string
  createdAt: string
}
```

## UI Layout

```
┌─────────────────────┬────────────────────────────────────────────┐
│  Ideas List         │  Idea Detail                               │
│  ─────────────      │  ─────────────                             │
│  [Sort ▾] [Tag ▾]   │  Title                         [Status]    │
│                     │  Description                               │
│  ┌───────────────┐  │  Tags: [ai] [saas] [b2b]                   │
│  │ 💡 Idea Title │  │                                            │
│  │ Tags • Notes  │  │  [🔍 Research] [🚀 Make Project] [🗑️]     │
│  └───────────────┘  │                                            │
│                     │  ─────────────────────────────────         │
│  ┌───────────────┐  │  RESEARCH NOTES (5)                        │
│  │ 💡 Idea Title │  │                                            │
│  │ Tags • Notes  │  │  🏢 Competitors                            │
│  └───────────────┘  │  Content...                                │
│                     │                                            │
│  [+ New Idea]       │  📊 Market                                 │
│                     │  Content...                                │
└─────────────────────┴────────────────────────────────────────────┘
```

## Features

### Quick Capture
- Title (required)
- Description (optional)
- Tags with suggestions

### Tag System
Suggested tags: AI, SaaS, B2B, B2C, Mobile, Web, API, Productivity, Health, Finance, Education, Social, E-commerce, Gaming, Developer Tools, Analytics

### AI Research
Clicking "Research" triggers AI analysis that returns:
1. **Competitors** - 3-5 existing similar products
2. **Market** - Market size, target audience, growth potential
3. **Key Features** - 5-7 must-have MVP features
4. **Tech Stack** - Recommended technologies
5. **Challenges** - Potential obstacles

### Status Flow
```
raw → researching → ready → promoted
```

### Promote to Project
Converts idea + research into PRD draft:
- Title → Project name
- Description → Overview description
- Features research → PRD features
- Competitor research → Competitors field
- Idea marked as 'promoted' with projectId reference

## Storage
Ideas stored in localStorage (`jett-ideas`).

---

# 8. Build System

## Architecture: Modular Builds

**v1.8+ (Modular):** Feature-based modules
```
Core Setup → Feature 1 → Feature 2 → Feature 3 → ... → Deploy
```

## Module System ✅ IMPLEMENTED

### Module Creation
When user clicks "Generate Tasks" from PRD:
1. **Auto-create modules** from PRD features
2. **Core Setup** module added first (project structure, routing, shared components)
3. Each feature becomes an independent module
4. Modules ordered by priority

### Module Structure
```typescript
interface Module {
  id: string
  name: string           // Feature title or "Core Setup"
  description: string    // Feature description
  status: 'draft' | 'building' | 'complete' | 'needs-work'
  version: number        // Increments on rebuild
  tasks: Task[]          // 3-5 tasks per module
  suggestions: Suggestion[]
  files: string[]        // Files created by this module
}
```

### Module Build Flow
```
Module: "Core Setup"
     ↓
Generate 3 tasks (AI)
     ↓
Execute Task 1 → Verify → Extract files
     ↓
Execute Task 2 → Verify → Extract files
     ↓
Execute Task 3 → Verify → Extract files
     ↓
Module Complete → Auto-start next module
```

## Auto-Progress ✅ IMPLEMENTED
- When a module completes successfully, automatically starts next draft module
- 500ms delay between modules
- Continues until all modules complete or one fails

## UI Layout (3-Panel) ✅ IMPLEMENTED

```
┌─────────────┬──────────────┬──────────────────────┐
│   Modules   │   Module     │    Code / Preview    │
│   (w-80)    │   Details    │      (flex-1)        │
│             │   (w-96)     │                      │
│ ☑ Core v2   │ Add Item     │  ┌─────┬─────┐       │
│ □ Add Item  │ draft        │  │Prev │Code │       │
│ □ Category  │              │  └─────┴─────┘       │
│ □ Gallery   │ TASKS (3)    │                      │
│ □ Search    │ • Set up...  │  [iframe/CodePanel]  │
│             │ • Create...  │                      │
│ [Build Next]│ • Add nav... │                      │
└─────────────┴──────────────┴──────────────────────┘
```

---

# 9. Review System ✨ NEW (v1.8.2)

The Review System is a critical feedback loop that runs after build completes. It serves two purposes:
1. **Find errors** that need fixing before deploy
2. **Suggest improvements** that teach users best practices

## Philosophy: AI as Mentor

The Review System isn't just QA. It's teaching users what "good" looks like. Over time, they internalize patterns. The AI becomes a mentor, not just a builder.

## Flow

```
Brainstorm → PRD → Build → Review → Live
                            ↓
                     Two-part analysis:
                     1. Errors (block deploy if critical)
                     2. UX improvements (optional)
```

## Data Model

```typescript
interface Review {
  status: 'pending' | 'running' | 'complete' | 'skipped'
  errors: ReviewItem[]
  improvements: ReviewItem[]
  completedAt?: string
}

interface ReviewItem {
  id: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: 'error' | 'ux' | 'a11y' | 'performance'
  title: string
  description: string
  file?: string
  line?: number
  suggestion?: string
  status: 'open' | 'fixed' | 'dismissed' | 'building'
}
```

## UI Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Code Review                                         [Auto-review: ON]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ✅ No critical errors found                                      │   │
│  │    Your build is ready to deploy                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [All] [Error] [UX 2] [A11y 1] [Performance]                           │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ⚠️ High | UX                                                     │   │
│  │ Add loading state to submit button                              │   │
│  │ Forms feel unresponsive without feedback                        │   │
│  │                                           [Fix This] [Dismiss]  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 💡 Medium | A11y                                                 │   │
│  │ Increase contrast on secondary text                             │   │
│  │ Current: 3.8:1, WCAG AA requires 4.5:1                         │   │
│  │                                           [Fix This] [Dismiss]  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│                    ┌────────────────────────┐                          │
│                    │  🚀 Deploy to Live     │                          │
│                    └────────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Features

### Auto-Review Toggle
- **ON (default)**: Review runs automatically when build completes
- **OFF**: User triggers review manually

### Category Filters
Filter review items by type:
- **All**: Show everything
- **Error**: Critical bugs, broken functionality
- **UX**: User experience improvements
- **A11y**: Accessibility issues
- **Performance**: Speed/efficiency concerns

### Severity Levels
| Severity | Icon | Behavior |
|----------|------|----------|
| Critical | ❌ | Blocks deploy |
| High | ⚠️ | Strongly recommended |
| Medium | 💡 | Nice to have |
| Low | ✨ | Polish |

### Actions
- **Fix This**: AI implements the suggestion
- **Dismiss**: Hide item (won't show again)

### Deploy Gate
- Critical errors → Deploy button disabled
- No critical errors → Deploy enabled (with optional improvements noted)

## What Review Analyzes

### Errors (Block deploy if critical)
- Console errors in preview
- Missing dependencies
- Broken imports
- Type errors
- Missing required props

### UX Improvements
- Missing loading states
- Missing empty states
- Missing error handling
- Inconsistent spacing
- Poor visual hierarchy

### Accessibility (A11y)
- Missing alt text
- Low contrast ratios
- Missing form labels
- No focus indicators
- Missing ARIA attributes

### Performance
- Large bundle size
- Unoptimized images
- Missing lazy loading
- Unnecessary re-renders

## Navigation

Review tab appears after first build:
```
[Ideas] [Projects] | [PRD] [Build] [Review •2] | DEV | Project Name
                                     ↑
                              Badge shows open error count
```

---

# 10-15. [Core Systems]

## 10. Project Modes: DEV → TEST → PROD
- **DEV**: Active development, local preview
- **TEST**: Review mode (now integrated into Review System)
- **PROD**: Deployed to Vercel

## 11. Learning System
Extracts patterns from successful builds to improve future generations.

## 12. Plugin Architecture
Modular plugins: Memory, GitHub, Code Review, Error Capture.

## 13. Project Management
- Create, edit, delete projects
- Search and filter
- Pagination (12 per page)
- Sort by date, name, status

## 14. Storage & Persistence
- Projects: Electron store
- Ideas: localStorage
- Settings: Electron store + localStorage
- Review data: Part of project

## 15. Technical Architecture
- Electron + React + TypeScript
- Vite for bundling
- Tailwind CSS

## 18. Data Models
See TypeScript interfaces throughout document.

---

# 15. Current Status

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
- PRD generation with structured form
- **PRD Canvas View** - Visual mindmap
- **PRD Import** - AI-powered markdown parsing
- **Suggest Data Model** - AI auto-fills from PRD
- Project CRUD
- **Project Delete** - Trash icon with confirmation
- Learning system
- Smart suggestions
- History & Rollback
- DEV/TEST/PROD modes
- Plugin validation system
- Code review plugin
- Memory plugin
- GitHub plugin
- Error capture plugin
- Settings persistence (API key, provider, model, theme)
- **Modular Build System**
  - Auto-create modules from features
  - Core Setup + feature modules
  - Auto-progress through modules
  - Auto-select next incomplete module
  - 3-panel layout (modules/details/code-preview)
  - Build log drawer
- **Brainstorm Mode**
  - Idea capture with tags
  - AI research (competitors, market, features, tech, challenges)
  - Status tracking (raw → researching → ready → promoted)
  - Promote to project
- **Design System**
  - Color tokens (light/dark)
  - Typography scale
  - Icon library (30+ SVG icons)
  - Component patterns
- **Navigation Redesign**
  - Ideas → Projects → PRD → Build → Review flow
  - Project name shown after mode badge
  - Consistent icon usage
- **Review System** ✨ NEW (v1.8.2)
  - Two-part analysis: errors + improvements
  - Category filters (error, ux, a11y, performance)
  - Severity levels (critical, high, medium, low)
  - Fix This / Dismiss actions
  - Auto-review toggle
  - Deploy gate (blocks on critical errors)
  - AI as mentor philosophy

## Not Yet Built 🔲
- Code Simplification Loop
- Error Verification Loop (continuous)
- Template Gallery
- Visual verification tuning

---

# 16. Roadmap

## Phase 1: Core Loop ✅ COMPLETE
- Visual verification loop
- Auto-fix on BROKEN
- Vercel deployment
- Learning system

## Phase 2: Plugins & Polish ✅ COMPLETE
- Plugin validation system
- Code Review plugin
- Memory plugin
- GitHub plugin

## Phase 3: Modular Architecture ✅ COMPLETE (v1.8.0)
- ✅ Module-based builds
- ✅ Auto-progress
- ✅ 3-panel UI
- ✅ Code/Preview tabs
- ✅ PRD Import

## Phase 4: Ideation & Polish ✅ COMPLETE (v1.8.1)
- ✅ Brainstorm Mode
- ✅ Design System documentation
- ✅ Navigation redesign
- ✅ Icon library
- ✅ PRD Canvas View

## Phase 5: Review & Quality ✅ COMPLETE (v1.8.2)
- ✅ Review System
- ✅ Error detection
- ✅ UX improvement suggestions
- ✅ A11y analysis
- ✅ Deploy gate
- ✅ AI as mentor

## Phase 6: Scale
- Template Gallery
- Team collaboration (v2)
- Mobile app generation

---

# 17. Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Module success rate (first attempt) | > 70% | Tracking |
| Module success rate (with auto-fix) | > 90% | Tracking |
| Full app build completion | > 80% | Tracking |
| Time to first working preview | < 5 min | Tracking |
| Ideas promoted to projects | > 50% | Tracking |
| Review items fixed | > 60% | New |

---

# Appendix A: Changelog

## v1.8.2 (January 11, 2026) ✨ NEW
- **Added:** Review System - code review and UX improvement suggestions
  - Two-part analysis: errors + improvements
  - Category filters (error, ux, a11y, performance)
  - Severity levels (critical, high, medium, low)
  - "Fix This" button triggers AI to implement fix
  - "Dismiss" to hide items
  - Auto-review toggle (on by default)
  - Deploy gate (blocks deploy on critical errors)
- **Philosophy:** AI as mentor - teaches users what "good" looks like
- **Changed:** Navigation flow now: Brainstorm → PRD → Build → Review → Live
- **Changed:** Project name moved after mode badge in nav
- **Added:** Review tab appears after first build, shows error count badge

## v1.8.1 (January 11, 2026)
- **Added:** Brainstorm Mode - pre-project ideation space
  - Idea capture with title, description, tags
  - AI research (competitors, market, features, tech, challenges)
  - Status tracking (raw → researching → ready → promoted)
  - Promote idea to project with PRD pre-fill
- **Added:** Design System documentation
  - Color tokens (light/dark themes)
  - Typography scale
  - Spacing system
  - Component patterns
- **Added:** Icon library (Icons.tsx)
  - 30+ reusable SVG icons
  - Consistent sizing (12-48px)
  - Theme-aware (currentColor)
- **Changed:** Navigation redesign
  - Reordered: Ideas → Projects → PRD → Build
  - Project name only in Build tab: "Build: Project Name"
  - All icons now inline SVGs (no emojis in UI)
- **Added:** Project delete with confirmation
- **Added:** PRD Canvas View with improved contrast
- **Fixed:** Dark mode contrast (brighter text, stronger borders)
- **Fixed:** Light mode contrast (darker backgrounds, stronger colors)

## v1.8.0 (January 10, 2026)
- **BREAKING:** Replaced Classic build with Modular build system
- Added: Module-based architecture (Core Setup + feature modules)
- Added: Auto-progress through modules
- Added: Auto-select next incomplete module
- Added: 3-panel Build UI (modules/details/code-preview)
- Added: Code/Preview tab switcher
- Added: Build log drawer (collapsible)
- Added: PRD Import with AI-powered parsing
- Added: Download PRD Template
- Added: Visual verification with webview screenshots
- Added: Post-task pipeline (snapshot, simplify, learn)
- Added: Deploy button in Build view
- Fixed: Settings persistence (API key, model, theme survive restart)
- Removed: Classic build mode
- Removed: Build mode toggle

## v1.7.6 (January 10, 2026)
- Added: Skip Task button
- Added: Resume Build
- Added: Suggest Data Model
- Added: Generate Tasks button
- Added: Save confirmation

## v1.7.5 (January 10, 2026)
- Added: Project Search
- Added: Pagination
- Added: Platform Selector
- Added: Multi-page Apps

## v1.7 (January 10, 2026)
- Added: Figma Import
- Added: Plugin system
- Added: GitHub integration
- Added: Settings Panel
- Added: Model Selector

---

# Appendix B: File Structure

```
jett/
├── src/
│   ├── App.tsx              # Main app, routing, state
│   ├── main.tsx             # Entry point
│   ├── components/
│   │   ├── Icons.tsx        # ✨ SVG icon library
│   │   ├── BrainstormView.tsx  # ✨ Idea capture
│   │   ├── ProjectList.tsx  # Project management
│   │   ├── PRDForm.tsx      # PRD editor
│   │   ├── PRDCanvas.tsx    # PRD mindmap view
│   │   ├── ModuleView.tsx   # Build interface
│   │   ├── BuildView.tsx    # Legacy build (unused)
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
├── Jett_TRD_v1_8.md         # This document
├── DEV-ROADMAP.md
└── FEATURE-CHECKLIST.md
```

---

# Appendix C: Feature Checklist

## Core Build Loop
| Feature | Verification |
|---------|--------------|
| Task execution with AI | `grep "claudeApi" ModuleView.tsx` |
| File extraction | `grep "FILE-START" ModuleView.tsx` |
| Autofix retry | `grep "maxAttempts" ModuleView.tsx` |

## Visual Verification
| Feature | Verification |
|---------|--------------|
| Screenshot capture | `grep "captureWebviewScreenshot" ModuleView.tsx` |
| WORKING/BROKEN | `grep "WORKING\|BROKEN" ModuleView.tsx` |

## Brainstorm Mode
| Feature | Verification |
|---------|--------------|
| Idea CRUD | `grep "handleAddIdea" BrainstormView.tsx` |
| AI Research | `grep "handleResearch" BrainstormView.tsx` |
| Promote to Project | `grep "handlePromote" BrainstormView.tsx` |

## Design System
| Feature | Verification |
|---------|--------------|
| Icons component | `ls src/components/Icons.tsx` |
| Color tokens | `grep "var(--" src/styles/index.css` |

---

*The AI must see everything. That's how it learns to build.*
