/**
 * BrainstormView - Chat-Driven PRD Assembly
 * 
 * A conversational interface that helps users brainstorm their ideas
 * while automatically capturing and organizing insights into PRD sections.
 * 
 * The AI acts as a mentor, asking guiding questions and extracting
 * structured data from natural conversation.
 * 
 * v1.7.2 - Capture Extraction Modal
 * - AI responds naturally without inline tags
 * - Second pass extracts captures as JSON
 * - User reviews and selects which captures to add
 */

import { useState, useRef, useEffect } from 'react'
import { 
  IconLightbulb, IconPlus, IconRocket, IconTrash, 
  IconSparkles, IconClock, IconDocument, IconChart, IconCog,
  IconNote, IconCheck, IconChevronRight
} from './Icons'

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
  pushed?: boolean
}

interface ExtractedCapture extends PRDCapture {
  selected: boolean
  action?: 'add' | 'update'
}

interface Idea {
  id: string
  title: string
  description: string
  tags: string[]
  chat: ChatMessage[]
  prdCaptures: {
    overview: PRDCapture[]
    users: PRDCapture[]
    features: PRDCapture[]
    screens: PRDCapture[]
    moodBoard: PRDCapture[]
    data: PRDCapture[]
    techStack: PRDCapture[]
    competitors: PRDCapture[]
    design: PRDCapture[]
  }
  createdAt: string
  updatedAt: string
  status: 'raw' | 'chatting' | 'ready' | 'promoted'
  projectId?: string
}

interface Project {
  id: string
  name: string
  status: string
  prd: any
}

interface BrainstormViewProps {
  ideas: Idea[]
  onIdeasUpdate: (ideas: Idea[]) => void
  onPromoteToProject: (idea: Idea) => void
  onPushCapture?: (section: string, content: string) => void
  currentProject?: Project | null
  projects?: Project[]
  onProjectSelect?: (projectId: string) => void
  apiKey: string
  provider: string
  model: string
  selectedIdeaId: string | null
  onSelectedIdeaIdChange: (id: string | null) => void
}

const TAG_SUGGESTIONS = [
  'AI', 'SaaS', 'B2B', 'B2C', 'Mobile', 'Web', 'API', 
  'Productivity', 'Health', 'Finance', 'Education', 'Social',
  'E-commerce', 'Gaming', 'Developer Tools', 'Analytics'
]

const PRD_SECTIONS = [
  { key: 'overview', label: 'Overview', icon: IconDocument },
  { key: 'users', label: 'Target Users', icon: IconChart },
  { key: 'features', label: 'Features', icon: IconSparkles },
  { key: 'screens', label: 'Screens', icon: IconNote },
  { key: 'moodBoard', label: 'Mood Board', icon: IconLightbulb },
  { key: 'data', label: 'Data Model', icon: IconCog },
  { key: 'techStack', label: 'Tech Stack', icon: IconCog },
  { key: 'competitors', label: 'Competitors', icon: IconChart },
  { key: 'design', label: 'Design Notes', icon: IconLightbulb },
] as const

// Migrate legacy idea to new format - ensures ALL fields exist
function migrateIdea(idea: any): Idea {
  // Default prdCaptures structure - always ensures all keys exist
  const defaultCaptures = {
    overview: [],
    users: [],
    features: [],
    screens: [],
    moodBoard: [],
    data: [],
    techStack: [],
    competitors: [],
    design: []
  }
  
  // Merge existing captures with defaults (fills in missing keys)
  const existingCaptures = idea.prdCaptures || {}
  const mergedCaptures = {
    ...defaultCaptures,
    ...existingCaptures
  }
  
  // For truly legacy ideas without prdCaptures, seed overview from description
  if (!idea.prdCaptures && idea.description) {
    mergedCaptures.overview = [{
      id: `capture-${Date.now()}`,
      section: 'overview',
      content: idea.description,
      timestamp: idea.createdAt
    }]
  }
  
  return {
    id: idea.id,
    title: idea.title,
    description: idea.description,
    tags: idea.tags || [],
    chat: idea.chat || [],
    prdCaptures: mergedCaptures,
    createdAt: idea.createdAt,
    updatedAt: idea.updatedAt,
    status: idea.status === 'researching' ? 'chatting' : (idea.status as any),
    projectId: idea.projectId
  }
}

// Detect if input is a bulk PRD or substantial content
function isBulkInput(text: string): boolean {
  const charThreshold = 200  // Lowered from 300
  const hasStructure = /##|features|screens|users|data|design|overview|goal|problem/i.test(text)
  const isBulk = text.length > charThreshold || hasStructure
  console.log(`isBulkInput check: length=${text.length}, hasStructure=${hasStructure}, result=${isBulk}`)
  return isBulk
}

// Strip any existing [CAPTURE:...] tags from content
function stripCaptureTags(text: string): string {
  return text.replace(/\[CAPTURE:[^\]]+\]/g, '').trim()
}

export default function BrainstormView({ 
  ideas: rawIdeas, 
  onIdeasUpdate, 
  onPromoteToProject,
  onPushCapture,
  currentProject,
  projects,
  onProjectSelect,
  apiKey,
  provider,
  model,
  selectedIdeaId,
  onSelectedIdeaIdChange
}: BrainstormViewProps) {
  // Filter ideas by current project
  const allIdeas = rawIdeas.map(migrateIdea)
  const ideas = currentProject 
    ? allIdeas.filter(i => i.projectId === currentProject.id)
    : allIdeas
  
  const [showNewIdea, setShowNewIdea] = useState(false)
  const [newIdeaTitle, setNewIdeaTitle] = useState('')
  const [newIdeaDescription, setNewIdeaDescription] = useState('')
  const [newIdeaTags, setNewIdeaTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'status'>('newest')
  
  // Chat state
  const [chatInput, setChatInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  
  // Inline edit state
  const [editingCaptureId, setEditingCaptureId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')

  // === NEW: Extraction modal state ===
  const [showExtractionModal, setShowExtractionModal] = useState(false)
  const [extractedCaptures, setExtractedCaptures] = useState<ExtractedCapture[]>([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [lastBulkContent, setLastBulkContent] = useState<string | null>(null) // Track for manual extraction

  const selectedIdea = ideas.find(i => i.id === selectedIdeaId)

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedIdea?.chat.length])

  // Filter and sort ideas
  const filteredIdeas = ideas
    .filter(idea => !filterTag || idea.tags.includes(filterTag))
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'status':
          const statusOrder = { raw: 0, chatting: 1, ready: 2, promoted: 3 }
          return statusOrder[a.status] - statusOrder[b.status]
        default:
          return 0
      }
    })

  const allTags = [...new Set(ideas.flatMap(i => i.tags))]

  // Add new idea
  const handleAddIdea = () => {
    if (!newIdeaTitle.trim()) return

    console.log('Creating new idea:', newIdeaTitle.trim())
    
    const newIdea: Idea = {
      id: `idea-${Date.now()}`,
      title: newIdeaTitle.trim(),
      description: newIdeaDescription.trim(),
      tags: newIdeaTags,
      chat: [],
      prdCaptures: {
        overview: newIdeaDescription.trim() ? [{
          id: `capture-${Date.now()}`,
          section: 'overview',
          content: newIdeaDescription.trim(),
          timestamp: new Date().toISOString()
        }] : [],
        features: [],
        users: [],
        screens: [],
        data: [],
        design: []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'raw',
      projectId: currentProject?.id
    }

    console.log('New idea created with projectId:', newIdea.projectId)
    
    const updatedIdeas = [newIdea, ...allIdeas]
    onIdeasUpdate(updatedIdeas)
    setNewIdeaTitle('')
    setNewIdeaDescription('')
    setNewIdeaTags([])
    setShowNewIdea(false)
    onSelectedIdeaIdChange(newIdea.id)
    
    console.log('Idea added, starting conversation in 500ms...')
    setTimeout(() => startConversation(newIdea, updatedIdeas), 500)
  }

  // Start conversation with AI greeting
  const startConversation = async (idea: Idea, currentIdeas?: Idea[]) => {
    if (!apiKey) {
      console.log('No API key set - skipping AI conversation start')
      return
    }
    
    console.log('Starting conversation for idea:', idea.title)
    setIsThinking(true)
    
    // Check if description is substantial enough to extract from
    const hasBulkContent = idea.description && isBulkInput(idea.description)
    
    const systemPrompt = `You are a friendly product mentor helping capture ideas for "${idea.title}".

${idea.description ? `The user provided this description:\n"${idea.description}"` : 'No description yet.'}

Instructions:
1. Give warm, encouraging feedback (2-3 sentences)
2. ${idea.description ? 'Acknowledge what they shared and highlight the strongest aspects' : 'Ask what problem they want to solve'}
3. ${hasBulkContent ? 'Note that this looks comprehensive and you can help extract the key details' : 'Ask a follow-up question to learn more'}

Keep it conversational and supportive. Do NOT use any special formatting tags.`

    try {
      console.log('Calling Claude API...')
      const result = await window.jett.claudeApi(
        apiKey,
        JSON.stringify([{ role: 'user', content: systemPrompt }]),
        undefined,
        provider,
        model
      )
      
      console.log('API result:', result)

      if (result.success && result.text) {
        const aiMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: result.text,
          timestamp: new Date().toISOString()
        }

        const ideasToUpdate = currentIdeas || allIdeas
        const updatedIdeas = ideasToUpdate.map(i => 
          i.id === idea.id 
            ? { 
                ...i, 
                chat: [aiMessage],
                status: 'chatting' as const,
                updatedAt: new Date().toISOString()
              }
            : i
        )
        onIdeasUpdate(updatedIdeas)
        
        // Save bulk content for manual extraction (user clicks Capture button)
        if (hasBulkContent) {
          console.log('Bulk content detected - user can capture manually when ready')
          setLastBulkContent(idea.description)
        }
      } else if (result.error) {
        console.error('API error:', result.error)
      }
    } catch (error) {
      console.error('Failed to start conversation:', error)
    } finally {
      setIsThinking(false)
    }
  }

  // === NEW: Extract captures from content ===
  const extractCapturesFromContent = async (content: string, ideaId: string, currentIdeas?: Idea[]) => {
    if (!apiKey || !content) return
    
    // Strip any existing capture tags to avoid confusion
    const cleanContent = stripCaptureTags(content)
    
    console.log('Extracting captures from content...')
    console.log('Content length:', cleanContent.length)
    setIsExtracting(true)
    
    // Get existing captures for deduplication
    const ideasToCheck = currentIdeas || allIdeas
    const ideaToCheck = ideasToCheck.find(i => i.id === ideaId)
    const existingCaptures = ideaToCheck ? Object.entries(ideaToCheck.prdCaptures)
      .flatMap(([section, captures]) => captures.map(c => `[${section}] ${c.content}`))
      .join('\n') : ''

    const extractionPrompt = `Analyze this product description and extract structured PRD elements.

CONTENT TO ANALYZE:
${cleanContent}

${existingCaptures ? `EXISTING CAPTURES (do NOT duplicate these):
${existingCaptures}

IMPORTANT: Skip any ideas that are already captured above. Only extract NEW information.
If an existing capture could be improved/expanded, output it with "action": "update" and include the improvement.
` : ''}
Return a JSON array of extracted items. Each item must have:
- "section": one of "overview", "features", "users", "screens", "data", "design"
- "content": the extracted detail (keep it concise but complete)
- "action": "add" for new items, "update" for improving existing items (optional, defaults to "add")

Section guidelines:
- overview: High-level descriptions, goals, problem statements (2-3 items max)
- features: Specific functionality, capabilities, tools (be specific, avoid generic)
- users: User types, personas, target audience (1-3 items max)
- screens: Pages, views, UI sections, modals (be specific)
- data: Entities, models, fields, relationships
- design: Visual direction, UX patterns, accessibility notes (2-4 items max)

DEDUPLICATION RULES:
1. If the content is essentially the same as an existing capture, SKIP IT
2. If the content adds new detail to an existing capture, mark as "update"
3. Only "add" genuinely new information not covered by existing captures

Be selective and avoid redundancy. Quality over quantity.

CRITICAL: Respond with ONLY a valid JSON array. No markdown code blocks, no explanation, no preamble. Just the raw JSON array starting with [ and ending with ]`

    try {
      const result = await window.jett.claudeApi(
        apiKey,
        JSON.stringify([{ role: 'user', content: extractionPrompt }]),
        undefined,
        provider,
        model
      )
      
      console.log('Extraction API response received')
      
      if (result.success && result.text) {
        console.log('Raw extraction response:', result.text.substring(0, 200) + '...')
        
        // Parse JSON response with multiple fallback strategies
        let parsed: Array<{ section: string; content: string }> = []
        let jsonText = result.text.trim()
        
        try {
          // Strategy 1: Try direct parse
          parsed = JSON.parse(jsonText)
        } catch (e1) {
          console.log('Direct parse failed, trying cleanup...')
          
          try {
            // Strategy 2: Remove markdown code blocks
            jsonText = jsonText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
            parsed = JSON.parse(jsonText)
          } catch (e2) {
            console.log('Markdown cleanup failed, trying to find JSON array...')
            
            try {
              // Strategy 3: Find JSON array in response
              const arrayMatch = jsonText.match(/\[[\s\S]*\]/)
              if (arrayMatch) {
                parsed = JSON.parse(arrayMatch[0])
              } else {
                throw new Error('No JSON array found in response')
              }
            } catch (e3) {
              console.error('All JSON parsing strategies failed')
              console.log('Full response:', result.text)
              alert('Failed to parse extraction results. Check console for details.')
              return
            }
          }
        }
        
        // Validate and convert to ExtractedCapture format
        const validSections = ['overview', 'features', 'users', 'screens', 'data', 'design']
        const captures: ExtractedCapture[] = parsed
          .filter(item => item && typeof item === 'object' && validSections.includes(item.section) && item.content)
          .map((item, index) => ({
            id: `extract-${Date.now()}-${index}`,
            section: item.section as PRDCapture['section'],
            content: item.content.trim(),
            timestamp: new Date().toISOString(),
            selected: true
          }))
        
        console.log(`Successfully extracted ${captures.length} captures`)
        
        if (captures.length > 0) {
          setExtractedCaptures(captures)
          setShowExtractionModal(true)
        } else {
          console.log('No valid captures found in parsed response')
          alert('No captures could be extracted. The content might not have enough structured information.')
        }
      } else {
        console.error('Extraction API call failed:', result.error)
        alert('Extraction failed: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Extraction failed:', error)
      alert('Extraction failed: ' + (error as Error).message)
    } finally {
      setIsExtracting(false)
    }
  }

  // === NEW: Toggle capture selection ===
  const toggleCaptureSelection = (captureId: string) => {
    setExtractedCaptures(prev => 
      prev.map(c => c.id === captureId ? { ...c, selected: !c.selected } : c)
    )
  }

  // === NEW: Toggle all in section ===
  const toggleSectionSelection = (section: string, selected: boolean) => {
    setExtractedCaptures(prev =>
      prev.map(c => c.section === section ? { ...c, selected } : c)
    )
  }

  // === NEW: Add selected captures ===
  const handleAddSelectedCaptures = () => {
    if (!selectedIdea) return
    
    const selected = extractedCaptures.filter(c => c.selected)
    if (selected.length === 0) {
      setShowExtractionModal(false)
      return
    }
    
    // Convert to regular PRDCaptures, handling both adds and updates
    const updatedCaptures = { ...selectedIdea.prdCaptures }
    
    for (const capture of selected) {
      const newCapture: PRDCapture = {
        id: capture.id,
        section: capture.section,
        content: capture.content,
        timestamp: capture.timestamp
      }
      
      // Check if this is an update to existing capture (similar content)
      const existingIndex = updatedCaptures[capture.section].findIndex(
        existing => existing.content.toLowerCase().includes(capture.content.toLowerCase().slice(0, 30)) ||
                    capture.content.toLowerCase().includes(existing.content.toLowerCase().slice(0, 30))
      )
      
      if (existingIndex >= 0 && (capture as any).action === 'update') {
        // Replace existing with updated version
        updatedCaptures[capture.section][existingIndex] = newCapture
        console.log(`Updated existing capture in ${capture.section}`)
      } else {
        // Add as new
        updatedCaptures[capture.section] = [...updatedCaptures[capture.section], newCapture]
      }
    }
    
    const totalCaptures = Object.values(updatedCaptures).reduce((sum, arr) => sum + arr.length, 0)
    
    updateIdea(selectedIdea.id, {
      prdCaptures: updatedCaptures,
      status: totalCaptures >= 5 ? 'ready' : 'chatting'
    })
    
    setShowExtractionModal(false)
    setExtractedCaptures([])
    
    console.log(`Added ${selected.length} captures to idea`)
  }

  // === Manual capture from entire chat ===
  const handleCaptureFromChat = async () => {
    if (!selectedIdea || !apiKey || selectedIdea.chat.length === 0) return
    
    // Combine all chat messages into one block
    const chatContent = selectedIdea.chat
      .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`)
      .join('\n\n')
    
    console.log('Manual capture triggered, chat length:', chatContent.length)
    await extractCapturesFromContent(chatContent, selectedIdea.id)
  }
  
  // Send chat message
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedIdea || !apiKey || isThinking) return

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date().toISOString()
    }

    const messageContent = chatInput.trim()
    const isBulk = isBulkInput(messageContent)

    const updatedChat = [...selectedIdea.chat, userMessage]
    updateIdea(selectedIdea.id, { chat: updatedChat })
    setChatInput('')
    setIsThinking(true)

    const conversationHistory = updatedChat.map(msg => ({
      role: msg.role,
      content: msg.content
    }))

    const captureCount = Object.values(selectedIdea.prdCaptures).reduce((sum, arr) => sum + arr.length, 0)
    const missingHints = getMissingPRDHints(selectedIdea.prdCaptures)

    // Natural conversation prompt - no special tags required
    const systemPrompt = `You are a friendly product mentor helping with "${selectedIdea.title}".

Current PRD progress: ${captureCount} items captured
${missingHints ? `Areas that could use more detail: ${missingHints}` : 'Good coverage so far!'}

Instructions:
1. Read the user's message carefully
2. Give helpful, encouraging feedback (2-3 sentences)
3. ${isBulk ? 'Acknowledge this looks like substantial content you can help organize' : 'Ask a follow-up question about an area that needs more detail'}

Keep it conversational. Do NOT use any special formatting tags or brackets.`

    try {
      const result = await window.jett.claudeApi(
        apiKey,
        JSON.stringify([
          { role: 'user', content: systemPrompt },
          ...conversationHistory
        ]),
        undefined,
        provider,
        model
      )

      if (result.success && result.text) {
        const aiMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: result.text,
          timestamp: new Date().toISOString()
        }

        // Update chat with AI response
        const finalChat = [...updatedChat, aiMessage]
        updateIdea(selectedIdea.id, { chat: finalChat })
        
        // Track content but don't auto-extract - user controls when to capture
        if (isBulk) {
          console.log('Substantial content detected - available for capture')
          setLastBulkContent(messageContent)
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsThinking(false)
    }
  }

  // Get hints about missing sections
  const getMissingPRDHints = (captures: Idea['prdCaptures']): string => {
    const missing: string[] = []
    if (captures.features.length === 0) missing.push('features')
    if (captures.users.length === 0) missing.push('target users')
    if (captures.screens.length === 0) missing.push('screens/pages')
    if (captures.data.length === 0) missing.push('data model')
    return missing.join(', ')
  }

  // Tag handlers
  const handleAddTag = (tag: string) => {
    const normalizedTag = tag.trim().toLowerCase()
    if (normalizedTag && !newIdeaTags.includes(normalizedTag)) {
      setNewIdeaTags([...newIdeaTags, normalizedTag])
    }
    setTagInput('')
  }

  const handleRemoveTag = (tag: string) => {
    setNewIdeaTags(newIdeaTags.filter(t => t !== tag))
  }

  // Delete idea
  const handleDeleteIdea = (ideaId: string) => {
    if (confirm('Delete this idea?')) {
      onIdeasUpdate(allIdeas.filter(i => i.id !== ideaId))
      if (selectedIdeaId === ideaId) {
        onSelectedIdeaIdChange(null)
      }
    }
  }

  // Update idea
  const updateIdea = (ideaId: string, updates: Partial<Idea>) => {
    onIdeasUpdate(allIdeas.map(i => 
      i.id === ideaId 
        ? { ...i, ...updates, updatedAt: new Date().toISOString() }
        : i
    ))
  }

  // === CAPTURE ACTIONS ===
  
  // Edit: Start inline editing
  const handleEditCapture = (capture: PRDCapture) => {
    setEditingCaptureId(capture.id)
    setEditingContent(capture.content)
  }

  // Save inline edit
  const handleSaveEdit = (section: keyof Idea['prdCaptures'], captureId: string) => {
    if (!selectedIdea || !editingContent.trim()) return

    const updatedCaptures = {
      ...selectedIdea.prdCaptures,
      [section]: selectedIdea.prdCaptures[section].map(c =>
        c.id === captureId ? { ...c, content: editingContent.trim() } : c
      )
    }

    updateIdea(selectedIdea.id, { prdCaptures: updatedCaptures })
    setEditingCaptureId(null)
    setEditingContent('')
  }

  // Cancel inline edit
  const handleCancelEdit = () => {
    setEditingCaptureId(null)
    setEditingContent('')
  }

  // Push: Push capture to PRD
  const handlePushCapture = (capture: PRDCapture) => {
    if (onPushCapture) {
      onPushCapture(capture.section, capture.content)
      
      // Mark as pushed
      if (selectedIdea) {
        const updatedCaptures = { ...selectedIdea.prdCaptures }
        updatedCaptures[capture.section] = updatedCaptures[capture.section].map(c =>
          c.id === capture.id ? { ...c, pushed: true } : c
        )
        updateIdea(selectedIdea.id, { prdCaptures: updatedCaptures })
      }
    }
  }

  // Delete: Remove capture
  const handleDeleteCapture = (section: keyof Idea['prdCaptures'], captureId: string) => {
    if (!selectedIdea) return

    const updatedCaptures = {
      ...selectedIdea.prdCaptures,
      [section]: selectedIdea.prdCaptures[section].filter(c => c.id !== captureId)
    }

    updateIdea(selectedIdea.id, { prdCaptures: updatedCaptures })
  }

  // Promote to project OR push all captures to current project
  const handlePromote = (idea: Idea) => {
    // Count items being pushed
    const totalItems = getTotalCaptures(idea)
    
    // If we're inside a project (onPushCapture exists), add to current project
    if (onPushCapture && currentProject) {
      console.log(`📋 Pushing ${totalItems} captures to ${currentProject.name}...`)
      
      // Push each capture to the current project's PRD
      Object.entries(idea.prdCaptures).forEach(([section, captures]) => {
        (captures as PRDCapture[]).forEach(capture => {
          if (!capture.pushed) {
            onPushCapture(section, capture.content)
          }
        })
      })
      
      // Mark all captures as pushed
      const updatedCaptures = { ...idea.prdCaptures }
      Object.keys(updatedCaptures).forEach(section => {
        const key = section as keyof typeof updatedCaptures
        updatedCaptures[key] = updatedCaptures[key].map(c => ({ ...c, pushed: true }))
      })
      
      updateIdea(idea.id, { 
        prdCaptures: updatedCaptures,
        status: 'promoted' as const
      })
      
      console.log(`✅ Pushed ${totalItems} items to ${currentProject.name}'s PRD`)
      return
    }
    
    // No current project - create a new one
    const prd = {
      overview: {
        name: idea.title,
        description: idea.prdCaptures.overview.map(c => c.content).join('\n'),
        coreGoal: idea.prdCaptures.overview[0]?.content || '',
        platform: 'web'
      },
      targetUsers: {
        primaryUser: idea.prdCaptures.users.map(c => c.content).join(', '),
        userNeeds: ''
      },
      features: idea.prdCaptures.features.map((c, i) => ({
        id: c.id,
        title: c.content.split(':')[0] || c.content,
        description: c.content,
        priority: i < 3 ? 'must-have' : 'nice-to-have'
      })),
      screens: idea.prdCaptures.screens.map(c => ({
        id: c.id,
        name: c.content.split(':')[0] || c.content,
        description: c.content
      })),
      dataModel: {
        needsDatabase: idea.prdCaptures.data.length > 0,
        entities: idea.prdCaptures.data.map(c => ({
          id: c.id,
          name: c.content.split(':')[0] || c.content,
          fields: ''
        }))
      },
      designNotes: idea.prdCaptures.design.map(c => c.content).join('\n'),
      competitors: '',
      techStack: { frontend: 'React + Vite', backend: 'None', hosting: 'Vercel' }
    }

    onPromoteToProject({ ...idea, prd } as any)
    
    // Clear all captures after pushing (they're now in the PRD)
    const clearedCaptures = {
      overview: [],
      problem: [],
      users: [],
      features: [],
      screens: [],
      data: [],
      design: []
    }
    updateIdea(idea.id, { 
      prdCaptures: clearedCaptures,
      status: 'promoted' as const
    })
    
    console.log(`✅ Created new project with ${totalItems} items`)
  }

  // Status badge
  const StatusBadge = ({ status }: { status: Idea['status'] }) => {
    const config = {
      raw: { label: 'New', bg: 'var(--bg-tertiary)', color: 'var(--text-secondary)' },
      chatting: { label: 'Chatting', bg: 'var(--accent-primary-light)', color: 'var(--accent-primary)' },
      ready: { label: 'Ready', bg: 'var(--success-light)', color: 'var(--success)' },
      promoted: { label: 'Promoted', bg: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }
    }
    const { label, bg, color } = config[status]
    return (
      <span 
        className="px-2 py-0.5 text-xs font-medium rounded-full"
        style={{ background: bg, color }}
      >
        {label}
      </span>
    )
  }

  const getTotalCaptures = (idea: Idea) => {
    return Object.values(idea.prdCaptures).reduce((sum, arr) => sum + arr.length, 0)
  }

  // === NEW: Group extracted captures by section ===
  const groupedExtractions = PRD_SECTIONS.map(section => ({
    ...section,
    captures: extractedCaptures.filter(c => c.section === section.key)
  })).filter(group => group.captures.length > 0)

  const selectedCount = extractedCaptures.filter(c => c.selected).length
  const totalExtracted = extractedCaptures.length

  return (
    <div className="h-full flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Left Panel - Ideas List */}
      <div 
        className="w-80 flex-shrink-0 border-r flex flex-col"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <IconLightbulb size={18} />
                {currentProject?.name || 'Ideas'}
              </h1>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {ideas.length} idea{ideas.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setShowNewIdea(true)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1"
              style={{ background: 'var(--accent-primary)', color: 'white' }}
            >
              <IconPlus size={14} />
              New
            </button>
          </div>

          {/* Project Selector */}
          {projects && projects.length > 0 && onProjectSelect && (
            <div className="mb-3">
              <select
                value={currentProject?.id || ''}
                onChange={(e) => onProjectSelect(e.target.value)}
                className="w-full px-2 py-1.5 rounded text-sm"
                style={{ 
                  background: 'var(--bg-secondary)', 
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)'
                }}
              >
                <option value="">Select Project...</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-2">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 px-2 py-1 rounded text-sm"
              style={{ 
                background: 'var(--bg-secondary)', 
                color: 'var(--text-primary)',
                border: '1px solid var(--border-primary)'
              }}
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="status">By Status</option>
            </select>
            {allTags.length > 0 && (
              <select
                value={filterTag || ''}
                onChange={(e) => setFilterTag(e.target.value || null)}
                className="flex-1 px-2 py-1 rounded text-sm"
                style={{ 
                  background: 'var(--bg-secondary)', 
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)'
                }}
              >
                <option value="">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Ideas List */}
        <div className="flex-1 overflow-auto">
          {filteredIdeas.length === 0 ? (
            <div className="p-8 text-center">
              <IconLightbulb size={48} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                No ideas yet
              </p>
              <button
                onClick={() => setShowNewIdea(true)}
                className="text-sm"
                style={{ color: 'var(--accent-primary)' }}
              >
                Create your first idea
              </button>
            </div>
          ) : (
            filteredIdeas.map(idea => (
              <div
                key={idea.id}
                onClick={() => onSelectedIdeaIdChange(idea.id)}
                className={`p-3 border-b cursor-pointer transition-colors ${
                  selectedIdeaId === idea.id ? 'ring-2 ring-inset ring-[var(--accent-primary)]' : ''
                }`}
                style={{ 
                  borderColor: 'var(--border-primary)',
                  background: selectedIdeaId === idea.id ? 'var(--bg-secondary)' : 'transparent'
                }}
              >
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-medium text-sm truncate flex-1" style={{ color: 'var(--text-primary)' }}>
                    {idea.title}
                  </h3>
                  <StatusBadge status={idea.status} />
                </div>
                
                {idea.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {idea.tags.slice(0, 3).map(tag => (
                      <span 
                        key={tag}
                        className="px-1.5 py-0.5 text-xs rounded"
                        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {getTotalCaptures(idea)} captures
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteIdea(idea.id) }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/10"
                    style={{ color: 'var(--error)' }}
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Idea Modal */}
      {showNewIdea && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div 
            className="w-full max-w-md rounded-2xl p-6"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              New Idea
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={newIdeaTitle}
                  onChange={(e) => setNewIdeaTitle(e.target.value)}
                  placeholder="What's your app idea?"
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-primary)'
                  }}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Description (optional)
                </label>
                <textarea
                  value={newIdeaDescription}
                  onChange={(e) => setNewIdeaDescription(e.target.value)}
                  placeholder="Describe your idea, paste a PRD, or leave blank to brainstorm..."
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-primary)'
                  }}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                  Tip: Paste a full PRD and we'll extract captures automatically
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Tags
                </label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {newIdeaTags.map(tag => (
                    <span 
                      key={tag}
                      className="px-2 py-1 text-xs rounded-full flex items-center gap-1"
                      style={{ background: 'var(--accent-primary-light)', color: 'var(--accent-primary)' }}
                    >
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)}>×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagInput.trim()) {
                        e.preventDefault()
                        handleAddTag(tagInput)
                      }
                    }}
                    placeholder="Add tag..."
                    className="flex-1 px-3 py-1 rounded text-sm"
                    style={{
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-primary)'
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {TAG_SUGGESTIONS.filter(t => !newIdeaTags.includes(t.toLowerCase())).slice(0, 6).map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleAddTag(tag)}
                      className="px-2 py-0.5 text-xs rounded"
                      style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)' }}
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowNewIdea(false)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddIdea}
                disabled={!newIdeaTitle.trim()}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ background: 'var(--accent-primary)', color: 'white' }}
              >
                Create Idea
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Chat + Captures */}
      {selectedIdea ? (
        <div className="flex-1 flex">
          {/* Middle Column - Chat */}
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div 
              className="p-4 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--border-primary)' }}
            >
              <div>
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {selectedIdea.title}
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  Chat with AI to capture PRD details
                </p>
              </div>
              <div className="flex gap-2">
                {/* Capture Button */}
                <button
                  onClick={handleCaptureFromChat}
                  disabled={!apiKey || isExtracting || selectedIdea.chat.length === 0}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1"
                  style={{ background: 'var(--accent-primary)', color: 'white' }}
                  title="Scan chat for PRD content"
                >
                  {isExtracting ? (
                    <>Scanning...</>
                  ) : (
                    <><IconSparkles size={14} /> Capture</>
                  )}
                </button>
                <button
                  onClick={() => handleDeleteIdea(selectedIdea.id)}
                  className="p-2 rounded-lg"
                  style={{ color: 'var(--error)' }}
                >
                  <IconTrash size={16} />
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {selectedIdea.chat.length === 0 && !isThinking ? (
                <div className="text-center py-8">
                  <IconSparkles size={32} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {apiKey ? 'Starting conversation...' : 'Add your API key in Settings to start'}
                  </p>
                </div>
              ) : (
                selectedIdea.chat.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                        msg.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'
                      }`}
                      style={{
                        background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                        color: msg.role === 'user' ? 'white' : 'var(--text-primary)'
                      }}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              
              {isThinking && (
                <div className="flex justify-start">
                  <div 
                    className="p-3 rounded-2xl rounded-bl-md flex items-center gap-2"
                    style={{ background: 'var(--bg-secondary)' }}
                  >
                    <IconClock size={14} className="animate-spin" />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Thinking...</span>
                  </div>
                </div>
              )}

              {isExtracting && (
                <div className="flex justify-start">
                  <div 
                    className="p-3 rounded-2xl rounded-bl-md flex items-center gap-2"
                    style={{ background: 'var(--accent-primary-light)' }}
                  >
                    <IconSparkles size={14} className="animate-pulse" />
                    <span className="text-sm" style={{ color: 'var(--accent-primary)' }}>Extracting PRD details...</span>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
              <div className="flex gap-2">
                <textarea
                  placeholder={apiKey ? "Describe your idea, paste a PRD, or ask questions..." : "Add API key in Settings"}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  disabled={!apiKey || isThinking}
                  rows={2}
                  className="flex-1 px-4 py-2 rounded-xl text-sm resize-none disabled:opacity-50 placeholder:text-gray-400"
                  style={{
                    background: '#27374a',
                    color: '#f8fafc',
                    border: '1px solid var(--border-primary)'
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isThinking || !apiKey}
                  className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  style={{ background: 'var(--accent-primary)', color: 'white' }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - PRD Captures */}
          <div 
            className="w-80 flex-shrink-0 flex flex-col"
            style={{ background: 'var(--bg-secondary)' }}
          >
              <div className="p-3 border-b" style={{ borderColor: 'var(--border-primary)' }}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    PRD Captures
                  </h3>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {getTotalCaptures(selectedIdea)} items captured
                </p>
              </div>

              <div className="flex-1 overflow-auto p-2">
              {PRD_SECTIONS.map(({ key, label, icon: Icon }) => {
                  const captures = selectedIdea.prdCaptures[key as keyof Idea['prdCaptures']] || []
                  return (
                    <div key={key} className="mb-3">
                      <div className="flex items-center gap-2 mb-1 px-2">
                        <Icon size={12} />
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                          {label}
                        </span>
                        <span 
                          className="text-xs px-1.5 rounded-full"
                          style={{ 
                            background: captures.length > 0 ? 'var(--success-light)' : 'var(--bg-tertiary)',
                            color: captures.length > 0 ? 'var(--success)' : 'var(--text-tertiary)'
                          }}
                        >
                          {captures.length}
                        </span>
                      </div>
                      {captures.map(capture => (
                        <div
                          key={capture.id}
                          className="p-2 rounded text-xs mb-1 group relative"
                          style={{ 
                            background: capture.pushed ? 'var(--success-light)' : 'var(--bg-tertiary)', 
                            color: 'var(--text-secondary)',
                            border: capture.pushed ? '1px solid var(--success)' : 'none'
                          }}
                        >
                          {editingCaptureId === capture.id ? (
                            // Inline edit mode
                            <div>
                              <textarea
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                className="w-full p-2 rounded text-xs resize-none"
                                style={{
                                  background: 'var(--bg-primary)',
                                  color: 'var(--text-primary)',
                                  border: '1px solid var(--accent-primary)'
                                }}
                                rows={3}
                                autoFocus
                              />
                              <div className="flex gap-1 mt-2">
                                <button
                                  onClick={() => handleSaveEdit(key as keyof Idea['prdCaptures'], capture.id)}
                                  className="px-2 py-0.5 rounded text-xs font-medium"
                                  style={{ background: '#059669', color: 'white' }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="px-2 py-0.5 rounded text-xs"
                                  style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            // Display mode
                            <>
                              <p className="mb-2">{capture.content}</p>
                              
                              {/* Capture Actions */}
                              <div className="flex gap-1 mt-1">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleEditCapture(capture) }}
                                  className="px-2 py-0.5 rounded text-xs"
                                  style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}
                                  title="Edit this capture"
                                >
                                  Edit
                                </button>
                                {!capture.pushed && onPushCapture && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handlePushCapture(capture) }}
                                    className="px-2 py-0.5 rounded text-xs font-medium"
                                    style={{ background: '#059669', color: 'white' }}
                                    title="Push to PRD"
                                  >
                                    Push
                                  </button>
                                )}
                                {capture.pushed && (
                                  <span className="px-2 py-0.5 text-xs" style={{ color: 'var(--success)' }}>
                                    ✓ Pushed
                                  </span>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteCapture(key as keyof Idea['prdCaptures'], capture.id) }}
                                  className="px-2 py-0.5 rounded text-xs"
                                  style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                                  title="Delete capture"
                                >
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>

              {getTotalCaptures(selectedIdea) >= 3 && (
                <div className="p-3 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                  <button
                    onClick={() => handlePromote(selectedIdea)}
                    className="w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    style={{ background: '#059669', color: 'white' }}
                  >
                    <IconChevronRight size={14} />
                    Push All to PRD
                  </button>
                </div>
              )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <IconLightbulb size={64} className="mx-auto mb-4 opacity-30" />
            <h2 className="text-lg font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
              Select an idea to brainstorm
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Or create a new one to get started
            </p>
          </div>
        </div>
      )}

      {/* === NEW: Extraction Modal === */}
      {showExtractionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div 
            className="w-full max-w-2xl rounded-2xl flex flex-col max-h-[85vh]"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-primary)' }}
          >
            {/* Header */}
            <div className="p-4 border-b" style={{ borderColor: 'var(--border-primary)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <IconSparkles size={18} />
                    Extracted Captures
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Found {totalExtracted} items • {selectedCount} selected
                  </p>
                </div>
                <button
                  onClick={() => setShowExtractionModal(false)}
                  className="p-2 rounded-lg hover:bg-white/10"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Captures List */}
            <div className="flex-1 overflow-auto p-4">
              {groupedExtractions.map(({ key, label, icon: Icon, captures }) => (
                <div key={key} className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon size={14} />
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {label}
                      </span>
                      <span 
                        className="text-xs px-1.5 rounded-full"
                        style={{ background: 'var(--accent-primary-light)', color: 'var(--accent-primary)' }}
                      >
                        {captures.length}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleSectionSelection(key, true)}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ color: 'var(--accent-primary)' }}
                      >
                        Select all
                      </button>
                      <button
                        onClick={() => toggleSectionSelection(key, false)}
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                  {captures.map(capture => (
                      <label
                        key={capture.id}
                        className="flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors"
                        style={{ 
                          background: capture.selected ? 'var(--accent-primary-light)' : 'var(--bg-secondary)',
                          border: capture.selected ? '1px solid var(--accent-primary)' : '1px solid transparent'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={capture.selected}
                          onChange={() => toggleCaptureSelection(capture.id)}
                          className="mt-0.5 rounded"
                          style={{ accentColor: 'var(--accent-primary)' }}
                        />
                        <div className="flex-1">
                          <span 
                            className="text-sm"
                            style={{ color: capture.selected ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                          >
                            {capture.content}
                          </span>
                          {capture.action === 'update' && (
                            <span 
                              className="ml-2 text-xs px-1.5 py-0.5 rounded"
                              style={{ background: '#f59e0b20', color: '#f59e0b' }}
                            >
                              updates existing
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div 
              className="p-4 border-t flex items-center justify-between"
              style={{ borderColor: 'var(--border-primary)' }}
            >
              <button
                onClick={() => setShowExtractionModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
              >
                Cancel
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setExtractedCaptures(prev => prev.map(c => ({ ...c, selected: true })))
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                >
                  Select All ({totalExtracted})
                </button>
                <button
                  onClick={handleAddSelectedCaptures}
                  disabled={selectedCount === 0}
                  className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-2"
                  style={{ background: 'var(--accent-primary)', color: 'white' }}
                >
                  <IconCheck size={14} />
                  Add Selected ({selectedCount})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
