/**
 * CLEAN FIXTURE: Impeccable Button
 * 
 * This component should have ZERO critical issues.
 * Tests for false positives.
 * 
 * Checks passed:
 * ✓ Uses Plus Jakarta Sans font (via Tailwind config)
 * ✓ Uses tinted colors (slate-800, indigo-500)
 * ✓ Has focus indicators
 * ✓ Uses ease-out transitions (not bounce)
 * ✓ Accessible button element
 */

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

export default function Button({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false 
}: ButtonProps) {
  const baseStyles = `
    font-['Plus_Jakarta_Sans'] 
    px-4 py-2 
    rounded-lg 
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `
  
  const variants = {
    primary: `
      bg-indigo-600 hover:bg-indigo-500 
      text-slate-50
      focus:ring-indigo-500
    `,
    secondary: `
      bg-slate-800 hover:bg-slate-700 
      text-slate-100
      border border-slate-600
      focus:ring-slate-500
    `
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]}`}
      type="button"
    >
      {children}
    </button>
  )
}
