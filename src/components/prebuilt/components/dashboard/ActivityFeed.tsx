/**
 * ActivityFeed - Pre-built Activity/Notification Feed Component
 * 
 * Features:
 * - Time-grouped activities
 * - User avatars
 * - Action types with icons
 * - Timestamps
 */

interface Activity {
  id: string
  user: { name: string; avatar?: string }
  action: string
  target?: string
  timestamp: string
  type?: 'create' | 'update' | 'delete' | 'comment' | 'like' | 'share'
}

interface ActivityFeedProps {
  activities: Activity[]
  onActivityClick?: (activity: Activity) => void
  maxItems?: number
}

const IconCreate = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IconUpdate = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IconDelete = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
const IconComment = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
const IconLike = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
const IconShare = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>

const typeIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  create: { icon: <IconCreate />, color: 'text-green-400 bg-green-400/10' },
  update: { icon: <IconUpdate />, color: 'text-blue-400 bg-blue-400/10' },
  delete: { icon: <IconDelete />, color: 'text-red-400 bg-red-400/10' },
  comment: { icon: <IconComment />, color: 'text-purple-400 bg-purple-400/10' },
  like: { icon: <IconLike />, color: 'text-pink-400 bg-pink-400/10' },
  share: { icon: <IconShare />, color: 'text-yellow-400 bg-yellow-400/10' }
}

export default function ActivityFeed({ activities, onActivityClick, maxItems = 10 }: ActivityFeedProps) {
  const formatTime = (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime()
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  }

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const displayActivities = activities.slice(0, maxItems)

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
      <div className="p-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Activity</h2>
      </div>

      <div className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
        {displayActivities.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--text-tertiary)' }}>No recent activity</div>
        ) : (
          displayActivities.map(activity => {
            const typeInfo = typeIcons[activity.type || 'update']
            return (
              <div
                key={activity.id}
                onClick={() => onActivityClick?.(activity)}
                className={`flex items-start gap-3 p-4 transition-colors ${onActivityClick ? 'cursor-pointer hover:bg-white/5' : ''}`}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)' }}>
                    {activity.user.avatar ? (
                      <img src={activity.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      getInitials(activity.user.name)
                    )}
                  </div>
                  {typeInfo && (
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${typeInfo.color}`}>
                      {typeInfo.icon}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    <span className="font-medium">{activity.user.name}</span>
                    {' '}{activity.action}
                    {activity.target && <span className="font-medium"> {activity.target}</span>}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{formatTime(activity.timestamp)}</p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
