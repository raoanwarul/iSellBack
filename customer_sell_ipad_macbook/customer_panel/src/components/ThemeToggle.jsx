import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark'
    }
    return false
  })

  useEffect(() => {
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])

  return (
    <button
      onClick={() => setDark(!dark)}
      className="relative p-2 rounded-xl transition-colors"
      style={{
        background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
      }}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? (
        <Sun className="w-[18px] h-[18px]" style={{ color: '#FBBF24' }} />
      ) : (
        <Moon className="w-[18px] h-[18px]" style={{ color: 'var(--color-text-muted)' }} />
      )}
    </button>
  )
}
