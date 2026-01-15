import { supabase } from './supabase'

// ============================================
// TYPES (matching App.tsx)
// ============================================

interface Project {
  id: string
  name: string
  status: 'draft' | 'building' | 'complete'
  mode: 'dev' | 'test' | 'prod'
  prd: any
  tasks: any[]
  modules: any[]
  priorityStack: string[]
  buildSteps?: any[]
  deployUrl: string | null
  prodUrl: string | null
  prodVersion: number
  versionHistory: any[]
  suggestions: any[]
  review: any
  createdAt: string
  updatedAt: string
}

interface Idea {
  id: string
  title: string
  description: string
  tags: string[]
  chat: any[]
  prdCaptures: {
    overview: any[]
    features: any[]
    users: any[]
    screens: any[]
    data: any[]
    design: any[]
  }
  createdAt: string
  updatedAt: string
  status: 'raw' | 'chatting' | 'ready' | 'promoted'
  projectId?: string
}

// ============================================
// PROJECTS SYNC
// ============================================

export async function fetchProjects(userId: string): Promise<Project[]> {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch projects:', error)
      return []
    }

    // Transform from DB schema to App schema
    return (data || []).map(dbProjectToApp)
  } catch (err) {
    console.error('Projects fetch error:', err)
    return []
  }
}

export async function upsertProject(userId: string, project: Project): Promise<boolean> {
  try {
    const dbProject = appProjectToDb(userId, project)
    
    const { error } = await supabase
      .from('projects')
      .upsert(dbProject, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })

    if (error) {
      console.error('Failed to upsert project:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Project upsert error:', err)
    return false
  }
}

export async function deleteProject(projectId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) {
      console.error('Failed to delete project:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Project delete error:', err)
    return false
  }
}

// ============================================
// IDEAS SYNC
// ============================================

export async function fetchIdeas(userId: string): Promise<Idea[]> {
  try {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch ideas:', error)
      return []
    }

    // Transform from DB schema to App schema
    return (data || []).map(dbIdeaToApp)
  } catch (err) {
    console.error('Ideas fetch error:', err)
    return []
  }
}

export async function upsertIdea(userId: string, idea: Idea): Promise<boolean> {
  try {
    const dbIdea = appIdeaToDb(userId, idea)
    
    const { error } = await supabase
      .from('ideas')
      .upsert(dbIdea, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })

    if (error) {
      console.error('Failed to upsert idea:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Idea upsert error:', err)
    return false
  }
}

export async function deleteIdea(ideaId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ideas')
      .delete()
      .eq('id', ideaId)

    if (error) {
      console.error('Failed to delete idea:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('Idea delete error:', err)
    return false
  }
}

// ============================================
// TRANSFORMERS: DB <-> App
// ============================================

function dbProjectToApp(db: any): Project {
  return {
    id: db.id,
    name: db.name,
    status: db.status || 'draft',
    mode: db.mode || 'dev',
    prd: db.prd || {},
    tasks: db.tasks || [],
    modules: db.modules || [],
    priorityStack: db.priority_stack || [],
    buildSteps: db.build_steps || [],
    deployUrl: db.deploy_url,
    prodUrl: db.prod_url,
    prodVersion: db.prod_version || 0,
    versionHistory: db.version_history || [],
    suggestions: db.suggestions || [],
    review: db.review || { status: 'pending', errors: [], improvements: [], simplifications: [] },
    createdAt: db.created_at,
    updatedAt: db.updated_at
  }
}

function appProjectToDb(userId: string, app: Project): any {
  return {
    id: app.id,
    user_id: userId,
    name: app.name,
    status: app.status,
    mode: app.mode,
    prd: app.prd,
    tasks: app.tasks,
    modules: app.modules,
    priority_stack: app.priorityStack,
    build_steps: app.buildSteps,
    deploy_url: app.deployUrl,
    prod_url: app.prodUrl,
    prod_version: app.prodVersion,
    version_history: app.versionHistory,
    suggestions: app.suggestions,
    review: app.review,
    // Let DB handle timestamps
    // created_at and updated_at handled by triggers
  }
}

function dbIdeaToApp(db: any): Idea {
  return {
    id: db.id,
    title: db.title,
    description: db.description || '',
    tags: db.tags || [],
    chat: db.chat || [],
    prdCaptures: db.prd_captures || {
      overview: [],
      features: [],
      users: [],
      screens: [],
      data: [],
      design: []
    },
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    status: db.status || 'raw',
    projectId: db.promoted_to_project_id
  }
}

function appIdeaToDb(userId: string, app: Idea): any {
  return {
    id: app.id,
    user_id: userId,
    title: app.title,
    description: app.description,
    tags: app.tags,
    chat: app.chat,
    prd_captures: app.prdCaptures,
    status: app.status,
    promoted_to_project_id: app.projectId || null
    // Let DB handle timestamps
  }
}

// ============================================
// BATCH SYNC (for initial load/migration)
// ============================================

export async function syncAllProjects(userId: string, localProjects: Project[]): Promise<Project[]> {
  // Fetch from cloud
  const cloudProjects = await fetchProjects(userId)
  
  // Create a map of cloud projects by ID
  const cloudMap = new Map(cloudProjects.map(p => [p.id, p]))
  
  // Merge: local wins for conflicts (based on updatedAt)
  const merged: Project[] = []
  const toUpload: Project[] = []
  
  for (const local of localProjects) {
    const cloud = cloudMap.get(local.id)
    
    if (!cloud) {
      // Local only - upload to cloud
      toUpload.push(local)
      merged.push(local)
    } else {
      // Both exist - use most recent
      const localTime = new Date(local.updatedAt).getTime()
      const cloudTime = new Date(cloud.updatedAt).getTime()
      
      if (localTime >= cloudTime) {
        // Local is newer - upload and use local
        toUpload.push(local)
        merged.push(local)
      } else {
        // Cloud is newer - use cloud
        merged.push(cloud)
      }
      cloudMap.delete(local.id)
    }
  }
  
  // Add cloud-only projects
  for (const cloud of cloudMap.values()) {
    merged.push(cloud)
  }
  
  // Upload local changes
  for (const project of toUpload) {
    await upsertProject(userId, project)
  }
  
  return merged
}

export async function syncAllIdeas(userId: string, localIdeas: Idea[]): Promise<Idea[]> {
  // Fetch from cloud
  const cloudIdeas = await fetchIdeas(userId)
  
  // Create a map of cloud ideas by ID
  const cloudMap = new Map(cloudIdeas.map(i => [i.id, i]))
  
  // Merge: local wins for conflicts (based on updatedAt)
  const merged: Idea[] = []
  const toUpload: Idea[] = []
  
  for (const local of localIdeas) {
    const cloud = cloudMap.get(local.id)
    
    if (!cloud) {
      // Local only - upload to cloud
      toUpload.push(local)
      merged.push(local)
    } else {
      // Both exist - use most recent
      const localTime = new Date(local.updatedAt).getTime()
      const cloudTime = new Date(cloud.updatedAt).getTime()
      
      if (localTime >= cloudTime) {
        // Local is newer - upload and use local
        toUpload.push(local)
        merged.push(local)
      } else {
        // Cloud is newer - use cloud
        merged.push(cloud)
      }
      cloudMap.delete(local.id)
    }
  }
  
  // Add cloud-only ideas
  for (const cloud of cloudMap.values()) {
    merged.push(cloud)
  }
  
  // Upload local changes
  for (const idea of toUpload) {
    await upsertIdea(userId, idea)
  }
  
  return merged
}
