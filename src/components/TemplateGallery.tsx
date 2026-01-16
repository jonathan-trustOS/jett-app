/**
 * TemplateGallery - Pre-built starting points for new projects
 * 
 * Templates provide sensible PRD defaults to help users get started quickly.
 * Now with categories and pagination!
 */

import { useState, useMemo } from 'react'

type Category = 'all' | 'productivity' | 'business' | 'social' | 'creative' | 'utility'

// Template icons as simple emoji representations
const TEMPLATES = [
  // ============ BLANK ============
  {
    id: 'blank',
    name: 'Blank Project',
    icon: '📄',
    description: 'Start from scratch',
    color: 'from-gray-600 to-gray-700',
    category: 'all' as Category,
    prd: null
  },

  // ============ PRODUCTIVITY ============
  {
    id: 'app-builder',
    name: 'App Builder',
    icon: '🔧',
    description: 'Visual app creation tool',
    color: 'from-violet-600 to-violet-700',
    category: 'productivity' as Category,
    prd: {
      overview: {
        name: 'App Builder',
        description: 'A visual app creation tool with drag-and-drop components, live preview, and code export',
        platform: 'web',
        coreGoal: 'Enable non-developers to build functional web applications'
      },
      targetUsers: {
        primaryUser: 'Designers and non-technical creators',
        userNeeds: 'Build apps without coding'
      },
      features: [
        { id: 'f1', title: 'Component Library', description: 'Drag-and-drop UI components (buttons, inputs, cards)', priority: 'must-have' },
        { id: 'f2', title: 'Canvas Editor', description: 'Visual editor with component placement', priority: 'must-have' },
        { id: 'f3', title: 'Live Preview', description: 'Real-time preview of the app being built', priority: 'must-have' },
        { id: 'f4', title: 'Properties Panel', description: 'Edit component properties (text, colors, sizes)', priority: 'must-have' },
        { id: 'f5', title: 'Page Management', description: 'Create and manage multiple pages/screens', priority: 'must-have' },
        { id: 'f6', title: 'Export Code', description: 'Export as React/HTML code', priority: 'nice-to-have' }
      ],
      screens: [
        { id: 's1', name: 'Editor', description: 'Main canvas with sidebar and preview' },
        { id: 's2', name: 'Components', description: 'Component library browser' },
        { id: 's3', name: 'Settings', description: 'App settings and export options' }
      ],
      dataModel: {
        needsDatabase: true,
        entities: [
          { id: 'e1', name: 'Project', fields: 'id, name, pages, settings, createdAt' },
          { id: 'e2', name: 'Page', fields: 'id, name, components, route' },
          { id: 'e3', name: 'Component', fields: 'id, type, props, children, position' }
        ]
      },
      designNotes: 'Clean workspace. Prominent preview. Intuitive drag-drop. Dark theme.',
      techStack: { frontend: 'React + Vite', backend: 'None', hosting: 'Vercel' }
    }
  },
  {
    id: 'kanban',
    name: 'Task Board',
    icon: '📋',
    description: 'Kanban-style task management',
    color: 'from-cyan-600 to-cyan-700',
    category: 'productivity' as Category,
    prd: {
      overview: {
        name: 'Task Board',
        description: 'A Kanban board for managing tasks across columns (To Do, In Progress, Done)',
        platform: 'web',
        coreGoal: 'Visual task management with drag-and-drop'
      },
      targetUsers: {
        primaryUser: 'Teams and individuals managing projects',
        userNeeds: 'Track task status and progress visually'
      },
      features: [
        { id: 'f1', title: 'Columns', description: 'Customizable status columns', priority: 'must-have' },
        { id: 'f2', title: 'Task Cards', description: 'Cards with title, description, labels', priority: 'must-have' },
        { id: 'f3', title: 'Drag & Drop', description: 'Move tasks between columns', priority: 'must-have' },
        { id: 'f4', title: 'Add/Edit Task', description: 'Create and modify tasks', priority: 'must-have' },
        { id: 'f5', title: 'Labels', description: 'Color-coded task labels', priority: 'nice-to-have' }
      ],
      screens: [
        { id: 's1', name: 'Board', description: 'Main Kanban board view' },
        { id: 's2', name: 'Task Detail', description: 'Full task detail modal' }
      ],
      dataModel: {
        needsDatabase: true,
        entities: [
          { id: 'e1', name: 'Column', fields: 'id, name, order' },
          { id: 'e2', name: 'Task', fields: 'id, title, description, columnId, order, labels' },
          { id: 'e3', name: 'Label', fields: 'id, name, color' }
        ]
      },
      designNotes: 'Cards should be compact. Clear column headers. Smooth drag-drop.',
      techStack: { frontend: 'React + Vite', backend: 'None', hosting: 'Vercel' }
    }
  },
  {
    id: 'notes',
    name: 'Notes App',
    icon: '📝',
    description: 'Rich text note taking',
    color: 'from-amber-600 to-amber-700',
    category: 'productivity' as Category,
    prd: {
      overview: {
        name: 'Notes',
        description: 'A note-taking app with folders, rich text editing, and search',
        platform: 'web',
        coreGoal: 'Capture and organize thoughts quickly'
      },
      targetUsers: {
        primaryUser: 'Students, professionals, anyone taking notes',
        userNeeds: 'Quick capture with good organization'
      },
      features: [
        { id: 'f1', title: 'Note Editor', description: 'Rich text editor with formatting', priority: 'must-have' },
        { id: 'f2', title: 'Folders', description: 'Organize notes into folders', priority: 'must-have' },
        { id: 'f3', title: 'Search', description: 'Full-text search across notes', priority: 'must-have' },
        { id: 'f4', title: 'Tags', description: 'Tag notes for cross-folder organization', priority: 'nice-to-have' },
        { id: 'f5', title: 'Markdown Support', description: 'Write in Markdown with preview', priority: 'nice-to-have' }
      ],
      screens: [
        { id: 's1', name: 'Notes List', description: 'Sidebar with folders and notes' },
        { id: 's2', name: 'Editor', description: 'Main note editing view' }
      ],
      dataModel: {
        needsDatabase: true,
        entities: [
          { id: 'e1', name: 'Note', fields: 'id, title, content, folderId, tags, updatedAt' },
          { id: 'e2', name: 'Folder', fields: 'id, name, parentId' }
        ]
      },
      designNotes: 'Three-column layout. Focus mode for writing. Quick capture.',
      techStack: { frontend: 'React + Vite', backend: 'None', hosting: 'Vercel' }
    }
  },
  {
    id: 'calendar',
    name: 'Calendar',
    icon: '📅',
    description: 'Event scheduling and planning',
    color: 'from-red-600 to-red-700',
    category: 'productivity' as Category,
    prd: {
      overview: {
        name: 'Calendar',
        description: 'A calendar app with day/week/month views and event management',
        platform: 'web',
        coreGoal: 'Schedule and track events and appointments'
      },
      targetUsers: {
        primaryUser: 'Professionals and busy individuals',
        userNeeds: 'Visualize schedule and manage time'
      },
      features: [
        { id: 'f1', title: 'Month View', description: 'Traditional calendar grid', priority: 'must-have' },
        { id: 'f2', title: 'Week View', description: 'Detailed weekly schedule', priority: 'must-have' },
        { id: 'f3', title: 'Create Event', description: 'Add events with time, title, description', priority: 'must-have' },
        { id: 'f4', title: 'Day View', description: 'Detailed single day view', priority: 'nice-to-have' },
        { id: 'f5', title: 'Recurring Events', description: 'Events that repeat', priority: 'nice-to-have' }
      ],
      screens: [
        { id: 's1', name: 'Calendar', description: 'Main calendar with view switcher' },
        { id: 's2', name: 'Event Modal', description: 'Create/edit event form' }
      ],
      dataModel: {
        needsDatabase: true,
        entities: [
          { id: 'e1', name: 'Event', fields: 'id, title, description, start, end, color, recurring' }
        ]
      },
      designNotes: 'Clean grid. Color-coded events. Easy navigation between dates.',
      techStack: { frontend: 'React + Vite', backend: 'None', hosting: 'Vercel' }
    }
  },
  {
    id: 'project-mgmt',
    name: 'Project Manager',
    icon: '📊',
    description: 'Full project management suite',
    color: 'from-emerald-600 to-emerald-700',
    category: 'productivity' as Category,
    prd: {
      overview: {
        name: 'Project Manager',
        description: 'A project management app with tasks, timelines, and team collaboration',
        platform: 'web',
        coreGoal: 'Manage projects from planning to completion'
      },
      targetUsers: {
        primaryUser: 'Project managers and teams',
        userNeeds: 'Track progress, deadlines, and team work'
      },
      features: [
        { id: 'f1', title: 'Project Dashboard', description: 'Overview of all projects and status', priority: 'must-have' },
        { id: 'f2', title: 'Task Lists', description: 'Tasks grouped by project with status', priority: 'must-have' },
        { id: 'f3', title: 'Timeline/Gantt', description: 'Visual project timeline', priority: 'must-have' },
        { id: 'f4', title: 'Team Members', description: 'Assign tasks to team members', priority: 'nice-to-have' },
        { id: 'f5', title: 'Progress Tracking', description: 'Completion percentages and milestones', priority: 'nice-to-have' }
      ],
      screens: [
        { id: 's1', name: 'Dashboard', description: 'All projects overview' },
        { id: 's2', name: 'Project', description: 'Single project with tasks' },
        { id: 's3', name: 'Timeline', description: 'Gantt chart view' }
      ],
      dataModel: {
        needsDatabase: true,
        entities: [
          { id: 'e1', name: 'Project', fields: 'id, name, description, status, startDate, endDate' },
          { id: 'e2', name: 'Task', fields: 'id, projectId, title, status, assignee, dueDate' },
          { id: 'e3', name: 'Member', fields: 'id, name, email, avatar' }
        ]
      },
      designNotes: 'Clear status indicators. Multiple views. Progress visualization.',
      techStack: { frontend: 'React + Vite', backend: 'None', hosting: 'Vercel' }
    }
  },

  // ============ BUSINESS ============
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: '📈',
    description: 'Analytics and data visualization',
    color: 'from-blue-600 to-blue-700',
    category: 'business' as Category,
    prd: {
      overview: {
        name: 'Dashboard',
        description: 'A modern analytics dashboard with charts, metrics, and data tables',
        platform: 'web',
        coreGoal: 'Display key metrics and insights in an intuitive interface'
      },
      targetUsers: {
        primaryUser: 'Business analysts and managers',
        userNeeds: 'Quick access to KPIs and trends'
      },
      features: [
        { id: 'f1', title: 'Metrics Cards', description: 'Summary cards showing key numbers (revenue, users, growth)', priority: 'must-have' },
        { id: 'f2', title: 'Charts', description: 'Line and bar charts for trend visualization', priority: 'must-have' },
        { id: 'f3', title: 'Data Table', description: 'Sortable, filterable table for detailed data', priority: 'must-have' },
        { id: 'f4', title: 'Date Range Picker', description: 'Filter data by time period', priority: 'nice-to-have' },
        { id: 'f5', title: 'Export', description: 'Export data as CSV', priority: 'nice-to-have' }
      ],
      screens: [
        { id: 's1', name: 'Overview', description: 'Main dashboard with all metrics' },
        { id: 's2', name: 'Details', description: 'Drill-down view for specific metrics' }
      ],
      dataModel: {
        needsDatabase: true,
        entities: [
          { id: 'e1', name: 'Metric', fields: 'id, name, value, change, period' },
          { id: 'e2', name: 'DataPoint', fields: 'id, metricId, timestamp, value' }
        ]
      },
      designNotes: 'Dark theme preferred. Use cards for metrics. Charts should be interactive.',
      techStack: { frontend: 'React + Vite', backend: 'None', hosting: 'Vercel' }
    }
  },
  {
    id: 'ecommerce',
    name: 'E-commerce',
    icon: '🛒',
    description: 'Product catalog and shopping',
    color: 'from-purple-600 to-purple-700',
    category: 'business' as Category,
    prd: {
      overview: {
        name: 'Shop',
        description: 'A product catalog with filtering, search, and shopping cart',
        platform: 'web',
        coreGoal: 'Enable browsing and selecting products for purchase'
      },
      targetUsers: {
        primaryUser: 'Online shoppers',
        userNeeds: 'Find products easily and add to cart'
      },
      features: [
        { id: 'f1', title: 'Product Grid', description: 'Responsive grid of product cards', priority: 'must-have' },
        { id: 'f2', title: 'Product Detail', description: 'Full product page with images, description, price', priority: 'must-have' },
        { id: 'f3', title: 'Shopping Cart', description: 'Add/remove items, update quantities', priority: 'must-have' },
        { id: 'f4', title: 'Filters', description: 'Filter by category, price, rating', priority: 'must-have' },
        { id: 'f5', title: 'Search', description: 'Search products by name', priority: 'nice-to-have' }
      ],
      screens: [
        { id: 's1', name: 'Catalog', description: 'Product listing with filters' },
        { id: 's2', name: 'Product', description: 'Single product detail' },
        { id: 's3', name: 'Cart', description: 'Shopping cart summary' }
      ],
      dataModel: {
        needsDatabase: true,
        entities: [
          { id: 'e1', name: 'Product', fields: 'id, name, description, price, images, categoryId, stock' },
          { id: 'e2', name: 'Category', fields: 'id, name, slug, parentId' },
          { id: 'e3', name: 'CartItem', fields: 'id, productId, quantity' }
        ]
      },
      designNotes: 'Product images should be prominent. Clear pricing. Easy add-to-cart.',
      techStack: { frontend: 'React + Vite', backend: 'None', hosting: 'Vercel' }
    }
  },
  {
    id: 'crm',
    name: 'CRM',
    icon: '👥',
    description: 'Customer relationship management',
    color: 'from-sky-600 to-sky-700',
    category: 'business' as Category,
    prd: {
      overview: {
        name: 'CRM',
        description: 'A customer relationship management tool with contacts, deals, and pipeline',
        platform: 'web',
        coreGoal: 'Track customer relationships and sales pipeline'
      },
      targetUsers: {
        primaryUser: 'Sales teams and account managers',
        userNeeds: 'Manage contacts and track deal progress'
      },
      features: [
        { id: 'f1', title: 'Contacts', description: 'Contact list with search and filters', priority: 'must-have' },
        { id: 'f2', title: 'Contact Detail', description: 'Full contact profile with history', priority: 'must-have' },
        { id: 'f3', title: 'Deals Pipeline', description: 'Visual sales pipeline with stages', priority: 'must-have' },
        { id: 'f4', title: 'Activity Log', description: 'Track calls, emails, meetings', priority: 'nice-to-have' },
        { id: 'f5', title: 'Companies', description: 'Group contacts by company', priority: 'nice-to-have' }
      ],
      screens: [
        { id: 's1', name: 'Contacts', description: 'Contact list view' },
        { id: 's2', name: 'Pipeline', description: 'Sales pipeline board' },
        { id: 's3', name: 'Contact Detail', description: 'Single contact profile' }
      ],
      dataModel: {
        needsDatabase: true,
        entities: [
          { id: 'e1', name: 'Contact', fields: 'id, name, email, phone, companyId, status' },
          { id: 'e2', name: 'Company', fields: 'id, name, website, industry' },
          { id: 'e3', name: 'Deal', fields: 'id, name, value, stage, contactId, probability' }
        ]
      },
      designNotes: 'Quick access to key info. Visual pipeline. Activity timeline.',
      techStack: { frontend: 'React + Vite', backend: 'None', hosting: 'Vercel' }
    }
  },
  {
    id: 'invoice',
    name: 'Invoice Builder',
    icon: '🧾',
    description: 'Create and manage invoices',
    color: 'from-teal-600 to-teal-700',
    category: 'business' as Category,
    prd: {
      overview: {
        name: 'Invoice Builder',
        description: 'An invoice creation tool with templates, line items, and PDF export',
        platform: 'web',
        coreGoal: 'Create professional invoices quickly'
      },
      targetUsers: {
        primaryUser: 'Freelancers and small businesses',
        userNeeds: 'Create and send invoices easily'
      },
      features: [
        { id: 'f1', title: 'Invoice Editor', description: 'Create invoice with line items', priority: 'must-have' },
        { id: 'f2', title: 'Client Management', description: 'Save and reuse client info', priority: 'must-have' },
        { id: 'f3', title: 'Invoice List', description: 'Track all invoices and status', priority: 'must-have' },
        { id: 'f4', title: 'PDF Export', description: 'Download invoice as PDF', priority: 'must-have' },
        { id: 'f5', title: 'Templates', description: 'Custom invoice templates', priority: 'nice-to-have' }
      ],
      screens: [
        { id: 's1', name: 'Invoices', description: 'List of all invoices' },
        { id: 's2', name: 'Editor', description: 'Invoice creation/edit form' },
        { id: 's3', name: 'Preview', description: 'Invoice preview before export' }
      ],
      dataModel: {
        needsDatabase: true,
        entities: [
          { id: 'e1', name: 'Invoice', fields: 'id, number, clientId, items, total, status, dueDate' },
          { id: 'e2', name: 'Client', fields: 'id, name, email, address' },
          { id: 'e3', name: 'LineItem', fields: 'id, description, quantity, rate, amount' }
        ]
      },
      designNotes: 'Clean, professional look. Auto-calculate totals. Clear status tracking.',
      techStack: { frontend: 'React + Vite', backend: 'None', hosting: 'Vercel' }
    }
  },
  {
    id: 'landing',
    name: 'Landing Page',
    icon: '🚀',
    description: 'Marketing and conversion',
    color: 'from-orange-600 to-orange-700',
    category: 'business' as Category,
    prd: {
      overview: {
        name: 'Landing Page',
        description: 'A conversion-focused landing page with hero, features, testimonials, and CTA',
        platform: 'web',
        coreGoal: 'Convert visitors into leads or customers'
      },
      targetUsers: {
        primaryUser: 'Potential customers',
        userNeeds: 'Understand the product and take action'
      },
      features: [
        { id: 'f1', title: 'Hero Section', description: 'Headline, subhead, CTA button, hero image', priority: 'must-have' },
        { id: 'f2', title: 'Features Section', description: 'Grid of key features with icons', priority: 'must-have' },
        { id: 'f3', title: 'Testimonials', description: 'Customer quotes with avatars', priority: 'must-have' },
        { id: 'f4', title: 'Pricing', description: 'Pricing tiers comparison', priority: 'nice-to-have' },
        { id: 'f5', title: 'Contact Form', description: 'Simple contact/signup form', priority: 'must-have' }
      ],
      screens: [
        { id: 's1', name: 'Home', description: 'Single page with all sections' }
      ],
      dataModel: {
        needsDatabase: false,
        entities: []
      },
      designNotes: 'Bold hero. Clear value proposition. Strong CTAs. Social proof.',
      techStack: { frontend: 'React + Vite', backend: 'None', hosting: 'Vercel' }
    }
  },

  // ============ SOCIAL ============
  {
    id: 'social',
    name: 'Social Feed',
    icon: '💬',
    description: 'Posts, likes, and comments',
    color: 'from-pink-600 to-pink-700',
    category: 'social' as Category,
    prd: {
      overview: {
        name: 'Social Feed',
        description: 'A social media-style feed with posts, likes, and comments',
        platform: 'web',
        coreGoal: 'Enable sharing and engaging with content'
      },
      targetUsers: {
        primaryUser: 'Community members',
        userNeeds: 'Share updates and interact with others'
      },
      features: [
        { id: 'f1', title: 'Feed', description: 'Scrollable list of posts', priority: 'must-have' },
        { id: 'f2', title: 'Create Post', description: 'Compose and publish posts', priority: 'must-have' },
        { id: 'f3', title: 'Like', description: 'Like/unlike posts', priority: 'must-have' },
        { id: 'f4', title: 'Comments', description: 'Comment on posts', priority: 'must-have' },
        { id: 'f5', title: 'User Profile', description: 'Profile page with user posts', priority: 'nice-to-have' }
      ],
      screens: [
        { id: 's1', name: 'Feed', description: 'Main feed view' },
        { id: 's2', name: 'Profile', description: 'User profile page' },
        { id: 's3', name: 'Post Detail', description: 'Single post with comments' }
      ],
      dataModel: {
        needsDatabase: true,
        entities: [
          { id: 'e1', name: 'User', fields: 'id, name, avatar, bio' },
          { id: 'e2', name: 'Post', fields: 'id, authorId, content, createdAt' },
          { id: 'e3', name: 'Like', fields: 'id, postId, userId' },
          { id: 'e4', name: 'Comment', fields: 'id, postId, userId, content, createdAt' }
        ]
      },
      designNotes: 'Infinite scroll feel. Clear interaction buttons. User avatars throughout.',
      techStack: { frontend: 'React + Vite', backend: 'None', hosting: 'Vercel' }
    }
  },
  {
    id: 'chat',
    name: 'Chat App',
    icon: '💭',
    description: 'Real-time messaging',
    color: 'from-indigo-600 to-indigo-700',
    category: 'social' as Category,
    prd: {
      overview: {
        name: 'Chat',
        description: 'A messaging app with conversations, real-time messages, and user presence',
        platform: 'web',
        coreGoal: 'Enable real-time communication'
      },
      targetUsers: {
        primaryUser: 'Teams or friends communicating',
        userNeeds: 'Quick, reliable messaging'
      },
      features: [
        { id: 'f1', title: 'Conversation List', description: 'List of all conversations', priority: 'must-have' },
        { id: 'f2', title: 'Message Thread', description: 'View and send messages in a conversation', priority: 'must-have' },
        { id: 'f3', title: 'New Conversation', description: 'Start a new chat', priority: 'must-have' },
        { id: 'f4', title: 'Online Status', description: 'Show who is online', priority: 'nice-to-have' },
        { id: 'f5', title: 'Typing Indicator', description: 'Show when someone is typing', priority: 'nice-to-have' }
      ],
      screens: [
        { id: 's1', name: 'Inbox', description: 'Conversation list' },
        { id: 's2', name: 'Chat', description: 'Message thread view' }
      ],
      dataModel: {
        needsDatabase: true,
        entities: [
          { id: 'e1', name: 'User', fields: 'id, name, avatar, status' },
          { id: 'e2', name: 'Conversation', fields: 'id, participants, lastMessage, updatedAt' },
          { id: 'e3', name: 'Message', fields: 'id, conversationId, senderId, content, createdAt' }
        ]
      },
      designNotes: 'Split view with list and thread. Message bubbles. Timestamps.',
      techStack: { frontend: 'React + Vite', backend: 'None', hosting: 'Vercel' }
    }
  },
  {
    id: 'forum',
    name: 'Forum',
    icon: '🗣️',
    description: 'Discussion board and threads',
    color: 'from-rose-600 to-rose-700',
    category: 'social' as Category,
    prd: {
      overview: {
        name: 'Forum',
        description: 'A discussion forum with categories, threads, and replies',
        platform: 'web',
        coreGoal: 'Enable community discussions'
      },
      targetUsers: {
        primaryUser: 'Community members',
        userNeeds: 'Ask questions and share knowledge'
      },
      features: [
        { id: 'f1', title: 'Categories', description: 'Organize threads by topic', priority: 'must-have' },
        { id: 'f2', title: 'Thread List', description: 'List threads in a category', priority: 'must-have' },
        { id: 'f3', title: 'Thread View', description: 'View thread with all replies', priority: 'must-have' },
        { id: 'f4', title: 'Create Thread', description: 'Start a new discussion', priority: 'must-have' },
        { id: 'f5', title: 'Reply', description: 'Reply to threads', priority: 'must-have' }
      ],
      screens: [
        { id: 's1', name: 'Home', description: 'Category list' },
        { id: 's2', name: 'Category', description: 'Threads in category' },
        { id: 's3', name: 'Thread', description: 'Thread with replies' }
      ],
      dataModel: {
        needsDatabase: true,
        entities: [
          { id: 'e1', name: 'Category', fields: 'id, name, description, threadCount' },
          { id: 'e2', name: 'Thread', fields: 'id, title, content, authorId, categoryId, replyCount' },
          { id: 'e3', name: 'Reply', fields: 'id, threadId, authorId, content, createdAt' }
        ]
      },
      designNotes: 'Clear hierarchy. Thread previews. User avatars and timestamps.',
      techStack: { frontend: 'React + Vite', backend: 'None', hosting: 'Vercel' }
    }
  },

  // ============ CREATIVE ============
  {
    id: 'blog',
    name: 'Blog / CMS',
    icon: '✍️',
    description: 'Content publishing platform',
    color: 'from-green-600 to-green-700',
    category: 'creative' as Category,
    prd: {
      overview: {
        name: 'Blog',
        description: 'A minimal blog with posts, categories, and a clean reading experience',
        platform: 'web',
        coreGoal: 'Enable writing and publishing articles with great readability'
      },
      targetUsers: {
        primaryUser: 'Writers and content creators',
        userNeeds: 'Easy publishing with beautiful presentation'
      },
      features: [
        { id: 'f1', title: 'Post List', description: 'Grid/list of blog posts with previews', priority: 'must-have' },
        { id: 'f2', title: 'Post View', description: 'Full article with typography and images', priority: 'must-have' },
        { id: 'f3', title: 'Categories', description: 'Filter posts by category', priority: 'must-have' },
        { id: 'f4', title: 'Search', description: 'Search posts by title or content', priority: 'nice-to-have' },
        { id: 'f5', title: 'Author Page', description: 'Author bio and their posts', priority: 'nice-to-have' }
      ],
      screens: [
        { id: 's1', name: 'Home', description: 'Featured and recent posts' },
        { id: 's2', name: 'Post', description: 'Single article view' },
        { id: 's3', name: 'Category', description: 'Posts filtered by category' }
      ],
      dataModel: {
        needsDatabase: true,
        entities: [
          { id: 'e1', name: 'Post', fields: 'id, title, content, excerpt, coverImage, authorId, categoryId, publishedAt' },
          { id: 'e2', name: 'Category', fields: 'id, name, slug, description' },
          { id: 'e3', name: 'Author', fields: 'id, name, bio, avatar' }
        ]
      },
      designNotes: 'Focus on readability. Large typography. Minimal distractions.',
      techStack: { frontend: 'React + Vite', backend: 'None', hosting: 'Vercel' }
    }
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    icon: '🎨',
    description: 'Showcase work and projects',
    color: 'from-fuchsia-600 to-fuchsia-700',
    category: 'creative' as Category,
    prd: {
      overview: {
        name: 'Portfolio',
        description: 'A portfolio site to showcase projects with images and descriptions',
        platform: 'web',
        coreGoal: 'Showcase work and attract opportunities'
      },
      targetUsers: {
        primaryUser: 'Designers, developers, creatives',
        userNeeds: 'Display work professionally'
      },
      features: [
        { id: 'f1', title: 'Project Gallery', description: 'Grid of project thumbnails', priority: 'must-have' },
        { id: 'f2', title: 'Project Detail', description: 'Full project page with images and description', priority: 'must-have' },
        { id: 'f3', title: 'About Section', description: 'Bio and skills', priority: 'must-have' },
        { id: 'f4', title: 'Contact', description: 'Contact form or links', priority: 'must-have' },
        { id: 'f5', title: 'Filter by Type', description: 'Filter projects by category', priority: 'nice-to-have' }
      ],
      screens: [
        { id: 's1', name: 'Home', description: 'Project gallery and intro' },
        { id: 's2', name: 'Project', description: 'Single project detail' },
        { id: 's3', name: 'About', description: 'About me page' }
      ],
      dataModel: {
        needsDatabase: false,
        entities: [
          { id: 'e1', name: 'Project', fields: 'id, title, description, images, category, url' }
        ]
      },
      designNotes: 'Images are key. Clean, minimal design. Easy navigation.',
      techStack: { frontend: 'React + Vite', backend: 'None', hosting: 'Vercel' }
    }
  },
  {
    id: 'music',
    name: 'Music Player',
    icon: '🎵',
    description: 'Audio player with playlists',
    color: 'from-lime-600 to-lime-700',
    category: 'creative' as Category,
    prd: {
      overview: {
        name: 'Music Player',
        description: 'A music player with library, playlists, and playback controls',
        platform: 'web',
        coreGoal: 'Play and organize music'
      },
      targetUsers: {
        primaryUser: 'Music listeners',
        userNeeds: 'Easy access to music with good organization'
      },
      features: [
        { id: 'f1', title: 'Now Playing', description: 'Current track with artwork and controls', priority: 'must-have' },
        { id: 'f2', title: 'Library', description: 'Browse all tracks', priority: 'must-have' },
        { id: 'f3', title: 'Playlists', description: 'Create and manage playlists', priority: 'must-have' },
        { id: 'f4', title: 'Search', description: 'Search tracks by name/artist', priority: 'nice-to-have' },
        { id: 'f5', title: 'Queue', description: 'View and edit play queue', priority: 'nice-to-have' }
      ],
      screens: [
        { id: 's1', name: 'Player', description: 'Now playing view' },
        { id: 's2', name: 'Library', description: 'All tracks and albums' },
        { id: 's3', name: 'Playlist', description: 'Single playlist view' }
      ],
      dataModel: {
        needsDatabase: true,
        entities: [
          { id: 'e1', name: 'Track', fields: 'id, title, artist, album, duration, artwork, url' },
          { id: 'e2', name: 'Playlist', fields: 'id, name, tracks, createdAt' }
        ]
      },
      designNotes: 'Album art prominent. Persistent player bar. Smooth transitions.',
      techStack: { frontend: 'React + Vite', backend: 'None', hosting: 'Vercel' }
    }
  },

  // ============ UTILITY ============
  {
    id: 'weather',
    name: 'Weather App',
    icon: '🌤️',
    description: 'Forecast and conditions',
    color: 'from-sky-500 to-blue-600',
    category: 'utility' as Category,
    prd: {
      overview: {
        name: 'Weather',
        description: 'A weather app with current conditions, forecast, and location search',
        platform: 'web',
        coreGoal: 'Quick access to weather information'
      },
      targetUsers: {
        primaryUser: 'Anyone checking weather',
        userNeeds: 'Current conditions and forecast at a glance'
      },
      features: [
        { id: 'f1', title: 'Current Weather', description: 'Temperature, conditions, feels like', priority: 'must-have' },
        { id: 'f2', title: 'Forecast', description: 'Daily and hourly forecast', priority: 'must-have' },
        { id: 'f3', title: 'Location Search', description: 'Search for any city', priority: 'must-have' },
        { id: 'f4', title: 'Weather Details', description: 'Humidity, wind, UV index', priority: 'nice-to-have' },
        { id: 'f5', title: 'Saved Locations', description: 'Save favorite cities', priority: 'nice-to-have' }
      ],
      screens: [
        { id: 's1', name: 'Home', description: 'Current weather and forecast' },
        { id: 's2', name: 'Search', description: 'Location search' }
      ],
      dataModel: {
        needsDatabase: false,
        entities: [
          { id: 'e1', name: 'Location', fields: 'id, name, lat, lon' },
          { id: 'e2', name: 'Weather', fields: 'temp, conditions, humidity, wind, forecast' }
        ]
      },
      designNotes: 'Beautiful weather icons. Dynamic backgrounds. Clean data display.',
      techStack: { frontend: 'React + Vite', backend: 'None', hosting: 'Vercel' }
    }
  },
  {
    id: 'recipe',
    name: 'Recipe App',
    icon: '🍳',
    description: 'Cook and save recipes',
    color: 'from-orange-500 to-red-600',
    category: 'utility' as Category,
    prd: {
      overview: {
        name: 'Recipes',
        description: 'A recipe app with browse, save, and step-by-step cooking mode',
        platform: 'web',
        coreGoal: 'Find and follow recipes easily'
      },
      targetUsers: {
        primaryUser: 'Home cooks',
        userNeeds: 'Find recipes and follow instructions while cooking'
      },
      features: [
        { id: 'f1', title: 'Recipe Browse', description: 'Browse recipes by category', priority: 'must-have' },
        { id: 'f2', title: 'Recipe Detail', description: 'Ingredients, instructions, timing', priority: 'must-have' },
        { id: 'f3', title: 'Cooking Mode', description: 'Step-by-step view for cooking', priority: 'must-have' },
        { id: 'f4', title: 'Save Favorites', description: 'Save recipes to collection', priority: 'nice-to-have' },
        { id: 'f5', title: 'Search', description: 'Search by ingredient or name', priority: 'nice-to-have' }
      ],
      screens: [
        { id: 's1', name: 'Browse', description: 'Recipe categories and list' },
        { id: 's2', name: 'Recipe', description: 'Full recipe detail' },
        { id: 's3', name: 'Cook', description: 'Cooking mode view' }
      ],
      dataModel: {
        needsDatabase: true,
        entities: [
          { id: 'e1', name: 'Recipe', fields: 'id, title, description, image, prepTime, cookTime, servings' },
          { id: 'e2', name: 'Ingredient', fields: 'id, recipeId, name, amount, unit' },
          { id: 'e3', name: 'Step', fields: 'id, recipeId, order, instruction, timer' }
        ]
      },
      designNotes: 'Appetizing photos. Clear ingredient lists. Large text for cooking mode.',
      techStack: { frontend: 'React + Vite', backend: 'None', hosting: 'Vercel' }
    }
  },
  {
    id: 'fitness',
    name: 'Fitness Tracker',
    icon: '💪',
    description: 'Workouts and progress',
    color: 'from-green-500 to-emerald-600',
    category: 'utility' as Category,
    prd: {
      overview: {
        name: 'Fitness Tracker',
        description: 'Track workouts, exercises, and progress over time',
        platform: 'web',
        coreGoal: 'Log workouts and see fitness progress'
      },
      targetUsers: {
        primaryUser: 'Fitness enthusiasts',
        userNeeds: 'Track workouts and measure progress'
      },
      features: [
        { id: 'f1', title: 'Workout Log', description: 'Log workouts with exercises', priority: 'must-have' },
        { id: 'f2', title: 'Exercise Library', description: 'Browse exercises by muscle group', priority: 'must-have' },
        { id: 'f3', title: 'Progress Charts', description: 'Track weight, reps over time', priority: 'must-have' },
        { id: 'f4', title: 'Workout Templates', description: 'Save and reuse workout routines', priority: 'nice-to-have' },
        { id: 'f5', title: 'Personal Records', description: 'Track PRs for each exercise', priority: 'nice-to-have' }
      ],
      screens: [
        { id: 's1', name: 'Dashboard', description: 'Recent workouts and stats' },
        { id: 's2', name: 'Log Workout', description: 'Add workout with exercises' },
        { id: 's3', name: 'Progress', description: 'Charts and history' }
      ],
      dataModel: {
        needsDatabase: true,
        entities: [
          { id: 'e1', name: 'Workout', fields: 'id, date, duration, notes' },
          { id: 'e2', name: 'Exercise', fields: 'id, name, muscleGroup, description' },
          { id: 'e3', name: 'Set', fields: 'id, workoutId, exerciseId, weight, reps' }
        ]
      },
      designNotes: 'Quick logging. Visual progress. Motivating stats.',
      techStack: { frontend: 'React + Vite', backend: 'None', hosting: 'Vercel' }
    }
  },
  {
    id: 'quiz',
    name: 'Quiz Builder',
    icon: '❓',
    description: 'Create and take quizzes',
    color: 'from-violet-500 to-purple-600',
    category: 'utility' as Category,
    prd: {
      overview: {
        name: 'Quiz Builder',
        description: 'Create quizzes with multiple choice and see results',
        platform: 'web',
        coreGoal: 'Create and share quizzes easily'
      },
      targetUsers: {
        primaryUser: 'Teachers, trainers, content creators',
        userNeeds: 'Create quizzes and view results'
      },
      features: [
        { id: 'f1', title: 'Quiz Creator', description: 'Build quizzes with questions and answers', priority: 'must-have' },
        { id: 'f2', title: 'Take Quiz', description: 'Interactive quiz-taking experience', priority: 'must-have' },
        { id: 'f3', title: 'Results', description: 'Score and correct answers display', priority: 'must-have' },
        { id: 'f4', title: 'Quiz List', description: 'Browse and manage quizzes', priority: 'must-have' },
        { id: 'f5', title: 'Question Types', description: 'Multiple choice, true/false', priority: 'nice-to-have' }
      ],
      screens: [
        { id: 's1', name: 'Quizzes', description: 'List of all quizzes' },
        { id: 's2', name: 'Creator', description: 'Quiz builder interface' },
        { id: 's3', name: 'Take', description: 'Quiz-taking view' },
        { id: 's4', name: 'Results', description: 'Score and review' }
      ],
      dataModel: {
        needsDatabase: true,
        entities: [
          { id: 'e1', name: 'Quiz', fields: 'id, title, description, questions' },
          { id: 'e2', name: 'Question', fields: 'id, quizId, text, options, correctAnswer' },
          { id: 'e3', name: 'Result', fields: 'id, quizId, score, answers, completedAt' }
        ]
      },
      designNotes: 'Clear question display. Progress indicator. Celebration on completion.',
      techStack: { frontend: 'React + Vite', backend: 'None', hosting: 'Vercel' }
    }
  },
  {
    id: 'bookmarks',
    name: 'Bookmark Manager',
    icon: '🔖',
    description: 'Save and organize links',
    color: 'from-amber-500 to-orange-600',
    category: 'utility' as Category,
    prd: {
      overview: {
        name: 'Bookmarks',
        description: 'Save, organize, and search bookmarks with tags and folders',
        platform: 'web',
        coreGoal: 'Organize and find saved links'
      },
      targetUsers: {
        primaryUser: 'Researchers, knowledge workers',
        userNeeds: 'Save links and find them later'
      },
      features: [
        { id: 'f1', title: 'Add Bookmark', description: 'Save URL with title and tags', priority: 'must-have' },
        { id: 'f2', title: 'Folders', description: 'Organize bookmarks in folders', priority: 'must-have' },
        { id: 'f3', title: 'Search', description: 'Search by title or tag', priority: 'must-have' },
        { id: 'f4', title: 'Tags', description: 'Tag bookmarks for easy filtering', priority: 'must-have' },
        { id: 'f5', title: 'Preview', description: 'Show page preview/favicon', priority: 'nice-to-have' }
      ],
      screens: [
        { id: 's1', name: 'All Bookmarks', description: 'Main list view' },
        { id: 's2', name: 'Folder', description: 'Bookmarks in a folder' },
        { id: 's3', name: 'Add/Edit', description: 'Bookmark form' }
      ],
      dataModel: {
        needsDatabase: true,
        entities: [
          { id: 'e1', name: 'Bookmark', fields: 'id, url, title, description, folderId, tags, createdAt' },
          { id: 'e2', name: 'Folder', fields: 'id, name, parentId' },
          { id: 'e3', name: 'Tag', fields: 'id, name' }
        ]
      },
      designNotes: 'Quick add. Good search. Visual organization.',
      techStack: { frontend: 'React + Vite', backend: 'None', hosting: 'Vercel' }
    }
  }
]

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'business', label: 'Business' },
  { id: 'social', label: 'Social' },
  { id: 'creative', label: 'Creative' },
  { id: 'utility', label: 'Utility' }
]

const ITEMS_PER_PAGE = 8

interface TemplateGalleryProps {
  onSelectTemplate: (template: typeof TEMPLATES[0]) => void
  onClose: () => void
}

export default function TemplateGallery({ onSelectTemplate, onClose }: TemplateGalleryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [category, setCategory] = useState<Category>('all')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter(t => {
      const matchesCategory = category === 'all' || t.category === category || t.id === 'blank'
      const matchesSearch = search === '' || 
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [category, search])

  // Paginate
  const totalPages = Math.ceil(filteredTemplates.length / ITEMS_PER_PAGE)
  const paginatedTemplates = filteredTemplates.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  // Reset page when filter changes
  const handleCategoryChange = (cat: Category) => {
    setCategory(cat)
    setPage(1)
  }

  const handleSelect = (template: typeof TEMPLATES[0]) => {
    setSelectedId(template.id)
    onSelectTemplate(template)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div 
        className="w-full max-w-5xl max-h-[85vh] rounded-xl overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-primary)' }}
      >
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Choose a Template</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {filteredTemplates.length} templates available
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Search and Categories */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search templates..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="flex-1 px-3 py-2 rounded-lg text-sm"
              style={{ 
                background: 'var(--bg-secondary)', 
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            />
            <div className="flex gap-1 flex-wrap">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    category === cat.id
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-700'
                  }`}
                  style={category !== cat.id ? { background: 'var(--bg-tertiary)' } : {}}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedTemplates.map(template => (
              <button
                key={template.id}
                onClick={() => handleSelect(template)}
                className={`p-4 rounded-xl text-left transition-all ${
                  selectedId === template.id 
                    ? 'ring-2 ring-[var(--accent-primary)] bg-[var(--bg-secondary)]' 
                    : 'hover:bg-[var(--bg-secondary)]'
                }`}
                style={{ border: '1px solid var(--border-primary)' }}
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${template.color} flex items-center justify-center text-2xl mb-3`}>
                  {template.icon}
                </div>
                <h3 className="font-medium text-sm">{template.name}</h3>
                <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  {template.description}
                </p>
              </button>
            ))}
          </div>

          {/* Empty state */}
          {paginatedTemplates.length === 0 && (
            <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
              <p>No templates found matching "{search}"</p>
            </div>
          )}
        </div>

        {/* Footer with Pagination */}
        <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--border-primary)' }}>
          {/* Pagination */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded text-sm disabled:opacity-30"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              ← Prev
            </button>
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded text-sm disabled:opacity-30"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              Next →
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ background: 'var(--bg-tertiary)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// Export templates for use in other components
export { TEMPLATES }
