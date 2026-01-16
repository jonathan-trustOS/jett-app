# Jett Feature Checklist

**Purpose:** Prevent feature drift when refactoring. Check this list before any major changes.

**Last Updated:** January 10, 2026 (v1.8.0)

---

## Core Build Loop ✅

- [ ] Task execution with AI
- [ ] File extraction (---FILE-START--- regex)
- [ ] Fallback file extraction (code blocks)
- [ ] Autofix retry (max 3 attempts)
- [ ] Task status updates (pending → executing → verifying → working/failed)

## Visual Verification ✅

- [ ] Screenshot capture from webview (not iframe!)
- [ ] Send screenshot to AI with task description
- [ ] WORKING/BROKEN response parsing
- [ ] 2-second delay before capture (let preview update)

## Post-Task Pipeline ✅

- [ ] Create snapshot after WORKING (`window.jett.history.createSnapshot`)
- [ ] Run code simplifier (`window.jett.simplifier.simplifyProject`)
- [ ] Learn patterns for memory (`window.jett.memory.learnPatterns`)
- [ ] Extract patterns from generated code

## Preview System ✅

- [ ] Dev server start (`window.jett.startDevServer`)
- [ ] Server status indicator (green/gray dot)
- [ ] Webview for preview (enables screenshot capture)
- [ ] Restart server button
- [ ] Auto-start when first module/task completes

## Code Panel ✅

- [ ] List project files
- [ ] View file contents
- [ ] Syntax highlighting
- [ ] Refresh on file changes (`lastFileUpdate` state)

## Deployment ✅

- [ ] Deploy to Vercel (`window.jett.deployToVercel`)
- [ ] Deploy button (visible when all complete)
- [ ] Deploy status/loading indicator
- [ ] Show deployed URL

## Settings Persistence ✅

- [ ] API key saves to electron-store
- [ ] Provider saves to electron-store
- [ ] Model saves to electron-store
- [ ] Theme saves to electron-store
- [ ] Settings survive app restart

## Error Handling ✅

- [ ] API error logging
- [ ] Build error display
- [ ] Graceful failure (continue to next task)
- [ ] Error messages in build log

## History & Rollback 🔲 (Partial)

- [ ] Snapshot creation (after successful tasks)
- [ ] Snapshot listing
- [ ] Rollback to snapshot
- [ ] Delete snapshots after rollback point

## npm Install Error Handling 🔲 (Not in ModuleView)

- [ ] Detect npm install failures
- [ ] Auto-retry with fixes
- [ ] Show error modal

## Suggestions System 🔲 (Partial)

- [ ] Generate suggestions after build
- [ ] Display suggestion cards
- [ ] Build individual suggestions
- [ ] Verify suggestion implementation

---

## Verification Commands

Run these greps to verify features are present:

```bash
# Screenshot capture
grep -n "captureWebviewScreenshot\|webviewRef" src/components/ModuleView.tsx

# Verification loop
grep -n "WORKING\|BROKEN" src/components/ModuleView.tsx

# Post-task pipeline
grep -n "snapshot\|simplifier\|memory.learn" src/components/ModuleView.tsx

# Deploy
grep -n "deployToVercel\|isDeploying" src/components/ModuleView.tsx

# Autofix
grep -n "maxAttempts\|attempts" src/components/ModuleView.tsx

# Settings persistence
grep -n "saveSettings" src/App.tsx electron/main/index.ts
```

---

## Before Any Refactor

1. Run verification commands above
2. Note current feature count
3. After refactor, run again
4. Compare counts - should be equal or higher
5. Update this checklist with any new features

---

## Change Log

### v1.8.0
- Added: Modular build system
- Added: Auto-progress between modules
- Added: webview screenshot capture (was missing)
- Added: Post-task pipeline (snapshot, simplify, learn)
- Added: Deploy button
- Fixed: Settings persistence
