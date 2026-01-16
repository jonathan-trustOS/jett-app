/**
 * Figma Import Service
 * Fetches and parses Figma designs via API
 */

// Types for Figma API responses
export interface FigmaColor {
  r: number
  g: number
  b: number
  a: number
}

export interface FigmaStyle {
  name: string
  type: 'FILL' | 'TEXT' | 'EFFECT' | 'GRID'
  description?: string
}

export interface FigmaComponent {
  id: string
  name: string
  type: string
  children?: FigmaComponent[]
  absoluteBoundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
  fills?: Array<{
    type: string
    color?: FigmaColor
    opacity?: number
  }>
  strokes?: Array<{
    type: string
    color?: FigmaColor
  }>
  cornerRadius?: number
  characters?: string
  style?: {
    fontFamily?: string
    fontSize?: number
    fontWeight?: number
    lineHeightPx?: number
    letterSpacing?: number
    textAlignHorizontal?: string
  }
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL'
  itemSpacing?: number
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
  primaryAxisAlignItems?: string
  counterAxisAlignItems?: string
}

export interface FigmaFile {
  name: string
  lastModified: string
  thumbnailUrl: string
  document: FigmaComponent
  styles: Record<string, FigmaStyle>
  components: Record<string, { name: string; description: string }>
}

export interface ParsedDesign {
  name: string
  colors: Array<{ name: string; hex: string; usage: string }>
  typography: Array<{ name: string; font: string; size: number; weight: number }>
  components: Array<{ name: string; type: string; description: string }>
  screens: Array<{ name: string; width: number; height: number; elements: string[] }>
  spacing: { base: number; scale: number[] }
  assets: Array<{ name: string; nodeId: string; type: 'icon' | 'image' | 'illustration' }>
}

// Extract file key from various Figma URL formats
export function extractFileKey(url: string): string | null {
  // Formats:
  // https://www.figma.com/file/ABC123/Name
  // https://www.figma.com/design/ABC123/Name
  // https://figma.com/file/ABC123/Name?node-id=...
  
  const patterns = [
    /figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/,
    /figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)\/[^?]*/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  
  return null
}

// Extract node ID from URL if present
export function extractNodeId(url: string): string | null {
  const match = url.match(/node-id=([^&]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

// Convert Figma color to hex
export function colorToHex(color: FigmaColor): string {
  const r = Math.round(color.r * 255)
  const g = Math.round(color.g * 255)
  const b = Math.round(color.b * 255)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

// Convert Figma color to rgba
export function colorToRgba(color: FigmaColor): string {
  const r = Math.round(color.r * 255)
  const g = Math.round(color.g * 255)
  const b = Math.round(color.b * 255)
  return `rgba(${r}, ${g}, ${b}, ${color.a})`
}

// Fetch Figma file data
export async function fetchFigmaFile(fileKey: string, token: string): Promise<FigmaFile> {
  const response = await fetch(`https://api.figma.com/v1/files/${fileKey}`, {
    headers: {
      'X-Figma-Token': token
    }
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || `Figma API error: ${response.status}`)
  }
  
  return response.json()
}

// Fetch specific nodes
export async function fetchFigmaNodes(fileKey: string, nodeIds: string[], token: string): Promise<any> {
  const ids = nodeIds.join(',')
  const response = await fetch(`https://api.figma.com/v1/files/${fileKey}/nodes?ids=${ids}`, {
    headers: {
      'X-Figma-Token': token
    }
  })
  
  if (!response.ok) {
    throw new Error(`Figma API error: ${response.status}`)
  }
  
  return response.json()
}

// Export images from Figma
export async function exportFigmaImages(
  fileKey: string, 
  nodeIds: string[], 
  token: string,
  format: 'png' | 'svg' | 'jpg' = 'png',
  scale: number = 2
): Promise<Record<string, string>> {
  const ids = nodeIds.join(',')
  const response = await fetch(
    `https://api.figma.com/v1/images/${fileKey}?ids=${ids}&format=${format}&scale=${scale}`,
    {
      headers: {
        'X-Figma-Token': token
      }
    }
  )
  
  if (!response.ok) {
    throw new Error(`Figma API error: ${response.status}`)
  }
  
  const data = await response.json()
  return data.images
}

// Detect component type from Figma node
function detectComponentType(node: FigmaComponent): string {
  const name = node.name.toLowerCase()
  
  // Check name patterns
  if (name.includes('button') || name.includes('btn')) return 'button'
  if (name.includes('input') || name.includes('field') || name.includes('textfield')) return 'input'
  if (name.includes('card')) return 'card'
  if (name.includes('nav') || name.includes('header')) return 'navigation'
  if (name.includes('footer')) return 'footer'
  if (name.includes('modal') || name.includes('dialog')) return 'modal'
  if (name.includes('icon')) return 'icon'
  if (name.includes('image') || name.includes('img') || name.includes('photo')) return 'image'
  if (name.includes('avatar')) return 'avatar'
  if (name.includes('badge') || name.includes('tag') || name.includes('chip')) return 'badge'
  if (name.includes('list')) return 'list'
  if (name.includes('tab')) return 'tabs'
  if (name.includes('menu') || name.includes('dropdown')) return 'menu'
  if (name.includes('checkbox') || name.includes('check')) return 'checkbox'
  if (name.includes('radio')) return 'radio'
  if (name.includes('toggle') || name.includes('switch')) return 'toggle'
  if (name.includes('slider')) return 'slider'
  if (name.includes('progress')) return 'progress'
  if (name.includes('spinner') || name.includes('loading')) return 'spinner'
  if (name.includes('toast') || name.includes('notification') || name.includes('alert')) return 'toast'
  
  // Check by node type
  if (node.type === 'TEXT') return 'text'
  if (node.type === 'RECTANGLE' && node.cornerRadius && node.cornerRadius > 0) return 'rounded-box'
  if (node.type === 'ELLIPSE') return 'circle'
  if (node.type === 'VECTOR') return 'icon'
  if (node.type === 'IMAGE') return 'image'
  
  // Check by layout
  if (node.layoutMode === 'HORIZONTAL') return 'row'
  if (node.layoutMode === 'VERTICAL') return 'column'
  
  return 'container'
}

// Recursively extract colors from nodes
function extractColors(node: FigmaComponent, colors: Map<string, { hex: string; count: number }>): void {
  if (node.fills) {
    for (const fill of node.fills) {
      if (fill.type === 'SOLID' && fill.color) {
        const hex = colorToHex(fill.color)
        const existing = colors.get(hex)
        colors.set(hex, { hex, count: (existing?.count || 0) + 1 })
      }
    }
  }
  
  if (node.strokes) {
    for (const stroke of node.strokes) {
      if (stroke.type === 'SOLID' && stroke.color) {
        const hex = colorToHex(stroke.color)
        const existing = colors.get(hex)
        colors.set(hex, { hex, count: (existing?.count || 0) + 1 })
      }
    }
  }
  
  if (node.children) {
    for (const child of node.children) {
      extractColors(child, colors)
    }
  }
}

// Extract typography from nodes
function extractTypography(node: FigmaComponent, typography: Map<string, any>): void {
  if (node.type === 'TEXT' && node.style) {
    const key = `${node.style.fontFamily}-${node.style.fontSize}-${node.style.fontWeight}`
    if (!typography.has(key)) {
      typography.set(key, {
        font: node.style.fontFamily || 'Inter',
        size: node.style.fontSize || 16,
        weight: node.style.fontWeight || 400,
        lineHeight: node.style.lineHeightPx,
        letterSpacing: node.style.letterSpacing
      })
    }
  }
  
  if (node.children) {
    for (const child of node.children) {
      extractTypography(child, typography)
    }
  }
}

// Extract components from nodes
function extractComponents(node: FigmaComponent, components: any[], depth: number = 0): void {
  // Skip if too deep
  if (depth > 5) return
  
  // Check if this is a meaningful component
  const isComponent = node.type === 'COMPONENT' || node.type === 'INSTANCE'
  const isFrame = node.type === 'FRAME' && node.name && !node.name.startsWith('Frame ')
  
  if (isComponent || isFrame) {
    components.push({
      id: node.id || `comp-${components.length}`,
      name: node.name,
      type: detectComponentType(node),
      width: node.absoluteBoundingBox?.width,
      height: node.absoluteBoundingBox?.height,
      hasChildren: (node.children?.length || 0) > 0
    })
  }
  
  if (node.children) {
    for (const child of node.children) {
      extractComponents(child, components, depth + 1)
    }
  }
}

// Extract screens (top-level frames)
function extractScreens(document: FigmaComponent): any[] {
  const screens: any[] = []
  
  // Find the canvas (page)
  const pages = document.children || []
  
  for (const page of pages) {
    if (page.type === 'CANVAS') {
      const frames = page.children || []
      
      for (const frame of frames) {
        if (frame.type === 'FRAME' && frame.absoluteBoundingBox) {
          const elements: string[] = []
          
          // Extract element names from children
          const extractElementNames = (node: FigmaComponent, depth: number = 0) => {
            if (depth > 3) return
            if (node.name && !node.name.startsWith('Frame ')) {
              elements.push(node.name)
            }
            if (node.children) {
              for (const child of node.children) {
                extractElementNames(child, depth + 1)
              }
            }
          }
          
          extractElementNames(frame)
          
          screens.push({
            id: frame.id,
            name: frame.name,
            width: Math.round(frame.absoluteBoundingBox.width),
            height: Math.round(frame.absoluteBoundingBox.height),
            elements: elements.slice(0, 20) // Limit to first 20
          })
        }
      }
    }
  }
  
  return screens
}

// Guess color usage based on properties
function guessColorUsage(hex: string, count: number): string {
  const h = hex.toLowerCase()
  
  // Common patterns
  if (h === '#ffffff' || h === '#fff') return 'background'
  if (h === '#000000' || h === '#000') return 'text'
  if (h.match(/^#[0-9a-f]{6}$/) && count > 10) return 'primary'
  
  // Light colors likely background
  const r = parseInt(h.slice(1, 3), 16)
  const g = parseInt(h.slice(3, 5), 16)
  const b = parseInt(h.slice(5, 7), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  
  if (brightness > 240) return 'background'
  if (brightness < 50) return 'text'
  if (count > 5) return 'accent'
  
  return 'secondary'
}

// Name typography styles
function nameTypographyStyle(size: number, weight: number): string {
  if (size >= 32) return 'heading-1'
  if (size >= 24) return 'heading-2'
  if (size >= 20) return 'heading-3'
  if (size >= 18) return 'heading-4'
  if (size >= 16 && weight >= 600) return 'subtitle'
  if (size >= 14) return 'body'
  if (size >= 12) return 'caption'
  return 'small'
}

// Main parse function
export function parseFigmaFile(file: FigmaFile): ParsedDesign {
  const colorsMap = new Map<string, { hex: string; count: number }>()
  const typographyMap = new Map<string, any>()
  const components: any[] = []
  
  // Extract from document
  extractColors(file.document, colorsMap)
  extractTypography(file.document, typographyMap)
  extractComponents(file.document, components)
  
  // Convert colors
  const colors = Array.from(colorsMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((c, i) => ({
      name: `color-${i + 1}`,
      hex: c.hex,
      usage: guessColorUsage(c.hex, c.count)
    }))
  
  // Convert typography
  const typography = Array.from(typographyMap.values())
    .sort((a, b) => b.size - a.size)
    .slice(0, 8)
    .map(t => ({
      name: nameTypographyStyle(t.size, t.weight),
      font: t.font,
      size: t.size,
      weight: t.weight
    }))
  
  // Dedupe components by name
  const uniqueComponents = Array.from(
    new Map(components.map(c => [c.name, c])).values()
  ).slice(0, 20)
  
  // Extract screens
  const screens = extractScreens(file.document)
  
  // Calculate spacing
  const spacingValues = [4, 8, 12, 16, 24, 32, 48, 64]
  
  return {
    name: file.name,
    colors,
    typography,
    components: uniqueComponents.map(c => ({
      name: c.name,
      type: c.type,
      description: `${c.type} component (${c.width}x${c.height})`
    })),
    screens: screens.map(s => ({
      name: s.name,
      width: s.width,
      height: s.height,
      elements: s.elements
    })),
    spacing: {
      base: 8,
      scale: spacingValues
    },
    assets: [] // Would need image export API call
  }
}

// Generate PRD from parsed design
export function generatePRDFromDesign(design: ParsedDesign): any {
  // Detect app type from screen names
  const screenNames = design.screens.map(s => s.name.toLowerCase()).join(' ')
  let appType = 'web app'
  if (screenNames.includes('mobile') || design.screens.some(s => s.width <= 430)) {
    appType = 'mobile app'
  }
  if (screenNames.includes('dashboard') || screenNames.includes('admin')) {
    appType = 'dashboard'
  }
  
  // Generate features from components
  const features = design.components.slice(0, 5).map((c, i) => ({
    id: `feature-${i + 1}`,
    title: c.name,
    description: `Implement ${c.name} component with proper styling and interactions`,
    priority: i < 3 ? 'must-have' : 'nice-to-have'
  }))
  
  // Generate screens
  const screens = design.screens.slice(0, 5).map((s, i) => ({
    id: `screen-${i + 1}`,
    name: s.name,
    description: `${s.width}x${s.height} screen containing: ${s.elements.slice(0, 5).join(', ')}`
  }))
  
  // Generate design notes
  const primaryColor = design.colors.find(c => c.usage === 'primary')?.hex || design.colors[0]?.hex || '#6366f1'
  const fontFamily = design.typography[0]?.font || 'Inter'
  
  const designNotes = `
Color Palette:
${design.colors.slice(0, 5).map(c => `- ${c.usage}: ${c.hex}`).join('\n')}

Typography:
- Primary font: ${fontFamily}
${design.typography.slice(0, 4).map(t => `- ${t.name}: ${t.size}px ${t.weight}`).join('\n')}

Spacing: ${design.spacing.base}px base unit
`.trim()
  
  return {
    overview: {
      name: design.name,
      description: `${appType} imported from Figma design`,
      coreGoal: `Build a functional ${appType} matching the Figma design`
    },
    features,
    screens,
    targetUsers: [{
      id: 'user-1',
      persona: 'End User',
      needs: 'A polished, functional application'
    }],
    techStack: {
      frontend: 'React + TypeScript',
      styling: 'Tailwind CSS',
      backend: 'None',
      hosting: 'Vercel'
    },
    designNotes,
    figmaSource: {
      imported: true,
      colors: design.colors,
      typography: design.typography,
      components: design.components
    }
  }
}
