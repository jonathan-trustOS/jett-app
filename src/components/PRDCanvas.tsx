/**
 * PRDCanvas - Visual mindmap/canvas view for PRD editing
 * Works alongside PRDForm - same data, different view
 */

import { useState, useRef } from 'react'

interface Feature {
  id: string
  title: string
  description: string
  priority?: 'must' | 'should' | 'could'
}

interface Screen {
  id: string
  name: string
  description: string
  imagePath?: string
}

interface MoodBoardImage {
  id: string
  path: string
  label?: string
  createdAt: string
}

interface Entity {
  id: string
  name: string
  fields: { name: string; type: string }[]
}

interface PRD {
  overview?: {
    name?: string
    description?: string
    platform?: string
    coreGoal?: string
  }
  targetUsers?: {
    primary?: string
    needs?: string
  }
  features?: Feature[]
  screens?: Screen[]
  moodBoard?: MoodBoardImage[]
  dataModel?: Entity[]
  techStack?: {
    frontend?: string
    backend?: string
    hosting?: string
  }
  competitors?: string[]
  canvasLayout?: {
    nodes: { id: string; position: { x: number; y: number } }[]
    zoom: number
    pan: { x: number; y: number }
  }
}

interface Project {
  id: string
  name: string
  prd?: PRD
}

interface PRDCanvasProps {
  project: Project
  onProjectUpdate: (project: Project) => void
}

// Default node positions
const DEFAULT_POSITIONS: Record<string, { x: number; y: number }> = {
  project: { x: 300, y: 200 },
  features: { x: 580, y: 100 },
  screens: { x: 580, y: 320 },
  moodBoard: { x: 580, y: 500 },
  data: { x: 80, y: 80 },
  competitors: { x: 50, y: 250 },
  audience: { x: 220, y: 420 },
  stack: { x: 420, y: 50 },
}

export default function PRDCanvas({ project, onProjectUpdate }: PRDCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [draggingNode, setDraggingNode] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set())
  const [editingNode, setEditingNode] = useState<string | null>(null)
  const [editingCard, setEditingCard] = useState<{ nodeId: string; cardId: string } | null>(null)
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerNodeId, setDrawerNodeId] = useState<string | null>(null)
  const [drawerItemId, setDrawerItemId] = useState<string | null>(null)

  const prd = project.prd || {}

  // Get node position
  const getNodePosition = (nodeId: string) => {
    const saved = prd.canvasLayout?.nodes?.find(n => n.id === nodeId)
    return saved?.position || DEFAULT_POSITIONS[nodeId] || { x: 300, y: 200 }
  }

  // Save node position
  const saveNodePosition = (nodeId: string, position: { x: number; y: number }) => {
    const currentNodes = prd.canvasLayout?.nodes || []
    const idx = currentNodes.findIndex(n => n.id === nodeId)
    
    const updatedNodes = idx >= 0 
      ? currentNodes.map((n, i) => i === idx ? { ...n, position } : n)
      : [...currentNodes, { id: nodeId, position }]

    onProjectUpdate({
      ...project,
      prd: { ...prd, canvasLayout: { nodes: updatedNodes, zoom, pan } }
    })
  }

  // Update PRD
  const updatePRD = (updates: Partial<PRD>) => {
    onProjectUpdate({ ...project, prd: { ...prd, ...updates } })
  }

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target === canvasRef.current || target.classList.contains('canvas-bg')) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      setSelectedNodes(new Set())
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
    } else if (draggingNode) {
      const newX = (e.clientX - dragOffset.x - pan.x) / zoom
      const newY = (e.clientY - dragOffset.y - pan.y) / zoom
      saveNodePosition(draggingNode, { x: newX, y: newY })
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
    setDraggingNode(null)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(Math.min(Math.max(zoom * delta, 0.25), 2))
  }

  const startNodeDrag = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const pos = getNodePosition(nodeId)
    setDraggingNode(nodeId)
    setDragOffset({
      x: e.clientX - (pos.x * zoom + pan.x),
      y: e.clientY - (pos.y * zoom + pan.y)
    })
  }

  const selectNode = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newSelected = new Set(selectedNodes)
    if (e.shiftKey || e.metaKey) {
      newSelected.has(nodeId) ? newSelected.delete(nodeId) : newSelected.add(nodeId)
    } else {
      newSelected.clear()
      newSelected.add(nodeId)
    }
    setSelectedNodes(newSelected)
  }

  // Add handlers - create item and open drawer
  const addFeature = () => {
    const id = `feature-${Date.now()}`
    const newFeature: Feature = {
      id,
      title: '',
      description: '',
      priority: 'should'
    }
    updatePRD({ features: [...(prd.features || []), newFeature] })
    setDrawerNodeId('features')
    setDrawerItemId(id)
    setDrawerOpen(true)
  }

  const addScreen = () => {
    const id = `screen-${Date.now()}`
    updatePRD({ screens: [...(prd.screens || []), { id, name: '', description: '' }] })
    setDrawerNodeId('screens')
    setDrawerItemId(id)
    setDrawerOpen(true)
  }

  const addEntity = () => {
    const id = `entity-${Date.now()}`
    updatePRD({ dataModel: [...(prd.dataModel || []), { id, name: '', fields: [{ name: 'id', type: 'string' }] }] })
    setDrawerNodeId('data')
    setDrawerItemId(id)
    setDrawerOpen(true)
  }

  const addCompetitor = () => {
    const id = `comp-${Date.now()}`
    const newCompetitors = [...(prd.competitors || []), '']
    updatePRD({ competitors: newCompetitors })
    setDrawerNodeId('competitors')
    setDrawerItemId(`comp-${newCompetitors.length - 1}`)
    setDrawerOpen(true)
  }

  const addMoodBoardImage = () => {
    const id = `mood-${Date.now()}`
    const newImage: MoodBoardImage = {
      id,
      path: '',
      label: '',
      createdAt: new Date().toISOString()
    }
    updatePRD({ moodBoard: [...(prd.moodBoard || []), newImage] })
    setDrawerNodeId('moodBoard')
    setDrawerItemId(id)
    setDrawerOpen(true)
  }

  // Update handlers for drawer edits
  const updateFeature = (id: string, updates: Partial<Feature>) => {
    updatePRD({
      features: (prd.features || []).map(f => f.id === id ? { ...f, ...updates } : f)
    })
  }

  const deleteFeature = (id: string) => {
    updatePRD({ features: (prd.features || []).filter(f => f.id !== id) })
    closeDrawer()
  }

  const updateScreen = (id: string, updates: Partial<Screen>) => {
    updatePRD({
      screens: (prd.screens || []).map(s => s.id === id ? { ...s, ...updates } : s)
    })
  }

  const deleteScreen = (id: string) => {
    updatePRD({ screens: (prd.screens || []).filter(s => s.id !== id) })
    closeDrawer()
  }

  const updateEntity = (id: string, updates: Partial<Entity>) => {
    updatePRD({
      dataModel: (prd.dataModel || []).map(e => e.id === id ? { ...e, ...updates } : e)
    })
  }

  const deleteEntity = (id: string) => {
    updatePRD({ dataModel: (prd.dataModel || []).filter(e => e.id !== id) })
    closeDrawer()
  }

  const updateCompetitor = (index: number, value: string) => {
    const updated = [...(prd.competitors || [])]
    updated[index] = value
    updatePRD({ competitors: updated })
  }

  const deleteCompetitor = (index: number) => {
    updatePRD({ competitors: (prd.competitors || []).filter((_, i) => i !== index) })
    closeDrawer()
  }

  const updateMoodBoardImage = (id: string, updates: Partial<MoodBoardImage>) => {
    updatePRD({
      moodBoard: (prd.moodBoard || []).map(m => m.id === id ? { ...m, ...updates } : m)
    })
  }

  const deleteMoodBoardImage = (id: string) => {
    updatePRD({ moodBoard: (prd.moodBoard || []).filter(m => m.id !== id) })
    closeDrawer()
  }

  // Image upload handler
  const handleImageUpload = (nodeType: 'screens' | 'moodBoard', itemId: string, file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      if (nodeType === 'screens') {
        updateScreen(itemId, { imagePath: dataUrl })
      } else {
        updateMoodBoardImage(itemId, { path: dataUrl })
      }
    }
    reader.readAsDataURL(file)
  }

  const handleCardClick = (nodeId: string, cardId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingCard({ nodeId, cardId })
    setDrawerNodeId(nodeId)
    setDrawerItemId(cardId)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setDrawerNodeId(null)
    setDrawerItemId(null)
    setEditingCard(null)
  }

  // Render a node card
  const renderNode = (
    nodeId: string, 
    title: string, 
    subtitle: string, 
    items: any[], 
    onAdd: () => void,
    getItemLabel: (item: any) => string,
    getItemId?: (item: any, idx: number) => string
  ) => {
    const pos = getNodePosition(nodeId)
    const isSelected = selectedNodes.has(nodeId)

    return (
      <div
        key={nodeId}
        className={isSelected ? 'ring-2 ring-indigo-500' : ''}
        style={{
          position: 'absolute',
          left: pos.x * zoom + pan.x,
          top: pos.y * zoom + pan.y,
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          width: 180,
          zIndex: 10,
          cursor: 'move',
        }}
        onMouseDown={(e) => startNodeDrag(nodeId, e)}
        onClick={(e) => selectNode(nodeId, e)}
      >
        <div 
          style={{ 
            background: '#1e2433', 
            border: '1px solid #3a4255',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <h3 style={{ color: '#f1f5f9', fontSize: '13px', fontWeight: 600, margin: 0 }}>{title}</h3>
              <p style={{ color: '#94a3b8', fontSize: '11px', margin: '2px 0 0 0' }}>{subtitle}</p>
            </div>
            <span style={{ background: '#3b4559', color: '#cbd5e1', fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>
              {items.length}
            </span>
          </div>

          {/* Items */}
          {items.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              {items.slice(0, 3).map((item, idx) => {
                const itemId = getItemId ? getItemId(item, idx) : `${idx}`
                const isEditingThis = editingCard?.nodeId === nodeId && editingCard?.cardId === itemId
                return (
                  <div 
                    key={itemId} 
                    onClick={(e) => handleCardClick(nodeId, itemId, e)}
                    style={{ 
                      background: isEditingThis ? '#374151' : '#2d3748', 
                      padding: '6px 8px', 
                      borderRadius: '4px', 
                      marginBottom: '4px',
                      cursor: 'pointer',
                      border: isEditingThis ? '1px solid #6366f1' : '1px solid transparent',
                    }}
                  >
                    <span style={{ color: '#f1f5f9', fontSize: '12px' }}>{getItemLabel(item)}</span>
                  </div>
                )
              })}
              {items.length > 3 && (
                <p style={{ color: '#94a3b8', fontSize: '11px', margin: '4px 0 0 0' }}>+{items.length - 3} more...</p>
              )}
            </div>
          )}

          {/* Add button */}
          <button
            onClick={(e) => { e.stopPropagation(); onAdd() }}
            style={{
              width: '100%',
              padding: '6px',
              background: 'transparent',
              border: '1px dashed #4b5563',
              borderRadius: '4px',
              color: '#cbd5e1',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            + Add Card
          </button>
        </div>
      </div>
    )
  }

  // Render project node (editable)
  const renderProjectNode = () => {
    const pos = getNodePosition('project')
    const isSelected = selectedNodes.has('project')
    const isEditing = editingNode === 'project'

    return (
      <div
        key="project"
        className={isSelected ? 'ring-2 ring-indigo-500' : ''}
        style={{
          position: 'absolute',
          left: pos.x * zoom + pan.x,
          top: pos.y * zoom + pan.y,
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
          width: 220,
          zIndex: 10,
          cursor: 'move',
        }}
        onMouseDown={(e) => startNodeDrag('project', e)}
        onClick={(e) => selectNode('project', e)}
        onDoubleClick={() => setEditingNode('project')}
      >
        <div 
          style={{ 
            background: '#1e2433', 
            border: '2px solid #6366f1',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '24px' }}>📋</span>
            {isEditing && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setEditingNode(null)} style={{ color: '#22c55e', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>✓ Save</button>
                <button onClick={() => setEditingNode(null)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>✕ Cancel</button>
              </div>
            )}
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</label>
            {isEditing ? (
              <input
                type="text"
                value={prd.overview?.name || ''}
                onChange={(e) => updatePRD({ overview: { ...prd.overview, name: e.target.value } })}
                onClick={(e) => e.stopPropagation()}
                style={{ width: '100%', background: '#2d3748', border: '1px solid #4b5563', borderRadius: '4px', padding: '4px 8px', color: '#f1f5f9', fontSize: '13px', marginTop: '4px' }}
              />
            ) : (
              <p style={{ color: '#f1f5f9', fontSize: '14px', fontWeight: 500, margin: '4px 0 0 0' }}>{prd.overview?.name || 'Untitled Project'}</p>
            )}
          </div>

          <div>
            <label style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
            {isEditing ? (
              <textarea
                value={prd.overview?.description || ''}
                onChange={(e) => updatePRD({ overview: { ...prd.overview, description: e.target.value } })}
                onClick={(e) => e.stopPropagation()}
                rows={3}
                style={{ width: '100%', background: '#2d3748', border: '1px solid #4b5563', borderRadius: '4px', padding: '4px 8px', color: '#f1f5f9', fontSize: '12px', marginTop: '4px', resize: 'none' }}
              />
            ) : (
              <p style={{ color: '#cbd5e1', fontSize: '12px', margin: '4px 0 0 0' }}>{prd.overview?.description || 'Double-click to edit'}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Connection line
  const renderConnection = (from: string, to: string) => {
    const fromPos = getNodePosition(from)
    const toPos = getNodePosition(to)
    
    // Start from center-right of 'from' node, end at center-left of 'to' node
    const fromX = fromPos.x + 110  // right edge of project node
    const fromY = fromPos.y + 60   // vertical center
    const toX = toPos.x            // left edge of satellite node
    const toY = toPos.y + 50       // vertical center
    
    // Calculate control point for curve - offset perpendicular to the line
    const midX = (fromX + toX) / 2
    const midY = (fromY + toY) / 2
    
    // Create curve by offsetting control point
    const dx = toX - fromX
    const dy = toY - fromY
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // Perpendicular offset for curve (30% of distance)
    const curveAmount = distance * 0.3
    const perpX = -dy / distance * curveAmount
    const perpY = dx / distance * curveAmount
    
    const ctrlX = midX + perpX
    const ctrlY = midY + perpY

    return (
      <path
        key={`${from}-${to}`}
        d={`M ${fromX} ${fromY} Q ${ctrlX} ${ctrlY} ${toX} ${toY}`}
        fill="none"
        stroke="#6366f1"
        strokeWidth="2"
        strokeDasharray="8 4"
        opacity="0.7"
      />
    )
  }

  // Render drawer content based on node type
  const renderDrawerContent = () => {
    if (!drawerNodeId || !drawerItemId) return null

    // Features drawer
    if (drawerNodeId === 'features') {
      const feature = (prd.features || []).find(f => f.id === drawerItemId)
      if (!feature) return null
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>Title *</label>
            <input
              type="text"
              value={feature.title}
              onChange={(e) => updateFeature(feature.id, { title: e.target.value })}
              placeholder="Feature name"
              style={{ width: '100%', padding: '8px 12px', background: '#1e2433', border: '1px solid #3a4255', borderRadius: '6px', color: '#f1f5f9', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>Description</label>
            <textarea
              value={feature.description}
              onChange={(e) => updateFeature(feature.id, { description: e.target.value })}
              placeholder="What does this feature do?"
              rows={3}
              style={{ width: '100%', padding: '8px 12px', background: '#1e2433', border: '1px solid #3a4255', borderRadius: '6px', color: '#f1f5f9', fontSize: '14px', resize: 'none' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>Priority</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(['must', 'should', 'could'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => updateFeature(feature.id, { priority: p })}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: feature.priority === p ? '#4f46e5' : '#1e2433',
                    border: feature.priority === p ? '1px solid #6366f1' : '1px solid #3a4255',
                    borderRadius: '6px',
                    color: '#f1f5f9',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => deleteFeature(feature.id)}
            style={{ marginTop: '8px', padding: '8px', background: 'transparent', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}
          >
            Delete Feature
          </button>
        </div>
      )
    }

    // Screens drawer
    if (drawerNodeId === 'screens') {
      const screen = (prd.screens || []).find(s => s.id === drawerItemId)
      if (!screen) return null
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>Reference Image</label>
            {screen.imagePath ? (
              <div style={{ position: 'relative' }}>
                <img src={screen.imagePath} alt="Screen reference" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '6px' }} />
                <button
                  onClick={() => updateScreen(screen.id, { imagePath: undefined })}
                  style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 8px', background: '#ef4444', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', fontSize: '12px' }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100px', border: '2px dashed #3a4255', borderRadius: '6px', cursor: 'pointer' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>Click to upload image</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload('screens', screen.id, file)
                  }}
                />
              </label>
            )}
          </div>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>Screen Name *</label>
            <input
              type="text"
              value={screen.name}
              onChange={(e) => updateScreen(screen.id, { name: e.target.value })}
              placeholder="e.g., Dashboard, Settings"
              style={{ width: '100%', padding: '8px 12px', background: '#1e2433', border: '1px solid #3a4255', borderRadius: '6px', color: '#f1f5f9', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>Description</label>
            <textarea
              value={screen.description}
              onChange={(e) => updateScreen(screen.id, { description: e.target.value })}
              placeholder="What's on this screen?"
              rows={3}
              style={{ width: '100%', padding: '8px 12px', background: '#1e2433', border: '1px solid #3a4255', borderRadius: '6px', color: '#f1f5f9', fontSize: '14px', resize: 'none' }}
            />
          </div>
          <button
            onClick={() => deleteScreen(screen.id)}
            style={{ marginTop: '8px', padding: '8px', background: 'transparent', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}
          >
            Delete Screen
          </button>
        </div>
      )
    }

    // Mood Board drawer
    if (drawerNodeId === 'moodBoard') {
      const image = (prd.moodBoard || []).find(m => m.id === drawerItemId)
      if (!image) return null
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>Image *</label>
            {image.path ? (
              <div style={{ position: 'relative' }}>
                <img src={image.path} alt="Mood board" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '6px' }} />
                <button
                  onClick={() => updateMoodBoardImage(image.id, { path: '' })}
                  style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px 8px', background: '#ef4444', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', fontSize: '12px' }}
                >
                  Remove
                </button>
              </div>
            ) : (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '120px', border: '2px dashed #3a4255', borderRadius: '6px', cursor: 'pointer' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>Click to upload image</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload('moodBoard', image.id, file)
                  }}
                />
              </label>
            )}
          </div>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>Label (optional)</label>
            <input
              type="text"
              value={image.label || ''}
              onChange={(e) => updateMoodBoardImage(image.id, { label: e.target.value })}
              placeholder="e.g., Color palette, Typography"
              style={{ width: '100%', padding: '8px 12px', background: '#1e2433', border: '1px solid #3a4255', borderRadius: '6px', color: '#f1f5f9', fontSize: '14px' }}
            />
          </div>
          <button
            onClick={() => deleteMoodBoardImage(image.id)}
            style={{ marginTop: '8px', padding: '8px', background: 'transparent', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}
          >
            Delete Image
          </button>
        </div>
      )
    }

    // Data Model drawer
    if (drawerNodeId === 'data') {
      const entity = (prd.dataModel || []).find(e => e.id === drawerItemId)
      if (!entity) return null
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>Entity Name *</label>
            <input
              type="text"
              value={entity.name}
              onChange={(e) => updateEntity(entity.id, { name: e.target.value })}
              placeholder="e.g., User, Task, Post"
              style={{ width: '100%', padding: '8px 12px', background: '#1e2433', border: '1px solid #3a4255', borderRadius: '6px', color: '#f1f5f9', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>Fields</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {entity.fields.map((field, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={field.name}
                    onChange={(e) => {
                      const newFields = [...entity.fields]
                      newFields[idx] = { ...field, name: e.target.value }
                      updateEntity(entity.id, { fields: newFields })
                    }}
                    placeholder="Field name"
                    style={{ flex: 1, padding: '6px 10px', background: '#1e2433', border: '1px solid #3a4255', borderRadius: '4px', color: '#f1f5f9', fontSize: '13px' }}
                  />
                  <select
                    value={field.type}
                    onChange={(e) => {
                      const newFields = [...entity.fields]
                      newFields[idx] = { ...field, type: e.target.value }
                      updateEntity(entity.id, { fields: newFields })
                    }}
                    style={{ width: '100px', padding: '6px', background: '#1e2433', border: '1px solid #3a4255', borderRadius: '4px', color: '#f1f5f9', fontSize: '13px' }}
                  >
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="boolean">boolean</option>
                    <option value="date">date</option>
                    <option value="array">array</option>
                  </select>
                  <button
                    onClick={() => {
                      const newFields = entity.fields.filter((_, i) => i !== idx)
                      updateEntity(entity.id, { fields: newFields })
                    }}
                    style={{ padding: '6px 10px', background: '#ef4444', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', fontSize: '12px' }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newFields = [...entity.fields, { name: '', type: 'string' }]
                  updateEntity(entity.id, { fields: newFields })
                }}
                style={{ padding: '6px', background: 'transparent', border: '1px dashed #3a4255', borderRadius: '4px', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}
              >
                + Add Field
              </button>
            </div>
          </div>
          <button
            onClick={() => deleteEntity(entity.id)}
            style={{ marginTop: '8px', padding: '8px', background: 'transparent', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}
          >
            Delete Entity
          </button>
        </div>
      )
    }

    // Competitors drawer
    if (drawerNodeId === 'competitors') {
      const index = parseInt(drawerItemId?.replace('comp-', '') || '0')
      const competitor = (prd.competitors || [])[index]
      if (competitor === undefined) return null
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>Competitor / Inspiration</label>
            <input
              type="text"
              value={competitor}
              onChange={(e) => updateCompetitor(index, e.target.value)}
              placeholder="e.g., Notion, Figma, Linear"
              style={{ width: '100%', padding: '8px 12px', background: '#1e2433', border: '1px solid #3a4255', borderRadius: '6px', color: '#f1f5f9', fontSize: '14px' }}
            />
          </div>
          <button
            onClick={() => deleteCompetitor(index)}
            style={{ marginTop: '8px', padding: '8px', background: 'transparent', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}
          >
            Delete
          </button>
        </div>
      )
    }

    // Target Audience drawer
    if (drawerNodeId === 'audience') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>Primary User</label>
            <input
              type="text"
              value={prd.targetUsers?.primaryUser || ''}
              onChange={(e) => updatePRD({ targetUsers: { ...prd.targetUsers, primaryUser: e.target.value } })}
              placeholder="e.g., Freelance designers"
              style={{ width: '100%', padding: '8px 12px', background: '#1e2433', border: '1px solid #3a4255', borderRadius: '6px', color: '#f1f5f9', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>User Needs</label>
            <textarea
              value={prd.targetUsers?.userNeeds || ''}
              onChange={(e) => updatePRD({ targetUsers: { ...prd.targetUsers, userNeeds: e.target.value } })}
              placeholder="What do they need?"
              rows={3}
              style={{ width: '100%', padding: '8px 12px', background: '#1e2433', border: '1px solid #3a4255', borderRadius: '6px', color: '#f1f5f9', fontSize: '14px', resize: 'none' }}
            />
          </div>
        </div>
      )
    }

    // Tech Stack drawer
    if (drawerNodeId === 'stack') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>Frontend</label>
            <select
              value={prd.techStack?.frontend || 'React + Vite'}
              onChange={(e) => updatePRD({ techStack: { ...prd.techStack, frontend: e.target.value } })}
              style={{ width: '100%', padding: '8px 12px', background: '#1e2433', border: '1px solid #3a4255', borderRadius: '6px', color: '#f1f5f9', fontSize: '14px' }}
            >
              <option>React + Vite</option>
              <option>React + Next.js</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>Backend</label>
            <select
              value={prd.techStack?.backend || 'None'}
              onChange={(e) => updatePRD({ techStack: { ...prd.techStack, backend: e.target.value } })}
              style={{ width: '100%', padding: '8px 12px', background: '#1e2433', border: '1px solid #3a4255', borderRadius: '6px', color: '#f1f5f9', fontSize: '14px' }}
            >
              <option>None</option>
              <option>Supabase</option>
              <option>Firebase</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>Hosting</label>
            <select
              value={prd.techStack?.hosting || 'Vercel'}
              onChange={(e) => updatePRD({ techStack: { ...prd.techStack, hosting: e.target.value } })}
              style={{ width: '100%', padding: '8px 12px', background: '#1e2433', border: '1px solid #3a4255', borderRadius: '6px', color: '#f1f5f9', fontSize: '14px' }}
            >
              <option>Vercel</option>
              <option>Netlify</option>
            </select>
          </div>
        </div>
      )
    }

    return null
  }

  // Get drawer title based on node type
  const getDrawerTitle = () => {
    switch (drawerNodeId) {
      case 'features': return 'Edit Feature'
      case 'screens': return 'Edit Screen'
      case 'moodBoard': return 'Edit Reference'
      case 'data': return 'Edit Entity'
      case 'competitors': return 'Edit Competitor'
      case 'audience': return 'Target Audience'
      case 'stack': return 'Tech Stack'
      default: return 'Edit'
    }
  }
  return (
    <div style={{ height: '100%', display: 'flex', background: '#0f1219', minHeight: '500px' }}>
      {/* Main canvas area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid #475569' }}>
        <span style={{ color: '#e2e8f0', fontSize: '14px' }}>
          {selectedNodes.size > 0 ? `${selectedNodes.size} selected` : 'Canvas View - drag to pan, scroll to zoom'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setZoom(Math.min(zoom * 1.2, 2))} style={{ padding: '4px 8px', background: '#334155', border: 'none', borderRadius: '4px', color: '#e2e8f0', cursor: 'pointer' }}>+</button>
          <span style={{ color: '#94a3b8', fontSize: '12px', minWidth: '40px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(Math.max(zoom * 0.8, 0.25))} style={{ padding: '4px 8px', background: '#334155', border: 'none', borderRadius: '4px', color: '#e2e8f0', cursor: 'pointer' }}>−</button>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }} style={{ padding: '4px 8px', background: '#334155', border: 'none', borderRadius: '4px', color: '#e2e8f0', cursor: 'pointer', marginLeft: '8px' }}>Reset</button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="canvas-bg"
        style={{ 
          flex: 1,
          position: 'relative',
          background: '#0f1219',
          backgroundImage: 'radial-gradient(circle, #1e2433 1px, transparent 1px)',
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
          cursor: isPanning ? 'grabbing' : 'grab',
          overflow: 'hidden'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Connection lines */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {renderConnection('project', 'features')}
            {renderConnection('project', 'screens')}
            {renderConnection('project', 'moodBoard')}
            {renderConnection('project', 'data')}
            {renderConnection('project', 'competitors')}
            {renderConnection('project', 'audience')}
            {renderConnection('project', 'stack')}
          </g>
        </svg>

        {/* Nodes */}
        {renderProjectNode()}
        {renderNode('features', 'Features', 'Core features', prd.features || [], addFeature, (f: Feature) => f.title, (f: Feature) => f.id)}
        {renderNode('screens', 'Screens', 'UI screens', prd.screens || [], addScreen, (s: Screen) => s.name, (s: Screen) => s.id)}
        {renderNode('moodBoard', 'Mood Board', 'Style references', prd.moodBoard || [], addMoodBoardImage, (m: MoodBoardImage) => m.label || 'Image', (m: MoodBoardImage) => m.id)}
        {renderNode('data', 'Data Model', 'Entities', prd.dataModel || [], addEntity, (e: Entity) => e.name, (e: Entity) => e.id)}
        {renderNode('competitors', 'Competitors', 'Market alternatives', prd.competitors || [], addCompetitor, (c: string) => c, (_c: string, idx: number) => `comp-${idx}`)}
        {renderNode('audience', 'Target Audience', 'Users', prd.targetUsers?.primaryUser ? [prd.targetUsers.primaryUser] : [], () => updatePRD({ targetUsers: { ...prd.targetUsers, primaryUser: '' } }), (u: string) => u)}
        {renderNode('stack', 'Tech Stack', 'Infrastructure', prd.techStack?.frontend ? [prd.techStack.frontend] : [], () => updatePRD({ techStack: { ...prd.techStack, frontend: 'React + Tailwind' } }), (t: string) => t)}
      </div>

      {/* Action bar */}
      {selectedNodes.size > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', padding: '12px', borderTop: '1px solid #2a3040', background: '#1e2433' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'transparent', border: 'none', color: '#e2e8f0', cursor: 'pointer', fontSize: '14px' }}>
            ✨ Add {selectedNodes.size} to Context
          </button>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}>
            🗑️ Delete {selectedNodes.size}
          </button>
        </div>
      )}
      </div>

      {/* Right Drawer */}
      {drawerOpen && (
        <div style={{
          width: '320px',
          background: '#151921',
          borderLeft: '1px solid #2a3040',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Drawer Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            borderBottom: '1px solid #2a3040'
          }}>
            <h3 style={{ color: '#f1f5f9', fontSize: '16px', fontWeight: 600, margin: 0 }}>
              {getDrawerTitle()}
            </h3>
            <button
              onClick={closeDrawer}
              style={{
                padding: '4px 8px',
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ×
            </button>
          </div>
          
          {/* Drawer Content */}
          <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
            {renderDrawerContent()}
          </div>
        </div>
      )}
    </div>
  )
}
