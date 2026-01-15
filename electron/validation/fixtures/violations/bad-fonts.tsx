/**
 * VIOLATION FIXTURE: Bad Fonts
 * 
 * Expected detection:
 * - Category: design
 * - Message should contain: "Inter" or "font"
 * - Suggestion: Use Plus Jakarta Sans or Instrument Sans
 */

export default function Button() {
  return (
    <button 
      style={{ 
        fontFamily: 'Inter, sans-serif',
        padding: '8px 16px',
        borderRadius: '6px'
      }}
    >
      Click me
    </button>
  )
}

// Also test Roboto
export function SecondaryButton() {
  return (
    <button className="font-['Roboto'] px-4 py-2">
      Secondary
    </button>
  )
}

// And Open Sans
export function TertiaryButton() {
  return (
    <button style={{ fontFamily: 'Open Sans, Arial' }}>
      Tertiary
    </button>
  )
}
