/**
 * VIOLATION FIXTURE: Uniform Spacing
 * 
 * Expected detection:
 * - Category: design
 * - Message should contain: "spacing" or "rhythm" or "monotonous"
 * - Suggestion: Use varied rhythm
 */

export default function MonotonousLayout() {
  return (
    <div className="p-4">
      {/* Everything uses the same p-4/m-4 - no rhythm */}
      <header className="p-4 m-4 bg-gray-100">
        <h1 className="p-4 m-4">Title</h1>
      </header>
      
      <main className="p-4 m-4">
        <section className="p-4 m-4 bg-gray-50">
          <h2 className="p-4 m-4">Section 1</h2>
          <p className="p-4 m-4">Content</p>
          <button className="p-4 m-4">Action</button>
        </section>
        
        <section className="p-4 m-4 bg-gray-50">
          <h2 className="p-4 m-4">Section 2</h2>
          <p className="p-4 m-4">Content</p>
          <button className="p-4 m-4">Action</button>
        </section>
      </main>
      
      <footer className="p-4 m-4 bg-gray-100">
        <p className="p-4 m-4">Footer</p>
      </footer>
    </div>
  )
}

// Inline styles version - same spacing everywhere
export function UniformCard() {
  const spacing = { padding: '16px', margin: '16px' }
  
  return (
    <div style={spacing}>
      <div style={spacing}>
        <h3 style={spacing}>Title</h3>
        <p style={spacing}>Description</p>
        <button style={spacing}>Click</button>
      </div>
    </div>
  )
}
