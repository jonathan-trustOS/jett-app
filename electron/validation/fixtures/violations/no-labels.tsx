/**
 * VIOLATION FIXTURE: Missing Form Labels
 * 
 * Expected detection:
 * - Category: a11y
 * - Message should contain: "label" or "form" or "accessibility"
 * - Suggestion: Add associated labels to all form inputs
 */

export default function UnlabeledForm() {
  return (
    <form className="space-y-4">
      {/* No label at all */}
      <input 
        type="text" 
        placeholder="Enter your name"
        className="border p-2 rounded"
      />
      
      {/* Placeholder is not a label */}
      <input 
        type="email" 
        placeholder="Email address"
        className="border p-2 rounded"
      />
      
      {/* Visual label but no htmlFor/id association */}
      <div>
        <span className="text-sm text-gray-600">Password</span>
        <input 
          type="password" 
          className="border p-2 rounded block"
        />
      </div>
      
      {/* Select without label */}
      <select className="border p-2 rounded">
        <option>Choose an option</option>
        <option>Option 1</option>
        <option>Option 2</option>
      </select>
      
      {/* Textarea without label */}
      <textarea 
        placeholder="Your message..."
        className="border p-2 rounded w-full"
        rows={4}
      />
      
      {/* Checkbox without label */}
      <div>
        <input type="checkbox" />
        <span className="ml-2">I agree to terms</span>
      </div>
      
      <button type="submit">Submit</button>
    </form>
  )
}

// Aria-label is better but visible labels are best
export function AriaOnlyLabels() {
  return (
    <form>
      {/* Aria-label without visible label */}
      <input 
        type="search" 
        aria-label="Search"
        className="border p-2"
      />
      
      {/* Screen reader only label - might be intentional */}
      <label className="sr-only">Hidden label</label>
      <input type="text" className="border p-2" />
    </form>
  )
}
