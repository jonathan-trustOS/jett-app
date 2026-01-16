import { ReactNode } from 'react'
import jettLogo from '../../assets/jett-logo.png'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div 
        className="w-full max-w-md p-8 rounded-2xl"
        style={{ 
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)'
        }}
      >
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <img 
            src={jettLogo} 
            alt="Jett" 
            className="w-20 h-20 rounded-full border-2 border-white shadow-lg mx-auto mb-4"
          />
          <h1 
            className="text-2xl font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p 
              className="mt-2 text-sm"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  )
}
