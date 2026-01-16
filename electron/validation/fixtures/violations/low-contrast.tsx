/**
 * VIOLATION FIXTURE: Low Color Contrast
 * 
 * Expected detection:
 * - Category: a11y
 * - Message should contain: "contrast" or "readability"
 * - Suggestion: Ensure 4.5:1 ratio for normal text, 3:1 for large text
 */

export default function LowContrastUI() {
  return (
    <div className="p-6">
      {/* Light gray on white - fails WCAG */}
      <p className="text-gray-300 bg-white">
        This light gray text on white is hard to read
      </p>
      
      {/* Light text on light background */}
      <div className="bg-gray-100">
        <p className="text-gray-400">Insufficient contrast here</p>
      </div>
      
      {/* Dark on dark */}
      <div className="bg-gray-800">
        <p className="text-gray-600">Dark gray on dark background</p>
      </div>
      
      {/* Placeholder text that's too light */}
      <input 
        placeholder="Can you even see this?"
        className="bg-white placeholder-gray-200 border"
      />
      
      {/* Disabled states often have contrast issues */}
      <button 
        disabled
        className="bg-gray-100 text-gray-300 px-4 py-2"
      >
        Disabled Button
      </button>
    </div>
  )
}

// Inline styles with specific bad ratios
export function InlineContrast() {
  return (
    <div>
      {/* Approximately 2:1 contrast ratio */}
      <p style={{ color: '#999999', backgroundColor: '#ffffff' }}>
        Gray on white fails
      </p>
      
      {/* Yellow on white is notoriously bad */}
      <p style={{ color: '#ffcc00', backgroundColor: '#ffffff' }}>
        Yellow on white
      </p>
      
      {/* Light blue on white */}
      <a href="#" style={{ color: '#87ceeb', backgroundColor: '#fff' }}>
        Light blue link
      </a>
    </div>
  )
}
