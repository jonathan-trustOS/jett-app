import { useState } from 'react'
import jettLogo from '../assets/jett-logo.png'

interface Project {
  id: string
  name: string
  status: 'draft' | 'building' | 'complete'
  prd: any
  tasks: any[]
  deployUrl: string | null
  createdAt: string
  updatedAt: string
}

interface Props {
  projects: Project[]
  onCreateProject: (name: string) => void
  onSelectProject: (project: Project) => void
  onDeleteProject: (projectId: string) => void
  onImportFigma: () => void
  apiKey: string
}

export default function ProjectList({
  projects,
  onCreateProject,
  onSelectProject,
  onDeleteProject,
  onImportFigma,
  apiKey,
  onOpenSettings
}: Props) {
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  
  // Search and pagination
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alpha' | 'alpha-desc' | 'draft' | 'building' | 'complete' | 'updated'>('newest')
  const projectsPerPage = 12
  
  // Filter projects by search
  const searchFilteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.prd?.overview?.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  // Sort projects
  const filteredProjects = [...searchFilteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'updated':
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      case 'alpha':
        return a.name.localeCompare(b.name)
      case 'alpha-desc':
        return b.name.localeCompare(a.name)
      case 'draft':
        if (a.status === 'draft' && b.status !== 'draft') return -1
        if (b.status === 'draft' && a.status !== 'draft') return 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'building':
        if (a.status === 'building' && b.status !== 'building') return -1
        if (b.status === 'building' && a.status !== 'building') return 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'complete':
        if (a.status === 'complete' && b.status !== 'complete') return -1
        if (b.status === 'complete' && a.status !== 'complete') return 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      default:
        return 0
    }
  })
  
  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage)
  const startIndex = (currentPage - 1) * projectsPerPage
  const paginatedProjects = filteredProjects.slice(startIndex, startIndex + projectsPerPage)
  
  // Reset to page 1 when search changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const handleCreate = () => {
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim())
      setNewProjectName('')
      setShowNewProject(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <span 
            className="px-2 py-0.5 text-xs rounded-full font-medium"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
          >
            Draft
          </span>
        )
      case 'building':
        return (
          <span 
            className="px-2 py-0.5 text-xs rounded-full font-medium"
            style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}
          >
            Building
          </span>
        )
      case 'complete':
        return (
          <span 
            className="px-2 py-0.5 text-xs rounded-full font-medium"
            style={{ background: 'var(--success-light)', color: 'var(--success)' }}
          >
            Complete
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="h-full p-8 overflow-auto" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <img 
                src={jettLogo} 
                alt="Jett" 
                className="w-12 h-12 rounded-full border-2 border-white shadow-lg"
              />
              Jett
            </h1>
            <p className="mt-1" style={{ color: 'var(--text-tertiary)' }}>
              The AI that builds apps for designers
            </p>
          </div>
          
          {/* Search */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--text-tertiary)' }}
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg transition-all duration-150 focus:outline-none"
                style={{ 
                  background: 'var(--bg-secondary)', 
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border-primary)'}
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-slate-700"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onImportFigma}
              className="px-4 py-2.5 font-medium rounded-lg transition-all duration-150 flex items-center gap-2"
              style={{ 
                background: 'var(--bg-elevated)', 
                color: 'var(--text-primary)',
                border: '1px solid var(--border-primary)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-hover)'
                e.currentTarget.style.borderColor = 'var(--border-secondary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-elevated)'
                e.currentTarget.style.borderColor = 'var(--border-primary)'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 38 57" fill="none">
                <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#1ABCFE"/>
                <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83"/>
                <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262"/>
                <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E"/>
                <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF"/>
              </svg>
              Import Figma
            </button>
            <button
              onClick={() => setShowNewProject(true)}
              className="px-4 py-2.5 font-medium rounded-lg transition-all duration-150 flex items-center gap-2"
              style={{ 
                background: 'var(--accent-primary)', 
                color: 'white'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-primary-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent-primary)'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Project
            </button>
          </div>
        </div>

        {/* API Key Warning */}
        {!apiKey && (
          <button 
            onClick={onOpenSettings}
            className="mb-6 p-4 rounded-xl flex items-center gap-3 w-full text-left transition-all duration-150 hover:scale-[1.01]"
            style={{ background: 'var(--accent-primary)', border: 'none', cursor: 'pointer' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <p style={{ color: 'white', fontWeight: 500 }}>
              To enable Jett, click here to add your API key.
            </p>
          </button>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div 
            className="flex flex-col items-center justify-center py-20 rounded-2xl"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
          >
            <img 
              src={jettLogo} 
              alt="Jett" 
              className="w-24 h-24 rounded-full border-2 border-white shadow-lg mb-4 opacity-50"
            />
            <h2 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              No projects yet
            </h2>
            <p className="mb-6" style={{ color: 'var(--text-tertiary)' }}>
              Create your first project or import from Figma
            </p>
            <div className="flex gap-3">
              <button
                onClick={onImportFigma}
                className="px-4 py-2.5 font-medium rounded-lg transition-all duration-150 flex items-center gap-2"
                style={{ 
                  background: 'var(--bg-elevated)', 
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-primary)'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 38 57" fill="none">
                  <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#1ABCFE"/>
                  <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83"/>
                  <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262"/>
                  <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E"/>
                  <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF"/>
                </svg>
                Import Figma
              </button>
              <button
                onClick={() => setShowNewProject(true)}
                className="px-4 py-2.5 font-medium rounded-lg transition-all duration-150"
                style={{ background: 'var(--accent-primary)', color: 'white' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--accent-primary-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent-primary)'}
              >
                Create Project
              </button>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div 
            className="flex flex-col items-center justify-center py-16 rounded-2xl"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
          >
            <div className="text-5xl mb-4 opacity-50">🔍</div>
            <h2 className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              No projects found
            </h2>
            <p className="mb-4" style={{ color: 'var(--text-tertiary)' }}>
              No projects match "{searchQuery}"
            </p>
            <button
              onClick={() => handleSearchChange('')}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
            >
              Clear search
            </button>
          </div>
        ) : (
          <>
            {/* Results count and sort */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                {searchQuery 
                  ? `${filteredProjects.length} project${filteredProjects.length !== 1 ? 's' : ''} found`
                  : `${filteredProjects.length} project${filteredProjects.length !== 1 ? 's' : ''}`
                }
              </p>
              
              {/* Sort dropdown */}
              <div className="flex items-center gap-2">
                <label className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as any)
                    setCurrentPage(1)
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm outline-none appearance-none cursor-pointer"
                  style={{ 
                    background: 'var(--bg-secondary)', 
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-primary)',
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 8px center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '14px',
                    paddingRight: '28px'
                  }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="updated">Recently Updated</option>
                  <option value="alpha">A → Z</option>
                  <option value="alpha-desc">Z → A</option>
                  <option value="draft">Draft Only</option>
                  <option value="building">Building Only</option>
                  <option value="complete">Complete Only</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedProjects.map(project => (
                <div
                  key={project.id}
                  className="rounded-xl p-5 transition-all duration-150 cursor-pointer group relative"
                  style={{ 
                    background: 'var(--bg-elevated)', 
                    border: '1px solid var(--border-primary)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                  onClick={() => onSelectProject(project)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-secondary)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-primary)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg truncate flex-1 mr-2" style={{ color: 'var(--text-primary)' }}>
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {getStatusBadge(project.status)}
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          if (confirm(`Delete "${project.name}"?`)) {
                            onDeleteProject(project.id)
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all"
                        style={{ color: 'var(--text-tertiary)' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <p 
                    className="text-sm mb-4 line-clamp-2 min-h-[40px]" 
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {project.prd?.overview?.description || 'No description'}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <span>{formatDate(project.createdAt)}</span>
                    <span>{project.tasks?.length || 0} tasks</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-50 transition-all"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                >
                  Previous
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 rounded-lg text-sm transition-all"
                      style={{ 
                        background: currentPage === page ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                        color: currentPage === page ? 'white' : 'var(--text-secondary)'
                      }}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-50 transition-all"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* New Project Modal */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div 
            className="rounded-2xl p-6 w-full max-w-md"
            style={{ 
              background: 'var(--bg-elevated)', 
              border: '1px solid var(--border-primary)',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
              Create New Project
            </h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Project Name
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-all duration-150"
                style={{ 
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-primary)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-focus)'
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-primary-light)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-primary)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
                placeholder="My Awesome App"
                autoFocus
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNewProject(false)}
                className="px-4 py-2 rounded-lg transition-all duration-150"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-hover)'
                  e.currentTarget.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newProjectName.trim()}
                className="px-4 py-2 font-medium rounded-lg transition-all duration-150 disabled:opacity-50"
                style={{ 
                  background: 'var(--accent-primary)', 
                  color: 'white'
                }}
                onMouseEnter={(e) => {
                  if (newProjectName.trim()) {
                    e.currentTarget.style.background = 'var(--accent-primary-hover)'
                  }
                }}
                onMouseLeave={(e) => e.currentTarget.style.background = 'var(--accent-primary)'}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
