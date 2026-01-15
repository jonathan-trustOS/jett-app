/**
 * VIOLATION FIXTURE: Cyan-on-Dark Color Scheme
 * 
 * Expected detection:
 * - Category: design
 * - Message should contain: "cyan" or "color scheme"
 * - Suggestion: Use warm/cool tinted neutrals
 */

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Classic cyan-on-dark that looks dated */}
      <header className="bg-gray-800 border-b border-cyan-500">
        <h1 className="text-cyan-400 text-2xl font-bold">Dashboard</h1>
      </header>
      
      <nav className="bg-gray-800">
        <a href="#" className="text-cyan-300 hover:text-cyan-100">Home</a>
        <a href="#" className="text-cyan-300 hover:text-cyan-100">Settings</a>
      </nav>
      
      <main className="p-6">
        <div className="bg-gray-800 border border-cyan-600 rounded-lg p-4">
          <h2 className="text-cyan-400">Statistics</h2>
          <p className="text-cyan-200">Your weekly stats</p>
        </div>
      </main>
    </div>
  )
}

// Inline style version
export function CyanCard() {
  return (
    <div style={{ 
      backgroundColor: '#1a1a2e',
      border: '1px solid #00fff5',
      color: '#00d4ff'
    }}>
      <h3 style={{ color: '#0ff' }}>Neon Cyan Title</h3>
    </div>
  )
}
