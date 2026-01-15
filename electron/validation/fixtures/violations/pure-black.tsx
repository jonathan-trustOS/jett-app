/**
 * VIOLATION FIXTURE: Pure Black/White Colors
 * 
 * Expected detection:
 * - Category: design
 * - Message should contain: "#000" or "pure black" or "color"
 * - Suggestion: Use tinted colors
 */

export default function Card() {
  return (
    <div 
      style={{ 
        backgroundColor: '#000',
        color: '#fff',
        padding: '24px',
        borderRadius: '8px'
      }}
    >
      <h2 style={{ color: '#ffffff' }}>Title</h2>
      <p style={{ color: '#000000' }}>Description text</p>
    </div>
  )
}

// Tailwind version
export function TailwindCard() {
  return (
    <div className="bg-black text-white p-6 rounded-lg">
      <h2 className="text-white">Title</h2>
      <p className="text-black">Description</p>
    </div>
  )
}
