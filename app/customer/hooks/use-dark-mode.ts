import { useState, useEffect } from 'react'

export function useDarkMode() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true'
    setDarkMode(isDark)
  }, [])

  const toggleDarkMode = () => {
    const newValue = !darkMode
    localStorage.setItem('darkMode', String(newValue))
    setDarkMode(newValue)
  }

  return { darkMode, toggleDarkMode }
}