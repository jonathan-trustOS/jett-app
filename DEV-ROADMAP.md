# Jett Development Roadmap

## v1.8.0 (Current)
- ✅ Modular build system
- ✅ Auto-progress between modules
- ✅ Feature parity (screenshots, snapshots, deploy, rollback, suggestions)
- ✅ PRD Canvas View (mindmap + form toggle)

## v1.9.0 (Next)

### Brainstorm Mode
**Pre-project ideation space**

A lightweight area before formal projects where ideas can be gathered, researched, and developed until ready to become a project.

**Core concept:**
- Capture raw ideas quickly (text, voice notes, links)
- AI-assisted research on ideas (market, competitors, feasibility)
- Organize & tag ideas
- "Promote to Project" when idea is ready

**UI Flow:**
```
┌─────────────────────────────────────────────┐
│  Brainstorm                    [+ New Idea] │
├─────────────────────────────────────────────┤
│                                             │
│  💡 "AI-powered recipe generator"           │
│     Tags: food, AI, consumer                │
│     Research: 3 notes  |  [→ Make Project]  │
│                                             │
│  💡 "Inventory tracker for small biz"       │
│     Tags: B2B, SaaS                         │
│     Research: 1 note   |  [→ Make Project]  │
│                                             │
│  💡 "Habit tracker with social"             │
│     Tags: health, social                    │
│     Research: 0 notes  |  [Research...]     │
│                                             │
└─────────────────────────────────────────────┘
```

**Features:**
1. Quick capture - minimal friction to add ideas
2. AI Research - "Research this idea" button that:
   - Finds competitors
   - Estimates market size
   - Identifies key features
   - Suggests tech stack
3. Idea canvas - optional visual board for related ideas
4. Promote to Project - converts idea + research into PRD draft

**Data model:**
```typescript
interface Idea {
  id: string
  title: string
  description: string
  tags: string[]
  research: ResearchNote[]
  createdAt: Date
  status: 'raw' | 'researching' | 'ready' | 'promoted'
  projectId?: string // if promoted
}

interface ResearchNote {
  id: string
  type: 'competitor' | 'market' | 'feature' | 'tech' | 'general'
  content: string
  source?: string
  createdAt: Date
}
```

**Navigation:**
```
[Brainstorm] [Projects] [Settings]
     │            │
     │            └── Existing project list
     └── Pre-project ideas
```

---

## Future Ideas
- Team collaboration
- Version control integration
- Template library
- Plugin marketplace
