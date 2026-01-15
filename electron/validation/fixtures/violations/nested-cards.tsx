/**
 * VIOLATION FIXTURE: Nested Cards
 * 
 * Expected detection:
 * - Category: design
 * - Message should contain: "nested" or "cards" or "hierarchy"
 * - Suggestion: Flatten hierarchy
 */

export default function NestedCardHell() {
  return (
    <div className="p-6">
      {/* Card inside card inside card - visual noise */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2>Outer Card</h2>
        
        <div className="bg-gray-50 rounded-lg shadow p-4 mt-4">
          <h3>Middle Card</h3>
          
          <div className="bg-white rounded-md shadow-sm p-3 mt-3">
            <h4>Inner Card</h4>
            
            <div className="bg-gray-100 rounded p-2 mt-2">
              <p>Deepest card content</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Another common pattern - cards in a card grid
export function CardGrid() {
  return (
    <div className="bg-slate-800 rounded-xl p-6 shadow-xl">
      <h2 className="text-white mb-4">Container Card</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-700 rounded-lg p-4 shadow-lg">
          <div className="bg-slate-600 rounded p-3">
            Nested content
          </div>
        </div>
        <div className="bg-slate-700 rounded-lg p-4 shadow-lg">
          <div className="bg-slate-600 rounded p-3">
            Nested content
          </div>
        </div>
      </div>
    </div>
  )
}
