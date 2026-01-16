import { useState, useEffect, useCallback } from 'react'

interface Idea {
  id: string
  title: string
  description: string
  status: 'exploring' | 'ready' | 'promoted'
  createdAt: string
}

interface Feature {
  id: string
  title: string
  description: string
  priority: 'must-have' | 'nice-to-have'
  fromIdea?: string  // Reference to idea it came from
}

interface Entity {
  id: string
  name: string
  fields: string
  relationships: string
}

interface Screen {
  id: string
  name: string
  description: string
}

interface PRD {
  overview: { name: string; description: string; coreGoal: string; platform: 'web' | 'mobile' | 'both' }
  targetUsers: { primaryUser: string; userNeeds: string }
  ideas: Idea[]  // NEW: Ideas for brainstorming
  features: Feature[]
  dataModel: { needsDatabase: boolean; entities: Entity[] }
  screens: Screen[]
  techStack: { frontend: string; backend: string; hosting: string }
  competitors: string
  designNotes: string
}

interface Project {
  id: string
  name: string
  status: 'draft' | 'building' | 'complete'
  prd: PRD
  tasks: any[]
  deployUrl: string | null
  createdAt: string
  updatedAt: string
}

interface Props {
  project: Project
  onProjectUpdate: (project: Project) => void
  onGenerateTasks: () => void
  onImportFigma?: () => void
  apiKey?: string
  provider?: string
  model?: string
}

type ConfidenceLevel = 'red' | 'yellow' | 'green'

export default function PRDForm({ project, onProjectUpdate, onGenerateTasks, onImportFigma, apiKey, provider, model }: Props) {
  // Ensure prd has ideas array (for backward compatibility)
  const initialPrd = {
    ...project.prd,
    ideas: project.prd.ideas || []
  }
  const [prd, setPrd] = useState<PRD>(initialPrd)
  const [expandedSection, setExpandedSection] = useState<string>('overview')
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importText, setImportText] = useState('')
  const [isSuggestingDataModel, setIsSuggestingDataModel] = useState(false)

  // Parse imported markdown PRD
  // AI-powered PRD parser - handles any format
  const parseImportedPRD = async (text: string): Promise<Partial<PRD>> => {
    console.log('parseImportedPRD called, apiKey:', apiKey ? 'present' : 'missing')
    
    if (!apiKey) {
      console.log('No API key, using basic parser')
      // Fallback to basic parsing if no API key
      return basicParsePRD(text)
    }

    console.log('Using AI parser...')
    const prompt = `You are a PRD parser. Extract ALL information from this document into JSON.

IMPORTANT: Look carefully for features - they may be listed as bullet points, numbered items, or in any format. Extract EVERY feature mentioned.

INPUT DOCUMENT:
${text}

REQUIRED OUTPUT FORMAT (respond with ONLY valid JSON, no other text):
{
  "overview": {
    "name": "extracted app name",
    "description": "extracted description", 
    "coreGoal": "extracted core goal or main purpose",
    "platform": "web" or "mobile" or "both"
  },
  "targetUsers": {
    "primaryUser": "who uses this app",
    "userNeeds": "what they need"
  },
  "features": [
    {"title": "Feature 1 Name", "description": "what feature 1 does"},
    {"title": "Feature 2 Name", "description": "what feature 2 does"}
  ],
  "screens": [
    {"name": "Screen 1", "description": "what screen 1 shows"},
    {"name": "Screen 2", "description": "what screen 2 shows"}
  ],
  "dataModel": {
    "needsDatabase": true,
    "entities": [
      {"name": "Entity1", "fields": "field1, field2, field3"}
    ]
  },
  "designNotes": "any style or design notes"
}

CRITICAL INSTRUCTIONS:
1. Extract ALL features - look for bullet points, numbered lists, or sections labeled "Features"
2. Extract ALL screens - look for "Screens", "Pages", or "Views"
3. For dataModel, look for "Data Model", "Database", "Entities", or field definitions
4. Return ONLY the JSON object, no explanation or markdown
5. If features are formatted as "- Name: description" extract both parts`

    try {
      const result = await window.jett.claudeApi(
        apiKey,
        JSON.stringify([{ role: 'user', content: prompt }]),
        undefined,
        provider,
        model
      )

      console.log('Full API result:', JSON.stringify(result, null, 2).substring(0, 1000))
      console.log('API result keys:', Object.keys(result || {}))
      console.log('result.success:', result?.success)
      console.log('result.text exists:', !!result?.text)
      console.log('result.text length:', result?.text?.length)

      if (result.success && result.text) {
        console.log('AI response received, length:', result.text.length)
        console.log('Raw response:', result.text.substring(0, 500))
        
        // Clean up response - remove markdown code blocks if present
        let jsonText = result.text.trim()
        jsonText = jsonText.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '')
        
        console.log('Cleaned JSON:', jsonText.substring(0, 500))
        
        const parsed = JSON.parse(jsonText)
        console.log('Parsed result:', parsed)
        
        // Add IDs to features, screens, entities
        if (parsed.features) {
          parsed.features = parsed.features.map((f: any, i: number) => ({
            id: `feature-${Date.now()}-${i}`,
            title: f.title || '',
            description: f.description || '',
            priority: f.priority || 'must-have'
          }))
        }
        
        if (parsed.screens) {
          parsed.screens = parsed.screens.map((s: any, i: number) => ({
            id: `screen-${Date.now()}-${i}`,
            name: s.name || '',
            description: s.description || ''
          }))
        }
        
        if (parsed.dataModel?.entities) {
          parsed.dataModel.entities = parsed.dataModel.entities.map((e: any, i: number) => ({
            id: `entity-${Date.now()}-${i}`,
            name: e.name || '',
            fields: e.fields || ''
          }))
        }
        
        return parsed
      }
    } catch (error) {
      console.error('AI parse failed, falling back to basic:', error)
    }
    
    // Fallback to basic parsing
    return basicParsePRD(text)
  }

  // Basic fallback parser (no AI)
  const basicParsePRD = (text: string): Partial<PRD> => {
    const result: Partial<PRD> = {}
    
    // Try to extract name from first heading
    const nameMatch = text.match(/^#\s+([^\n]+)/m)
    const name = nameMatch?.[1]?.trim() || ''
    
    // Look for description-like content
    const descMatch = text.match(/description[:\s]*([^\n]+)/i)
    const description = descMatch?.[1]?.trim() || ''
    
    // Look for goal
    const goalMatch = text.match(/goal[:\s]*([^\n]+)/i)
    const coreGoal = goalMatch?.[1]?.trim() || ''
    
    result.overview = { name, description, coreGoal, platform: 'web' }
    result.targetUsers = { primaryUser: '', userNeeds: '' }
    result.features = []
    result.screens = []
    result.dataModel = { needsDatabase: false, entities: [] }
    
    return result
  }

  const [isImporting, setIsImporting] = useState(false)

  const handleImport = async () => {
    console.log('handleImport called')
    setIsImporting(true)
    try {
      const parsed = await parseImportedPRD(importText)
      console.log('Final parsed PRD:', parsed)
      
      const newPrd = {
        ...prd,
        overview: { ...prd.overview, ...parsed.overview },
        targetUsers: { ...prd.targetUsers, ...parsed.targetUsers },
        features: parsed.features && parsed.features.length > 0 ? parsed.features : prd.features,
        screens: parsed.screens && parsed.screens.length > 0 ? parsed.screens : prd.screens,
        dataModel: { ...prd.dataModel, ...parsed.dataModel },
        techStack: { ...prd.techStack, ...((parsed as any).techStack || {}) },
        competitors: (parsed as any).competitors || prd.competitors,
        designNotes: (parsed as any).designNotes || prd.designNotes
      }
      console.log('New PRD to save:', newPrd)
      
      setPrd(newPrd)
      savePrd(newPrd)
      setShowImportModal(false)
      setImportText('')
    } catch (error) {
      console.error('Import failed:', error)
      alert('Import failed. Please check the format and try again.')
    } finally {
      setIsImporting(false)
    }
  }

  // Auto-save with debounce
  const savePrd = useCallback(async (newPrd: PRD) => {
    await window.jett.updatePrd(project.id, newPrd)
    onProjectUpdate({ ...project, prd: newPrd, updatedAt: new Date().toISOString() })
  }, [project, onProjectUpdate])

  const updatePrd = (updates: Partial<PRD>) => {
    const newPrd = { ...prd, ...updates }
    setPrd(newPrd)
    
    // Debounced save
    if (saveTimeout) clearTimeout(saveTimeout)
    const timeout = setTimeout(() => savePrd(newPrd), 1000)
    setSaveTimeout(timeout)
  }

  // Calculate confidence score
  const calculateConfidence = (): { level: ConfidenceLevel; percent: number } => {
    let score = 0

    // Required fields (60 points)
    if (prd.overview.name && prd.overview.name !== 'Untitled') score += 5
    if (prd.overview.description) score += 20
    if (prd.overview.coreGoal) score += 15
    if (prd.overview.platform) score += 5
    if (prd.features.length >= 1 && prd.features[0]?.title) score += 15

    // Important fields (25 points)
    if (prd.targetUsers.primaryUser) score += 10
    if (prd.targetUsers.userNeeds) score += 5
    if (prd.designNotes) score += 10

    // Bonus fields (15 points)
    if (prd.features.length >= 3) score += 5
    if (prd.screens.length >= 1) score += 5
    if (prd.competitors) score += 5

    const percent = Math.min(100, score)
    const level: ConfidenceLevel = percent < 50 ? 'red' : percent < 75 ? 'yellow' : 'green'
    return { level, percent }
  }

  const confidence = calculateConfidence()

  const getConfidenceColor = () => {
    switch (confidence.level) {
      case 'red': return 'bg-red-500'
      case 'yellow': return 'bg-amber-500'
      case 'green': return 'bg-emerald-500'
    }
  }

  const getConfidenceEmoji = () => {
    switch (confidence.level) {
      case 'red': return '🔴'
      case 'yellow': return '🟡'
      case 'green': return '🟢'
    }
  }

  // Section components
  const SectionHeader = ({ id, title, emoji, isComplete }: { id: string; title: string; emoji: string; isComplete: boolean }) => (
    <button
      onClick={() => setExpandedSection(expandedSection === id ? '' : id)}
      className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors ${
        expandedSection === id ? 'bg-[var(--bg-tertiary)]' : 'bg-[var(--bg-secondary)] hover:bg-slate-750'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{emoji}</span>
        <span className="font-medium text-[var(--text-primary)]">{title}</span>
        {isComplete && <span className="text-emerald-400">✓</span>}
      </div>
      <span className="text-[var(--text-secondary)]">{expandedSection === id ? '▼' : '▶'}</span>
    </button>
  )

  // Add idea
  const addIdea = () => {
    const newIdea: Idea = {
      id: `idea-${Date.now()}`,
      title: '',
      description: '',
      status: 'exploring',
      createdAt: new Date().toISOString()
    }
    updatePrd({ ideas: [...(prd.ideas || []), newIdea] })
  }

  const updateIdea = (id: string, updates: Partial<Idea>) => {
    updatePrd({
      ideas: (prd.ideas || []).map(i => i.id === id ? { ...i, ...updates } : i)
    })
  }

  const removeIdea = (id: string) => {
    updatePrd({ ideas: (prd.ideas || []).filter(i => i.id !== id) })
  }

  const promoteIdeaToFeature = (idea: Idea) => {
    // Create feature from idea
    const newFeature: Feature = {
      id: `feature-${Date.now()}`,
      title: idea.title,
      description: idea.description,
      priority: 'must-have',
      fromIdea: idea.id
    }
    // Update idea status and add feature
    updatePrd({
      ideas: (prd.ideas || []).map(i => i.id === idea.id ? { ...i, status: 'promoted' as const } : i),
      features: [...prd.features, newFeature]
    })
  }

  // Add feature
  const addFeature = () => {
    const newFeature: Feature = {
      id: `feature-${Date.now()}`,
      title: '',
      description: '',
      priority: 'must-have'
    }
    updatePrd({ features: [...prd.features, newFeature] })
  }

  const updateFeature = (id: string, updates: Partial<Feature>) => {
    updatePrd({
      features: prd.features.map(f => f.id === id ? { ...f, ...updates } : f)
    })
  }

  const removeFeature = (id: string) => {
    updatePrd({ features: prd.features.filter(f => f.id !== id) })
  }

  // Add screen
  const addScreen = () => {
    const newScreen: Screen = {
      id: `screen-${Date.now()}`,
      name: '',
      description: ''
    }
    updatePrd({ screens: [...prd.screens, newScreen] })
  }

  const updateScreen = (id: string, updates: Partial<Screen>) => {
    updatePrd({
      screens: prd.screens.map(s => s.id === id ? { ...s, ...updates } : s)
    })
  }

  const removeScreen = (id: string) => {
    updatePrd({ screens: prd.screens.filter(s => s.id !== id) })
  }

  // Add entity
  const addEntity = () => {
    const newEntity: Entity = {
      id: `entity-${Date.now()}`,
      name: '',
      fields: '',
      relationships: ''
    }
    updatePrd({
      dataModel: { ...prd.dataModel, entities: [...prd.dataModel.entities, newEntity] }
    })
  }

  const updateEntity = (id: string, updates: Partial<Entity>) => {
    updatePrd({
      dataModel: {
        ...prd.dataModel,
        entities: prd.dataModel.entities.map(e => e.id === id ? { ...e, ...updates } : e)
      }
    })
  }

  const removeEntity = (id: string) => {
    updatePrd({
      dataModel: {
        ...prd.dataModel,
        entities: prd.dataModel.entities.filter(e => e.id !== id)
      }
    })
  }

  const suggestDataModel = async () => {
    if (!apiKey) {
      alert('Please set your API key in Settings first')
      return
    }

    setIsSuggestingDataModel(true)

    try {
      const prdContext = `
App: ${prd.overview.name}
Description: ${prd.overview.description}
Core Goal: ${prd.overview.coreGoal}

Features:
${prd.features.map(f => `- ${f.title}: ${f.description}`).join('\n')}

Screens:
${prd.screens.map(s => `- ${s.name}: ${s.description}`).join('\n')}
`

      const prompt = `Analyze this app PRD and suggest what data needs to be stored.

${prdContext}

Respond in this exact format:
---DATAMODEL-START---
NEEDS_DATABASE: true or false
ENTITIES:
- Name: EntityName
  Fields: field1, field2, field3
- Name: AnotherEntity
  Fields: field1, field2
---DATAMODEL-END---

Only suggest entities if the app actually needs to persist data. Be concise with field names.`

      const result = await window.jett.claudeApi(
        apiKey,
        JSON.stringify([{ role: 'user', content: prompt }]),
        undefined,
        provider,
        model
      )

      if (result.success && result.text) {
        const dataModelMatch = result.text.match(/---DATAMODEL-START---([\s\S]*?)---DATAMODEL-END---/)
        if (dataModelMatch) {
          const content = dataModelMatch[1]
          
          // Parse NEEDS_DATABASE
          const needsDb = content.includes('NEEDS_DATABASE: true')
          
          // Parse entities
          const entityRegex = /- Name: ([^\n]+)\n\s*Fields: ([^\n]+)/g
          const entities: Entity[] = []
          let match
          while ((match = entityRegex.exec(content)) !== null) {
            entities.push({
              id: `entity-${Date.now()}-${entities.length}`,
              name: match[1].trim(),
              fields: match[2].trim(),
              relationships: ''
            })
          }

          updatePrd({
            dataModel: {
              needsDatabase: needsDb,
              entities: entities
            }
          })
        }
      }
    } catch (error) {
      console.error('Error suggesting data model:', error)
    } finally {
      setIsSuggestingDataModel(false)
    }
  }

  return (
    <div className="h-full flex">
      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] rounded-xl p-6 w-[600px] max-h-[80vh] flex flex-col">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Import PRD</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Paste your PRD document below. Use the Jett PRD Template format for best results.
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste your PRD markdown here..."
              className="flex-1 min-h-[300px] bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg p-4 text-[var(--text-primary)] text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => { setShowImportModal(false); setImportText('') }}
                disabled={isImporting}
                className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importText.trim() || isImporting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-[var(--bg-tertiary)] disabled:text-[var(--text-tertiary)] text-[var(--text-primary)] rounded-lg transition-colors flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Parsing...
                  </>
                ) : (
                  'Import'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main form */}
      <div className="flex-1 overflow-auto p-6">
        {/* Import/Template buttons */}
        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={() => {
              const template = `# [App Name]

## Overview

**Name:** [Your app name]
**Description:** [Describe your app in 1-2 sentences. What does it do? What problem does it solve?]
**Core Goal:** [The main thing users will accomplish with this app]
**Platform:** Web | Mobile | Both

## Target Users

**Primary User:** [Who is this app for? e.g., "Freelance designers who need to track projects"]
**User Needs:** [What do they need? e.g., "Quick task entry, mobile access, simple interface"]

## Features

List your app's features. Each feature should have a name and description.

- [Feature Name]: [What it does and why users need it]
- [Feature Name]: [What it does and why users need it]
- [Feature Name]: [What it does and why users need it]
- [Feature Name]: [What it does and why users need it]

## Screens

List the main screens/pages in your app.

- [Screen Name]: [What users see and do on this screen]
- [Screen Name]: [What users see and do on this screen]
- [Screen Name]: [What users see and do on this screen]

## Data Model

**Needs Database:** Yes | No

If your app stores data, list what you're storing:

- [Entity Name]: [fields like id, name, email, createdAt, etc.]
- [Entity Name]: [fields like id, title, status, userId, etc.]

## Design Notes

[Any style preferences - colors, themes, inspirations, mood/vibe]
[e.g., "Clean and minimal, inspired by Notion. Dark mode. Purple accents."]

---

## Example: Task Manager

**Name:** TaskFlow
**Description:** A simple task management app for freelancers who want to track daily work without complexity.
**Core Goal:** Let users create, complete, and organize tasks quickly.
**Platform:** Both

**Primary User:** Freelance designers and developers
**User Needs:** Quick task entry, mobile-friendly, no learning curve

**Features:**
- Create Tasks: Users can add new tasks with title and optional due date
- Mark Complete: Users can check off tasks when done
- Filter by Status: Filter to see only incomplete tasks
- Categories: Organize tasks into projects or categories

**Screens:**
- Task List: Main view showing all tasks with filters
- Add Task: Modal or screen to create new task
- Settings: User preferences and account

**Data Model:**
- Task: id, title, description, status, dueDate, categoryId, createdAt
- Category: id, name, color

**Design Notes:** Minimal, fast, mobile-first. Light/dark mode. Blue accent color.
`
              const blob = new Blob([template], { type: 'text/markdown' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = 'jett-prd-template.md'
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors flex items-center gap-2"
          >
            📄 Download Template
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors flex items-center gap-2"
          >
            📥 Import PRD
          </button>
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Overview Section */}
          <div>
            <SectionHeader 
              id="overview" 
              title="Overview" 
              emoji="📋" 
              isComplete={!!(prd.overview.name && prd.overview.description && prd.overview.coreGoal)}
            />
            {expandedSection === 'overview' && (
              <div className="mt-2 p-4 bg-[var(--bg-secondary)] rounded-lg space-y-4">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">App Name *</label>
                  <input
                    type="text"
                    value={prd.overview.name}
                    onChange={e => updatePrd({ overview: { ...prd.overview, name: e.target.value } })}
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                    placeholder="My App"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">Description *</label>
                  <textarea
                    value={prd.overview.description}
                    onChange={e => updatePrd({ overview: { ...prd.overview, description: e.target.value } })}
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 min-h-[80px]"
                    placeholder="Describe your app in 1-2 sentences..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">Core Goal *</label>
                  <input
                    type="text"
                    value={prd.overview.coreGoal}
                    onChange={e => updatePrd({ overview: { ...prd.overview, coreGoal: e.target.value } })}
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                    placeholder="The main thing users will accomplish..."
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-2">Platform *</label>
                  <div className="flex gap-2">
                    {(['web', 'mobile', 'both'] as const).map(platform => (
                      <button
                        key={platform}
                        onClick={() => updatePrd({ overview: { ...prd.overview, platform } })}
                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all border ${
                          prd.overview.platform === platform
                            ? 'bg-indigo-600 border-indigo-500 text-[var(--text-primary)]'
                            : 'bg-[var(--bg-primary)] border-[var(--border-secondary)] text-[var(--text-secondary)] hover:border-slate-500'
                        }`}
                      >
                        {platform === 'web' && '🖥️ Web'}
                        {platform === 'mobile' && '📱 Mobile'}
                        {platform === 'both' && '🔄 Both'}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--text-tertiary)] mt-2">
                    {prd.overview.platform === 'web' && 'React app deployed to Vercel'}
                    {prd.overview.platform === 'mobile' && 'React Native app with Expo'}
                    {prd.overview.platform === 'both' && 'Responsive web app (mobile-friendly)'}
                    {!prd.overview.platform && 'Choose where your app will run'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Target Users Section */}
          <div>
            <SectionHeader 
              id="targetUsers" 
              title="Target Users" 
              emoji="👤" 
              isComplete={!!(prd.targetUsers.primaryUser)}
            />
            {expandedSection === 'targetUsers' && (
              <div className="mt-2 p-4 bg-[var(--bg-secondary)] rounded-lg space-y-4">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">Primary User</label>
                  <input
                    type="text"
                    value={prd.targetUsers.primaryUser}
                    onChange={e => updatePrd({ targetUsers: { ...prd.targetUsers, primaryUser: e.target.value } })}
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                    placeholder="e.g., Freelance designers"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">User Needs</label>
                  <textarea
                    value={prd.targetUsers.userNeeds}
                    onChange={e => updatePrd({ targetUsers: { ...prd.targetUsers, userNeeds: e.target.value } })}
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 min-h-[60px]"
                    placeholder="What do they need?"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Features Section */}
          <div>
            <SectionHeader 
              id="features" 
              title="Features" 
              emoji="✨" 
              isComplete={prd.features.length >= 1 && prd.features.some(f => f.title)}
            />
            {expandedSection === 'features' && (
              <div className="mt-2 p-4 bg-[var(--bg-secondary)] rounded-lg space-y-3">
                {prd.features.length === 0 && (
                  <p className="text-sm text-[var(--text-tertiary)] mb-3">
                    No features yet. Add ideas above and promote them, or add features directly.
                  </p>
                )}
                {prd.features.map((feature, idx) => (
                  <div key={feature.id} className={`p-3 bg-[var(--bg-primary)] rounded-lg border ${feature.fromIdea ? 'border-indigo-500/30' : 'border-[var(--border-primary)]'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[var(--text-secondary)]">Feature {idx + 1}</span>
                        {feature.fromIdea && (
                          <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded">
                            from idea
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeFeature(feature.id)}
                        className="text-[var(--text-tertiary)] hover:text-red-400 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={feature.title}
                      onChange={e => updateFeature(feature.id, { title: e.target.value })}
                      className="w-full px-3 py-2 mb-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                      placeholder="Feature title"
                    />
                    <textarea
                      value={feature.description}
                      onChange={e => updateFeature(feature.id, { description: e.target.value })}
                      className="w-full px-3 py-2 mb-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 min-h-[40px] text-sm"
                      placeholder="Description..."
                    />
                    <select
                      value={feature.priority}
                      onChange={e => updateFeature(feature.id, { priority: e.target.value as 'must-have' | 'nice-to-have' })}
                      className="px-2 py-1 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded text-sm text-[var(--text-primary)]"
                    >
                      <option value="must-have">Must-have</option>
                      <option value="nice-to-have">Nice-to-have</option>
                    </select>
                  </div>
                ))}
                <button
                  onClick={addFeature}
                  className="w-full py-2 border border-dashed border-[var(--border-secondary)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-slate-500 transition-colors"
                >
                  + Add Feature
                </button>
              </div>
            )}
          </div>

          {/* Screens Section */}
          <div>
            <SectionHeader 
              id="screens" 
              title="Screens" 
              emoji="📱" 
              isComplete={prd.screens.length >= 1 && prd.screens.some(s => s.name)}
            />
            {expandedSection === 'screens' && (
              <div className="mt-2 p-4 bg-[var(--bg-secondary)] rounded-lg space-y-3">
                {prd.screens.map((screen, idx) => (
                  <div key={screen.id} className="p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-primary)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[var(--text-secondary)]">Screen {idx + 1}</span>
                      <button
                        onClick={() => removeScreen(screen.id)}
                        className="text-[var(--text-tertiary)] hover:text-red-400 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      value={screen.name}
                      onChange={e => updateScreen(screen.id, { name: e.target.value })}
                      className="w-full px-3 py-2 mb-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                      placeholder="Screen name"
                    />
                    <textarea
                      value={screen.description}
                      onChange={e => updateScreen(screen.id, { description: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 min-h-[40px] text-sm"
                      placeholder="What's on this screen?"
                    />
                  </div>
                ))}
                <button
                  onClick={addScreen}
                  className="w-full py-2 border border-dashed border-[var(--border-secondary)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-slate-500 transition-colors"
                >
                  + Add Screen
                </button>
              </div>
            )}
          </div>

          {/* Data Model Section */}
          <div>
            <SectionHeader 
              id="dataModel" 
              title="Data Model" 
              emoji="🗄️" 
              isComplete={!prd.dataModel.needsDatabase || prd.dataModel.entities.length >= 1}
            />
            {expandedSection === 'dataModel' && (
              <div className="mt-2 p-4 bg-[var(--bg-secondary)] rounded-lg space-y-4">
                {/* Suggest Button */}
                <button
                  onClick={suggestDataModel}
                  disabled={isSuggestingDataModel || !prd.features.length}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-[var(--bg-tertiary)] disabled:text-[var(--text-tertiary)] text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isSuggestingDataModel ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Analyzing PRD...
                    </>
                  ) : (
                    <>✨ Suggest Data Model</>
                  )}
                </button>
                {!prd.features.length && (
                  <p className="text-xs text-[var(--text-tertiary)] text-center">Add features first to get suggestions</p>
                )}

                <div className="border-t border-[var(--border-primary)] pt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prd.dataModel.needsDatabase}
                      onChange={e => updatePrd({ dataModel: { ...prd.dataModel, needsDatabase: e.target.checked } })}
                      className="w-4 h-4 rounded bg-[var(--bg-tertiary)] border-[var(--border-secondary)]"
                    />
                    <span className="text-[var(--text-primary)]">This app needs to save data</span>
                  </label>
                </div>
                
                {prd.dataModel.needsDatabase && (
                  <div className="space-y-3">
                    {prd.dataModel.entities.map((entity, idx) => (
                      <div key={entity.id} className="p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-primary)]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-[var(--text-secondary)]">Data Type {idx + 1}</span>
                          <button
                            onClick={() => removeEntity(entity.id)}
                            className="text-[var(--text-tertiary)] hover:text-red-400 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                        <input
                          type="text"
                          value={entity.name}
                          onChange={e => updateEntity(entity.id, { name: e.target.value })}
                          className="w-full px-3 py-2 mb-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                          placeholder="Name (e.g., User, Task, Post)"
                        />
                        <input
                          type="text"
                          value={entity.fields}
                          onChange={e => updateEntity(entity.id, { fields: e.target.value })}
                          className="w-full px-3 py-2 mb-2 bg-[var(--bg-secondary)] border border-[var(--border-secondary)] rounded text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 text-sm"
                          placeholder="Fields: id, title, description, createdAt"
                        />
                      </div>
                    ))}
                    <button
                      onClick={addEntity}
                      className="w-full py-2 border border-dashed border-[var(--border-secondary)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-slate-500 transition-colors"
                    >
                      + Add Data Type
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tech Stack Section */}
          <div>
            <SectionHeader 
              id="techStack" 
              title="Tech Stack" 
              emoji="⚙️" 
              isComplete={true}
            />
            {expandedSection === 'techStack' && (
              <div className="mt-2 p-4 bg-[var(--bg-secondary)] rounded-lg space-y-4">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">Frontend</label>
                  <select
                    value={prd.techStack.frontend}
                    onChange={e => updatePrd({ techStack: { ...prd.techStack, frontend: e.target.value } })}
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-lg text-[var(--text-primary)]"
                  >
                    <option>React + Vite</option>
                    <option>React + Next.js</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">Backend</label>
                  <select
                    value={prd.techStack.backend}
                    onChange={e => updatePrd({ techStack: { ...prd.techStack, backend: e.target.value } })}
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-lg text-[var(--text-primary)]"
                  >
                    <option>None</option>
                    <option>Supabase</option>
                    <option>Firebase</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">Hosting</label>
                  <select
                    value={prd.techStack.hosting}
                    onChange={e => updatePrd({ techStack: { ...prd.techStack, hosting: e.target.value } })}
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-lg text-[var(--text-primary)]"
                  >
                    <option>Vercel</option>
                    <option>Netlify</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Competitors Section */}
          <div>
            <SectionHeader 
              id="competitors" 
              title="Competitors & Inspiration" 
              emoji="🔍" 
              isComplete={!!prd.competitors}
            />
            {expandedSection === 'competitors' && (
              <div className="mt-2 p-4 bg-[var(--bg-secondary)] rounded-lg">
                <textarea
                  value={prd.competitors}
                  onChange={e => updatePrd({ competitors: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 min-h-[80px]"
                  placeholder="Similar apps or design inspiration..."
                />
              </div>
            )}
          </div>

          {/* Design Notes Section */}
          <div>
            <SectionHeader 
              id="designNotes" 
              title="Design Notes" 
              emoji="🎨" 
              isComplete={!!prd.designNotes}
            />
            {expandedSection === 'designNotes' && (
              <div className="mt-2 p-4 bg-[var(--bg-secondary)] rounded-lg">
                <textarea
                  value={prd.designNotes}
                  onChange={e => updatePrd({ designNotes: e.target.value })}
                  className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-secondary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 min-h-[80px]"
                  placeholder="Colors, style, layout preferences..."
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar - Confidence Score */}
      <div className="w-72 bg-[var(--bg-secondary)] border-l border-[var(--border-primary)] p-4 flex flex-col">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">PRD Readiness</h3>
        
        {/* Score display */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">{getConfidenceEmoji()}</span>
            <span className="text-2xl font-bold text-[var(--text-primary)]">{confidence.percent}%</span>
          </div>
          <div className="h-3 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
            <div 
              className={`h-full ${getConfidenceColor()} transition-all duration-300`}
              style={{ width: `${confidence.percent}%` }}
            />
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            {confidence.level === 'red' && 'Fill in required fields to continue'}
            {confidence.level === 'yellow' && 'Good enough to start building'}
            {confidence.level === 'green' && 'Great! Your PRD is comprehensive'}
          </p>
        </div>

        {/* Checklist */}
        <div className="flex-1 space-y-2 text-sm">
          <div className={`flex items-center gap-2 ${prd.overview.name && prd.overview.description && prd.overview.coreGoal ? 'text-emerald-400' : 'text-[var(--text-secondary)]'}`}>
            {prd.overview.name && prd.overview.description && prd.overview.coreGoal ? '✓' : '○'} Overview complete
          </div>
          <div className={`flex items-center gap-2 ${prd.features.length >= 1 ? 'text-emerald-400' : 'text-[var(--text-secondary)]'}`}>
            {prd.features.length >= 1 ? '✓' : '○'} At least 1 feature
          </div>
          <div className={`flex items-center gap-2 ${prd.targetUsers.primaryUser ? 'text-emerald-400' : 'text-[var(--text-secondary)]'}`}>
            {prd.targetUsers.primaryUser ? '✓' : '○'} Target users defined
          </div>
          <div className={`flex items-center gap-2 ${prd.designNotes ? 'text-emerald-400' : 'text-[var(--text-secondary)]'}`}>
            {prd.designNotes ? '✓' : '○'} Design notes added
          </div>
          <div className={`flex items-center gap-2 text-[var(--text-tertiary)]`}>
            {prd.screens.length >= 1 ? '✓' : '○'} Screens (optional)
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={onGenerateTasks}
          disabled={confidence.level === 'red'}
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            confidence.level === 'red'
              ? 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 text-[var(--text-primary)]'
          }`}
        >
          🚀 Generate Tasks
        </button>
        
        {confidence.level === 'red' && (
          <p className="text-xs text-[var(--text-tertiary)] mt-2 text-center">
            Complete required fields first
          </p>
        )}

        {/* Import from Figma */}
        {onImportFigma && (
          <button
            onClick={onImportFigma}
            className="w-full mt-3 py-2.5 rounded-lg font-medium transition-colors bg-[var(--bg-tertiary)] hover:bg-slate-600 text-[var(--text-primary)] flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 38 57" fill="none">
              <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#1ABCFE"/>
              <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83"/>
              <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262"/>
              <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E"/>
              <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF"/>
            </svg>
            Import from Figma
          </button>
        )}
      </div>
    </div>
  )
}
