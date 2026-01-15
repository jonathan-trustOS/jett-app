/**
 * VIOLATION FIXTURE: Missing Alt Text
 * 
 * Expected detection:
 * - Category: a11y
 * - Message should contain: "alt" or "accessibility"
 * - Suggestion: Add descriptive alt text
 */

export default function Gallery() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Missing alt text entirely */}
      <img src="/photo1.jpg" />
      
      {/* Empty alt - might be intentional for decorative */}
      <img src="/photo2.jpg" alt="" />
      
      {/* Useless alt */}
      <img src="/photo3.jpg" alt="image" />
      
      {/* Another useless alt */}
      <img src="/logo.png" alt="logo" />
    </div>
  )
}

export function Avatar({ user }) {
  return (
    <div className="flex items-center gap-2">
      {/* Missing alt on avatar */}
      <img 
        src={user.avatar} 
        className="w-10 h-10 rounded-full"
      />
      <span>{user.name}</span>
    </div>
  )
}
