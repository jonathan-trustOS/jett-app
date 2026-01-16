/**
 * VIOLATION FIXTURE: Missing Focus Indicators
 * 
 * Expected detection:
 * - Category: a11y
 * - Message should contain: "focus" or "keyboard" or "navigation"
 * - Suggestion: Add visible focus indicators
 */

export default function NoFocusUI() {
  return (
    <div className="space-y-4">
      {/* Explicitly removing focus outline */}
      <button 
        className="outline-none bg-blue-500 text-white px-4 py-2 rounded"
      >
        No Focus Outline
      </button>
      
      {/* Focus:outline-none without replacement */}
      <input 
        type="text"
        className="border p-2 rounded focus:outline-none"
        placeholder="Can't see focus"
      />
      
      {/* Using outline-0 */}
      <a 
        href="#"
        className="outline-0 text-blue-600"
      >
        Link without focus ring
      </a>
      
      {/* CSS reset that removes focus */}
      <button
        style={{ outline: 'none' }}
        className="bg-gray-200 px-4 py-2 rounded"
      >
        Inline outline:none
      </button>
      
      {/* focus-visible:outline-none is also bad without replacement */}
      <select className="border p-2 focus-visible:outline-none">
        <option>Select option</option>
      </select>
    </div>
  )
}

// Tailwind pattern that strips focus
export function StyledButtons() {
  return (
    <div className="space-x-2">
      {/* Common anti-pattern: removing default focus */}
      <button className="
        bg-indigo-600 text-white px-4 py-2 rounded
        focus:outline-none
        hover:bg-indigo-700
      ">
        Has hover but no focus
      </button>
      
      {/* Another pattern - outline-none in base */}
      <input 
        className="
          border border-gray-300 rounded px-3 py-2
          outline-none
          focus:border-blue-500
        "
        placeholder="Border change isn't enough"
      />
    </div>
  )
}

// Global CSS that removes focus
export const globalStyles = `
  *:focus {
    outline: none;
  }
  
  button:focus,
  a:focus,
  input:focus {
    outline: 0;
  }
`
