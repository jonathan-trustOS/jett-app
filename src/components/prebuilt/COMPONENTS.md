# Jett Pre-built Components Library

40 production-ready React + TypeScript components organized by category.

## Installation

```bash
# Copy the components folder to your project
cp -r components/ your-project/src/components/prebuilt/
```

## Quick Reference

| Category | Components | Count |
|----------|------------|-------|
| [Core](#core) | AuthFlow, DataTable, NotesSystem, SettingsPage, UserProfile | 5 |
| [Content](#content) | CalendarView, KanbanBoard, RichTextEditor, Timeline, TodoList | 5 |
| [Social](#social) | CommentsThread, FollowSystem, LikesSystem, ShareModal | 4 |
| [Media](#media) | AudioPlayer, FileUploader, ImageGallery, VideoPlayer | 4 |
| [Navigation](#navigation) | Breadcrumbs, CommandPalette, MobileBottomNav, Sidebar, SidebarNav, Tabs | 6 |
| [Dashboard](#dashboard) | ActivityFeed, Chart, ProgressRing, StatsCard | 4 |
| [E-commerce](#ecommerce) | CheckoutForm, PricingTable, ProductCard, ShoppingCart | 4 |
| [Forms](#forms) | ContactForm, MultiStepForm, NewsletterSignup, SurveyBuilder | 4 |
| [Notifications](#notifications) | ToastSystem, NotificationCenter, AlertBanner, SnackBar | 4 |

**Total: 40 components**

---

## Directory Structure

```
components/
├── index.ts                 # Master exports
├── core/                    # 5 components
│   ├── index.ts
│   ├── AuthFlow.tsx
│   ├── DataTable.tsx
│   ├── NotesSystem.tsx
│   ├── SettingsPage.tsx
│   └── UserProfile.tsx
├── content/                 # 5 components
│   ├── index.ts
│   ├── CalendarView.tsx
│   ├── KanbanBoard.tsx
│   ├── RichTextEditor.tsx
│   ├── Timeline.tsx
│   └── TodoList.tsx
├── social/                  # 4 components
│   ├── index.ts
│   ├── CommentsThread.tsx
│   ├── FollowSystem.tsx
│   ├── LikesSystem.tsx
│   └── ShareModal.tsx
├── media/                   # 4 components
│   ├── index.ts
│   ├── AudioPlayer.tsx
│   ├── FileUploader.tsx
│   ├── ImageGallery.tsx
│   └── VideoPlayer.tsx
├── navigation/              # 6 components
│   ├── index.ts
│   ├── Breadcrumbs.tsx
│   ├── CommandPalette.tsx
│   ├── MobileBottomNav.tsx
│   ├── Sidebar.tsx
│   ├── SidebarNav.tsx
│   └── Tabs.tsx
├── dashboard/               # 4 components
│   ├── index.ts
│   ├── ActivityFeed.tsx
│   ├── Chart.tsx
│   ├── ProgressRing.tsx
│   └── StatsCard.tsx
├── ecommerce/               # 4 components
│   ├── index.ts
│   ├── CheckoutForm.tsx
│   ├── PricingTable.tsx
│   ├── ProductCard.tsx
│   └── ShoppingCart.tsx
├── forms/                   # 4 components (documented)
│   ├── README.md
│   ├── ContactForm.md
│   ├── MultiStepForm.md
│   ├── NewsletterSignup.md
│   └── SurveyBuilder.md
└── notifications/           # 4 components (documented)
    ├── README.md
    ├── ToastSystem.md
    ├── NotificationCenter.md
    ├── AlertBanner.md
    └── SnackBar.md
```

---

## Usage

### Import by Category

```tsx
import { AuthFlow, DataTable } from './components/core'
import { KanbanBoard, TodoList } from './components/content'
import { ToastProvider, useToast } from './components/notifications'
```

### Import from Root

```tsx
import { 
  AuthFlow, 
  KanbanBoard, 
  CommandPalette,
  ProductCard 
} from './components'
```

---

## Core

Essential app infrastructure components.

### AuthFlow
Full authentication flow with sign up, sign in, and password reset.

```tsx
<AuthFlow
  appName="MyApp"
  logo="/logo.svg"
  onAuth={(user) => navigate('/dashboard')}
  onForgotPassword={(email) => sendResetEmail(email)}
/>
```

**Features:** Email/password, social OAuth, validation, loading states

### DataTable
Sortable, filterable data table with pagination.

```tsx
<DataTable
  data={users}
  columns={[
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status', render: (val) => <Badge>{val}</Badge> }
  ]}
  pageSize={10}
  onRowClick={(row) => navigate(`/users/${row.id}`)}
/>
```

**Features:** Sorting, filtering, pagination, row selection, custom renderers

### NotesSystem
Rich notes with folders and search.

```tsx
<NotesSystem
  notes={notes}
  folders={folders}
  onSave={(note) => saveNote(note)}
  onDelete={(id) => deleteNote(id)}
/>
```

**Features:** Folders, rich text, search, auto-save

### SettingsPage
Organized settings with sections and controls.

```tsx
<SettingsPage
  sections={[
    { id: 'account', title: 'Account', settings: [...] },
    { id: 'notifications', title: 'Notifications', settings: [...] }
  ]}
  onSave={(settings) => updateSettings(settings)}
/>
```

**Features:** Grouped sections, toggles, selects, inputs

### UserProfile
Editable user profile with avatar.

```tsx
<UserProfile
  user={currentUser}
  onSave={(updates) => updateUser(updates)}
  onAvatarUpload={(file) => uploadAvatar(file)}
  editable={true}
/>
```

**Features:** Avatar upload, inline editing, validation

---

## Content

Rich content display and editing.

### CalendarView
Monthly/weekly calendar with events.

```tsx
<CalendarView
  events={events}
  view="month"
  onEventClick={(event) => openEvent(event)}
  onDateClick={(date) => createEvent(date)}
/>
```

**Features:** Month/week/day views, drag-drop, recurring events

### KanbanBoard
Drag-and-drop kanban board.

```tsx
<KanbanBoard
  columns={columns}
  cards={cards}
  onCardMove={(cardId, fromCol, toCol) => moveCard(...)}
  onCardClick={(card) => openCard(card)}
/>
```

**Features:** Drag-drop, column management, card labels

### RichTextEditor
WYSIWYG text editor.

```tsx
<RichTextEditor
  value={content}
  onChange={(html) => setContent(html)}
  toolbar={['bold', 'italic', 'link', 'image']}
/>
```

**Features:** Formatting, links, images, mentions

### Timeline
Vertical timeline display.

```tsx
<Timeline
  items={[
    { date: '2024-01-15', title: 'Project Started', description: '...' },
    { date: '2024-02-01', title: 'Phase 1 Complete', description: '...' }
  ]}
/>
```

**Features:** Icons, colors, alternating layout

### TodoList
Interactive todo list with categories.

```tsx
<TodoList
  todos={todos}
  onToggle={(id) => toggleTodo(id)}
  onAdd={(todo) => addTodo(todo)}
  onDelete={(id) => deleteTodo(id)}
/>
```

**Features:** Categories, due dates, priority, drag reorder

---

## Social

User interaction and engagement.

### CommentsThread
Threaded comments with replies.

```tsx
<CommentsThread
  comments={comments}
  currentUser={user}
  onReply={(parentId, text) => addReply(parentId, text)}
  onLike={(id) => likeComment(id)}
/>
```

**Features:** Nested replies, likes, mentions, edit/delete

### FollowSystem
Follow/unfollow button with counts.

```tsx
<FollowSystem
  userId={profile.id}
  isFollowing={profile.isFollowing}
  followerCount={profile.followers}
  onFollow={() => followUser(profile.id)}
/>
```

**Features:** Follow state, counts, loading states

### LikesSystem
Like button with animation.

```tsx
<LikesSystem
  itemId={post.id}
  likeCount={post.likes}
  isLiked={post.isLikedByMe}
  onLike={() => likePost(post.id)}
/>
```

**Features:** Heart animation, optimistic updates

### ShareModal
Social sharing modal.

```tsx
<ShareModal
  url={window.location.href}
  title={article.title}
  platforms={['twitter', 'facebook', 'linkedin', 'copy']}
/>
```

**Features:** Multiple platforms, copy link, native share API

---

## Media

Audio, video, images, and files.

### AudioPlayer
Custom audio player with waveform.

```tsx
<AudioPlayer
  src="/audio/podcast.mp3"
  title="Episode 42"
  showWaveform={true}
/>
```

**Features:** Play/pause, progress, volume, playback speed

### FileUploader
Drag-and-drop file upload.

```tsx
<FileUploader
  accept={['image/*', '.pdf']}
  maxSize={10 * 1024 * 1024}
  multiple={true}
  onUpload={(files) => uploadFiles(files)}
/>
```

**Features:** Drag-drop, preview, progress, validation

### ImageGallery
Lightbox image gallery.

```tsx
<ImageGallery
  images={[
    { src: '/img/1.jpg', alt: 'Photo 1', caption: 'Beach sunset' },
    { src: '/img/2.jpg', alt: 'Photo 2', caption: 'Mountain view' }
  ]}
  columns={3}
/>
```

**Features:** Lightbox, thumbnails, keyboard nav, zoom

### VideoPlayer
Custom video player.

```tsx
<VideoPlayer
  src="/video/demo.mp4"
  poster="/video/poster.jpg"
  autoPlay={false}
/>
```

**Features:** Custom controls, fullscreen, captions, quality selector

---

## Navigation

App navigation and routing.

### Breadcrumbs
Navigation breadcrumb trail.

```tsx
<Breadcrumbs
  items={[
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: 'Widget Pro' }
  ]}
/>
```

**Features:** Links, separators, truncation, icons

### CommandPalette
Keyboard-driven command palette (⌘K).

```tsx
<CommandPalette
  commands={[
    { id: 'new', label: 'New Document', shortcut: '⌘N', action: () => {} },
    { id: 'search', label: 'Search', shortcut: '⌘F', action: () => {} }
  ]}
/>
```

**Features:** Fuzzy search, keyboard nav, sections, recent

### MobileBottomNav
Mobile bottom navigation bar.

```tsx
<MobileBottomNav
  items={[
    { icon: HomeIcon, label: 'Home', href: '/' },
    { icon: SearchIcon, label: 'Search', href: '/search' },
    { icon: ProfileIcon, label: 'Profile', href: '/profile' }
  ]}
  activeIndex={0}
/>
```

**Features:** Icons, badges, safe area insets

### Sidebar
Collapsible sidebar navigation.

```tsx
<Sidebar
  items={navItems}
  collapsed={isCollapsed}
  onToggle={() => setIsCollapsed(!isCollapsed)}
/>
```

**Features:** Collapse, sections, icons, active state

### SidebarNav
Enhanced sidebar with nested items.

```tsx
<SidebarNav
  items={[
    { label: 'Dashboard', icon: DashIcon, href: '/dashboard' },
    { label: 'Settings', icon: GearIcon, children: [...] }
  ]}
/>
```

**Features:** Nested items, expand/collapse, badges

### Tabs
Tabbed interface.

```tsx
<Tabs
  tabs={[
    { id: 'overview', label: 'Overview', content: <Overview /> },
    { id: 'settings', label: 'Settings', content: <Settings /> }
  ]}
  defaultTab="overview"
/>
```

**Features:** Horizontal/vertical, icons, disabled tabs

---

## Dashboard

Data visualization and metrics.

### ActivityFeed
Real-time activity feed.

```tsx
<ActivityFeed
  activities={[
    { user: 'Jane', action: 'created', target: 'Document', time: '2m ago' },
    { user: 'Bob', action: 'commented on', target: 'Issue #42', time: '5m ago' }
  ]}
/>
```

**Features:** Avatars, timestamps, action types, load more

### Chart
Flexible chart component.

```tsx
<Chart
  type="line"
  data={salesData}
  xKey="date"
  yKey="revenue"
  color="blue"
/>
```

**Features:** Line, bar, area charts; tooltips, legends

### ProgressRing
Circular progress indicator.

```tsx
<ProgressRing
  progress={75}
  size={120}
  strokeWidth={8}
  color="green"
/>
```

**Features:** Animated, labels, colors, sizes

### StatsCard
Metric display card.

```tsx
<StatsCard
  title="Total Revenue"
  value="$48,352"
  change={+12.5}
  icon={DollarIcon}
/>
```

**Features:** Icons, trends, sparklines, colors

---

## E-commerce

Shopping and payment components.

### CheckoutForm
Multi-step checkout form.

```tsx
<CheckoutForm
  cart={cartItems}
  onSubmit={(order) => processOrder(order)}
  paymentMethods={['card', 'paypal']}
/>
```

**Features:** Address, payment, review steps; validation

### PricingTable
Pricing comparison table.

```tsx
<PricingTable
  plans={[
    { name: 'Basic', price: 9, features: [...] },
    { name: 'Pro', price: 29, features: [...], popular: true }
  ]}
  onSelect={(plan) => selectPlan(plan)}
/>
```

**Features:** Monthly/yearly toggle, feature lists, highlights

### ProductCard
E-commerce product card.

```tsx
<ProductCard
  product={{
    name: 'Widget Pro',
    price: 99.99,
    image: '/products/widget.jpg',
    rating: 4.5
  }}
  onAddToCart={() => addToCart(product)}
/>
```

**Features:** Images, pricing, ratings, quick actions

### ShoppingCart
Shopping cart sidebar.

```tsx
<ShoppingCart
  items={cartItems}
  onUpdateQuantity={(id, qty) => updateQuantity(id, qty)}
  onRemove={(id) => removeItem(id)}
  onCheckout={() => navigate('/checkout')}
/>
```

**Features:** Item list, quantities, totals, promo codes

---

## Forms

See [forms/README.md](./forms/README.md) for full documentation.

### ContactForm
Contact form with validation and spam protection.
→ [ContactForm.md](./forms/ContactForm.md)

### MultiStepForm
Multi-step wizard with progress tracking.
→ [MultiStepForm.md](./forms/MultiStepForm.md)

### NewsletterSignup
Email signup with loading states.
→ [NewsletterSignup.md](./forms/NewsletterSignup.md)

### SurveyBuilder
Dynamic survey/quiz builder.
→ [SurveyBuilder.md](./forms/SurveyBuilder.md)

---

## Notifications

See [notifications/README.md](./notifications/README.md) for full documentation.

### ToastSystem
Stackable toast notifications with auto-dismiss.
→ [ToastSystem.md](./notifications/ToastSystem.md)

```tsx
// Wrap app with provider
<ToastProvider position="top-right">
  <App />
</ToastProvider>

// Use in components
const { success, error } = useToast()
success('Saved!', 'Your changes have been saved.')
```

### NotificationCenter
Bell icon dropdown with notification list.
→ [NotificationCenter.md](./notifications/NotificationCenter.md)

```tsx
<NotificationCenter
  notifications={notifications}
  onMarkRead={(id) => markAsRead(id)}
  onMarkAllRead={() => markAllRead()}
  onDelete={(id) => deleteNotification(id)}
/>
```

### AlertBanner
Full-width alert banners.
→ [AlertBanner.md](./notifications/AlertBanner.md)

```tsx
<AlertBanner
  type="warning"
  title="Maintenance"
  message="Scheduled downtime tonight at 11pm."
  dismissible
/>
```

### SnackBar
Bottom-positioned snackbar with actions.
→ [SnackBar.md](./notifications/SnackBar.md)

```tsx
const { show } = useSnackBar()
show({
  message: 'Item deleted',
  action: { label: 'Undo', onClick: () => undoDelete() }
})
```

---

## Tech Stack

All components are built with:
- **React 18+** with hooks
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Lucide React** for icons (optional)

## Accessibility

All components include:
- Keyboard navigation
- ARIA attributes
- Focus management
- Screen reader support
- Reduced motion support

## License

MIT - Use freely in personal and commercial projects.
