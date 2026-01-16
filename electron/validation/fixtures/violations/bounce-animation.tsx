/**
 * VIOLATION FIXTURE: Bounce/Elastic Animations
 * 
 * Expected detection:
 * - Category: design
 * - Message should contain: "bounce" or "elastic" or "animation"
 * - Suggestion: Use ease-out-quart or similar
 */

export default function BouncyUI() {
  return (
    <div className="space-y-4">
      {/* Tailwind bounce animation */}
      <button className="animate-bounce bg-blue-500 text-white px-4 py-2 rounded">
        Bouncing Button
      </button>
      
      {/* Bounce on hover */}
      <div className="hover:animate-bounce transition-transform">
        Hover to bounce
      </div>
      
      {/* Pulse is similar */}
      <div className="animate-pulse bg-gray-300 h-20 rounded">
        Pulsing placeholder
      </div>
    </div>
  )
}

// CSS-in-JS with elastic/spring animations
export function ElasticModal() {
  return (
    <div 
      className="modal"
      style={{
        animation: 'elasticIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        // Or spring-like timing
        transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}
    >
      <h2>Modal with elastic animation</h2>
      <p>This feels too playful for most UIs</p>
    </div>
  )
}

// Framer Motion spring animation
export function SpringCard() {
  // This pattern triggers bounce-like behavior
  const springConfig = {
    type: "spring",
    stiffness: 300,
    damping: 10  // Low damping = more bounce
  }
  
  return (
    <div>
      {/* motion.div with spring would bounce */}
      <div data-motion-spring={JSON.stringify(springConfig)}>
        Spring animated card
      </div>
    </div>
  )
}
