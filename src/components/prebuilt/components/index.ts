/**
 * Jett Pre-built Components Library
 * 40 production-ready React components
 * 
 * @example
 * // Import by category
 * import { AuthFlow, DataTable } from './components/core'
 * import { KanbanBoard } from './components/content'
 * 
 * // Or import from root
 * import { AuthFlow, KanbanBoard, ToastProvider } from './components'
 */

// Core - Essential app infrastructure (5)
export { AuthFlow, DataTable, NotesSystem, SettingsPage, UserProfile } from './core'

// Content - Rich content display and editing (5)
export { CalendarView, KanbanBoard, RichTextEditor, Timeline, TodoList } from './content'

// Social - User interaction and engagement (4)
export { CommentsThread, FollowSystem, LikesSystem, ShareModal } from './social'

// Media - Audio, video, images, and files (4)
export { AudioPlayer, FileUploader, ImageGallery, VideoPlayer } from './media'

// Navigation - App navigation and routing (6)
export { Breadcrumbs, CommandPalette, MobileBottomNav, Sidebar, SidebarNav, Tabs } from './navigation'

// Dashboard - Data visualization and metrics (4)
export { ActivityFeed, Chart, ProgressRing, StatsCard } from './dashboard'

// E-commerce - Shopping and payment (4)
export { CheckoutForm, PricingTable, ProductCard, ShoppingCart } from './ecommerce'

// Forms - See ./forms/*.md for documentation (4)
// ContactForm, MultiStepForm, NewsletterSignup, SurveyBuilder

// Notifications - See ./notifications/*.md for documentation (4)
// ToastSystem, NotificationCenter, AlertBanner, SnackBar
