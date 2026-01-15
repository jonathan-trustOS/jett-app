/**
 * Jett Learning - Pattern Extraction
 * Extracts reusable patterns from generated code
 */

import { 
  updateProjectContext, 
  addCodePattern,
  ProjectContext 
} from './database'

// Extract Tailwind classes from code
export function extractTailwindClasses(code: string): {
  colors: string[]
  components: string[]
  layout: string[]
} {
  // Match className="..." or className={`...`} or class="..."
  const classRegex = /class(?:Name)?=["'`{]([^"'`}]+)["'`}]/g
  const allClasses: string[] = []
  
  let match
  while ((match = classRegex.exec(code)) !== null) {
    const classes = match[1].split(/\s+/).filter(c => c.length > 0)
    allClasses.push(...classes)
  }
  
  // Categorize
  const colors = [...new Set(allClasses.filter(c => 
    c.includes('bg-') || 
    c.includes('text-') || 
    c.includes('border-') ||
    c.includes('ring-') ||
    c.includes('from-') ||
    c.includes('to-') ||
    c.includes('via-')
  ))]
  
  const components = [...new Set(allClasses.filter(c =>
    c.includes('rounded') ||
    c.includes('shadow') ||
    c.includes('border') ||
    c.includes('ring') ||
    c.includes('outline') ||
    c.includes('transition') ||
    c.includes('animate') ||
    c.includes('hover:') ||
    c.includes('focus:')
  ))]
  
  const layout = [...new Set(allClasses.filter(c =>
    c.includes('flex') ||
    c.includes('grid') ||
    c.includes('gap-') ||
    c.includes('space-') ||
    c.includes('p-') ||
    c.includes('px-') ||
    c.includes('py-') ||
    c.includes('m-') ||
    c.includes('mx-') ||
    c.includes('my-') ||
    c.includes('w-') ||
    c.includes('h-') ||
    c.includes('min-') ||
    c.includes('max-')
  ))]
  
  return { colors, components, layout }
}

// Extract component declarations
export function extractComponents(code: string): { name: string; file: string; purpose: string }[] {
  const components: { name: string; file: string; purpose: string }[] = []
  
  // Match function ComponentName or const ComponentName = 
  const funcRegex = /(?:export\s+)?(?:default\s+)?function\s+([A-Z][a-zA-Z0-9]*)/g
  const constRegex = /(?:export\s+)?const\s+([A-Z][a-zA-Z0-9]*)\s*=\s*(?:\([^)]*\)|[^=])*=>/g
  
  let match
  while ((match = funcRegex.exec(code)) !== null) {
    components.push({
      name: match[1],
      file: '', // Will be set by caller
      purpose: inferComponentPurpose(match[1], code)
    })
  }
  
  while ((match = constRegex.exec(code)) !== null) {
    if (!components.find(c => c.name === match[1])) {
      components.push({
        name: match[1],
        file: '',
        purpose: inferComponentPurpose(match[1], code)
      })
    }
  }
  
  return components
}

// Infer component purpose from name and context
function inferComponentPurpose(name: string, code: string): string {
  const nameLower = name.toLowerCase()
  
  if (nameLower.includes('header')) return 'Page header/navigation'
  if (nameLower.includes('footer')) return 'Page footer'
  if (nameLower.includes('nav')) return 'Navigation component'
  if (nameLower.includes('sidebar')) return 'Sidebar navigation'
  if (nameLower.includes('button')) return 'Button component'
  if (nameLower.includes('card')) return 'Card container'
  if (nameLower.includes('modal')) return 'Modal dialog'
  if (nameLower.includes('form')) return 'Form component'
  if (nameLower.includes('input')) return 'Input field'
  if (nameLower.includes('list')) return 'List component'
  if (nameLower.includes('item')) return 'List item'
  if (nameLower.includes('menu')) return 'Menu component'
  if (nameLower.includes('dropdown')) return 'Dropdown menu'
  if (nameLower.includes('tab')) return 'Tab component'
  if (nameLower.includes('panel')) return 'Panel/section'
  if (nameLower.includes('layout')) return 'Layout wrapper'
  if (nameLower.includes('page')) return 'Page component'
  if (nameLower.includes('view')) return 'View component'
  if (nameLower.includes('app')) return 'Main application'
  
  return 'UI component'
}

// Extract imports to learn dependencies
export function extractImports(code: string): string[] {
  const imports: string[] = []
  const importRegex = /import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g
  
  let match
  while ((match = importRegex.exec(code)) !== null) {
    imports.push(match[1])
  }
  
  return [...new Set(imports)]
}

// Infer conventions from code
export function inferConventions(code: string): {
  stateManagement: string
  styling: string
  icons: string
} {
  const conventions = {
    stateManagement: 'none',
    styling: 'unknown',
    icons: 'none'
  }
  
  // State management
  if (code.includes('useState')) {
    conventions.stateManagement = 'useState hooks'
  } else if (code.includes('useReducer')) {
    conventions.stateManagement = 'useReducer hooks'
  } else if (code.includes('zustand') || code.includes('create(')) {
    conventions.stateManagement = 'Zustand'
  } else if (code.includes('redux') || code.includes('useDispatch')) {
    conventions.stateManagement = 'Redux'
  }
  
  // Styling
  if (code.includes('className=')) {
    if (code.includes('tailwind') || /class(?:Name)?=["'][^"']*(?:flex|grid|bg-|text-|p-|m-)/.test(code)) {
      conventions.styling = 'Tailwind CSS'
    } else {
      conventions.styling = 'CSS classes'
    }
  } else if (code.includes('styled.') || code.includes('styled(')) {
    conventions.styling = 'Styled Components'
  } else if (code.includes('css`') || code.includes('@emotion')) {
    conventions.styling = 'Emotion'
  }
  
  // Icons
  if (code.includes('lucide-react')) {
    conventions.icons = 'Lucide React'
  } else if (code.includes('react-icons')) {
    conventions.icons = 'React Icons'
  } else if (code.includes('@heroicons')) {
    conventions.icons = 'Heroicons'
  } else if (code.includes('FontAwesome') || code.includes('@fortawesome')) {
    conventions.icons = 'Font Awesome'
  }
  
  return conventions
}

// Extract keywords from task description
export function extractKeywords(text: string): string[] {
  // Remove common stop words
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'that', 'this',
    'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what',
    'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each', 'every',
    'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not',
    'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'set', 'up',
    'create', 'build', 'make', 'add', 'implement', 'use', 'using'
  ])
  
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
}

// Main extraction function - call after task completes
export async function extractAndSavePatterns(
  projectId: string,
  taskDescription: string,
  generatedCode: string,
  files: { [path: string]: string }
): Promise<void> {
  
  // 1. Extract Tailwind patterns
  const tailwind = extractTailwindClasses(generatedCode)
  
  // 2. Extract components
  const components = extractComponents(generatedCode)
  
  // 3. Infer conventions
  const conventions = inferConventions(generatedCode)
  
  // 4. Build file map
  const fileMap: { [path: string]: string } = {}
  for (const [filePath, content] of Object.entries(files)) {
    const comps = extractComponents(content)
    fileMap[filePath] = comps.length > 0 
      ? comps.map(c => c.name).join(', ')
      : 'Utility/config file'
  }
  
  // 5. Update project context
  updateProjectContext(projectId, {
    tailwind,
    components: components.map(c => ({ ...c, file: 'generated' })),
    conventions,
    fileMap
  })
  
  // 6. Store as reusable pattern
  const keywords = extractKeywords(taskDescription)
  if (keywords.length > 0 && generatedCode.length > 100) {
    addCodePattern({
      trigger: taskDescription,
      keywords,
      appType: 'any', // TODO: Infer from PRD
      code: generatedCode.slice(0, 5000), // Limit size
      explanation: `Generated for: ${taskDescription}`,
      useCount: 1,
      successCount: 0,
      failCount: 0,
      confidence: 0.5,
      source: 'extracted',
      invalidated: false
    })
  }
}

// Format context for injection into prompts
export function formatContextForPrompt(context: ProjectContext | null): string {
  if (!context) {
    return 'This is the first task - establish patterns for the project.'
  }
  
  const parts: string[] = []
  
  // Tailwind patterns
  if (context.tailwind.colors.length > 0) {
    parts.push(`**Color scheme:** ${context.tailwind.colors.slice(0, 10).join(', ')}`)
  }
  if (context.tailwind.components.length > 0) {
    parts.push(`**Component styles:** ${context.tailwind.components.slice(0, 10).join(', ')}`)
  }
  if (context.tailwind.layout.length > 0) {
    parts.push(`**Layout patterns:** ${context.tailwind.layout.slice(0, 10).join(', ')}`)
  }
  
  // Components
  if (context.components.length > 0) {
    parts.push(`**Existing components:** ${context.components.map(c => c.name).join(', ')}`)
  }
  
  // Conventions
  if (context.conventions.stateManagement !== 'none') {
    parts.push(`**State management:** ${context.conventions.stateManagement}`)
  }
  if (context.conventions.styling !== 'unknown') {
    parts.push(`**Styling:** ${context.conventions.styling}`)
  }
  if (context.conventions.icons !== 'none') {
    parts.push(`**Icons:** ${context.conventions.icons}`)
  }
  
  if (parts.length === 0) {
    return 'Project started but no patterns established yet.'
  }
  
  return `## Project Patterns (maintain consistency)\n\n${parts.join('\n')}`
}
