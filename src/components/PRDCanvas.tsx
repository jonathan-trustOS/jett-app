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

  // Add handlers
  const addFeature = () => {
    const newFeature: Feature = {
      id: `feature-${Date.now()}`,
      title: 'New Feature',
      description: 'Describe this feature',
      priority: 'should'
    }
    updatePRD({ features: [...(prd.features || []), newFeature] })
  }

  const addScreen = () => {
    updatePRD({ screens: [...(prd.screens || []), { id: `screen-${Date.now()}`, name: 'New Screen', description: '' }] })
  }

  const addEntity = () => {
    updatePRD({ dataModel: [...(prd.dataModel || []), { id: `entity-${Date.now()}`, name: 'NewEntity', fields: [{ name: 'id', type: 'string' }] }] })
  }

  const addCompetitor = () => {
    updatePRD({ competitors: [...(prd.competitors || []), 'New Competitor'] })
  }

  // Render a node card
  const renderNode = (
    nodeId: string, 
    title: string, 
    subtitle: string, 
    items: any[], 
    onAdd: () => void,
    getItemLabel: (item: any) => string
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
              {items.slice(0, 3).map((item, idx) => (
                <div key={idx} style={{ background: '#2d3748', padding: '6px 8px', borderRadius: '4px', marginBottom: '4px' }}>
                  <span style={{ color: '#f1f5f9', fontSize: '12px' }}>{getItemLabel(item)}</span>
                </div>
              ))}
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

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0f1219', minHeight: '500px' }}>
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
            {renderConnection('project', 'data')}
            {renderConnection('project', 'competitors')}
            {renderConnection('project', 'audience')}
            {renderConnection('project', 'stack')}
          </g>
        </svg>

        {/* Nodes */}
        {renderProjectNode()}
        {renderNode('features', 'Features', 'Core features', prd.features || [], addFeature, (f: Feature) => f.title)}
        {renderNode('screens', 'Screens', 'UI screens', prd.screens || [], addScreen, (s: Screen) => s.name)}
        {renderNode('data', 'Data Model', 'Entities', prd.dataModel || [], addEntity, (e: Entity) => e.name)}
        {renderNode('competitors', 'Competitors', 'Market alternatives', prd.competitors || [], addCompetitor, (c: string) => c)}
        {renderNode('audience', 'Target Audience', 'Users', prd.targetUsers?.primary ? [prd.targetUsers.primary] : [], () => updatePRD({ targetUsers: { ...prd.targetUsers, primary: 'Primary user' } }), (u: string) => u)}
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
  )
}
