# Jett 1.7.2 Handoff Document

## Current State

**Version:** Jett 1.7.2 with Extraction Modal Flow

**Main Change:** Instead of forcing AI to output inline `[CAPTURE:...]` tags (which was unreliable), the new flow uses a two-pass approach:
1. AI responds naturally with feedback
2. Second API call extracts captures as JSON
3. Modal shows extracted items with checkboxes
4. User selects which captures to add

## What's Working

1. **3-Column Ideas Layout:**
   - Left: Ideas list with project selector
   - Middle: Chat area with title, Make Project, Trash buttons
   - Right: PRD Captures sidebar (w-80)

2. **Project-Specific Ideas:** Ideas are filtered by `projectId`

3. **Navigation:** Projects → Ideas → PRD → Build → Review

4. **App always opens on Projects view**

5. **API Key Clear button** in Settings

6. **NEW: Extraction Modal Flow:**
   - Detects bulk input (>300 chars or PRD-like structure)
   - Shows "Extracting PRD details..." indicator
   - Opens modal with checkboxes grouped by section
   - User can Select All, select by section, or pick individually
   - Adds selected captures to the PRD Captures sidebar

## Fixed Issue: Capture Extraction

**Previous Problem:** AI ignored `[CAPTURE:section:content]` tags despite prompt engineering.

**Solution:** Two-pass extraction:
1. First call: AI responds naturally (no special formatting)
2. Second call: Dedicated extraction prompt returns JSON array
3. User reviews and approves via modal

This is more reliable because:
- AI is better at returning JSON when that's the only task
- Users can review/filter extractions before adding
- Separates "feedback" from "extraction" concerns

## New Flow Diagram

```
User creates idea / pastes PRD
        ↓
AI responds naturally (feedback, questions)
        ↓
isBulkInput() detects substantial content (>300 chars)
        ↓
extractCapturesFromContent() → second API call
        ↓
Modal appears: "Found X items • Y selected"
┌─────────────────────────────────────────┐
│  ☑️ Overview (2)                        │
│    ☑️ Unified workspace for writers...  │
│                                         │
│  ☑️ Features (16)                       │
│    ☑️ Chat stream with AI brainstorm... │
│    ☐ Chapter builder with notes...      │
│    ...                                  │
│                                         │
│  [Cancel]  [Select All]  [Add Selected] │
└─────────────────────────────────────────┘
        ↓
User clicks "Add Selected"
        ↓
Captures appear in right sidebar
```

## Key Files

| File | Purpose |
|------|---------|
| `src/components/BrainstormView.tsx` | Ideas view with chat, extraction, and modal |
| `src/App.tsx` | Main app, navigation, project state |
| `src/components/SettingsPanel.tsx` | API key, model selection |

## Key Functions in BrainstormView.tsx

| Function | Line | Purpose |
|----------|------|---------|
| `isBulkInput()` | ~119 | Detects if content is >300 chars or has PRD structure |
| `startConversation()` | ~236 | Initial AI greeting, triggers extraction if bulk |
| `extractCapturesFromContent()` | ~303 | Second API call to extract JSON captures |
| `handleAddSelectedCaptures()` | ~378 | Adds checked captures to idea's prdCaptures |
| `handleSendMessage()` | ~397 | Chat handler, triggers extraction if bulk |

## Extraction Prompt

The extraction prompt asks AI to return ONLY valid JSON:
```
Return a JSON array of extracted items. Each item must have:
- "section": one of "overview", "features", "users", "screens", "data", "design"
- "content": the extracted detail

RESPOND WITH ONLY VALID JSON - no markdown, no explanation, just the array:
[{"section": "...", "content": "..."}, ...]
```

## Console Logging

- `Bulk content detected, triggering extraction...`
- `Extracting captures from content...`
- `Extraction result: [first 500 chars]`
- `Extracted X captures`
- `Added X captures to idea`

## Test PRD Available

`book-builder-prd-final.md` - A comprehensive Book Builder PRD for testing the extraction flow.

## To Install

```bash
cd jett-1.7.1
npm install
npm run dev
```

## What's Next

1. **Test the extraction flow** with the Book Builder PRD
2. **Edge cases to watch:**
   - Very long PRDs (may hit token limits)
   - PRDs with unusual formatting
   - JSON parsing errors (code handles markdown code blocks)
3. **Potential enhancements:**
   - Edit captures before adding
   - Re-extract with different parameters
   - Manual "Extract from chat" button

## Key Files

| File | Purpose |
|------|---------|
| `src/components/BrainstormView.tsx` | Ideas view with chat and captures |
| `src/App.tsx` | Main app, navigation, project state |
| `src/components/SettingsPanel.tsx` | API key, model selection |

## System Prompts Location

In `BrainstormView.tsx`:
- **Initial greeting:** ~line 249 (`startConversation` function)
- **Ongoing chat:** ~line 351 (`handleSendMessage` function)
- **Capture parsing:** ~line 420 (`parseAIResponse` function)

## Capture Format Expected

```
[CAPTURE:overview:description text]
[CAPTURE:features:feature description]
[CAPTURE:users:user type]
[CAPTURE:screens:screen name]
[CAPTURE:data:data entity]
[CAPTURE:design:design note]
```

Regex used: `/\[CAPTURE:(\w+):([^\]]+)\]/g`

## Data Flow

```
User creates project
    ↓
App opens Ideas view (setView('ideas'))
    ↓
User creates idea (with projectId)
    ↓
AI chat extracts [CAPTURE:...] tags
    ↓
parseAIResponse() extracts captures
    ↓
Captures appear in sidebar
    ↓
User clicks Push → handlePushCapture() → Updates PRD
    ↓
User goes to PRD view → sees pushed content
```

## To Install

```bash
unzip jett-1.7.1-ideas-flow.zip
cd jett-1.7.1
npm install
npm run dev
```

## Console Logging Added

- `Creating new idea: [title]`
- `New idea created with projectId: [id]`
- `Starting conversation for idea: [title]`
- `Calling Claude API...`
- `API result: {...}`
- `Parsing AI response for captures...`
- `Raw text: [first 500 chars]`
- `Total captures found: [count]`

## Test PRD Available

`book-builder-prd-final.md` - A comprehensive Book Builder PRD with pre-formatted capture tags at the bottom for testing.
