"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

type UserRole = "customer" | "driver" | "vendor" | "admin"
type Language = "fr" | "ar"

interface User {
  email: string
  role: UserRole
  name: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => boolean
  logout: () => void
  isAuthenticated: boolean
  language: Language
  setLanguage: (lang: Language) => void
  isDarkMode: boolean
  setIsDarkMode: (isDark: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock user database
const users = [
  { email: "hamza@driver.com", password: "hdriver", role: "driver" as UserRole, name: "Hamza Driver" },
  { email: "hamza@vendor.com", password: "hvendor", role: "vendor" as UserRole, name: "Hamza Vendor" },
  { email: "hamza@customer.com", password: "hcustomer", role: "customer" as UserRole, name: "Hamza Customer" },
  { email: "hamza@admin.com", password: "hadmin", role: "admin" as UserRole, name: "Hamza Admin" },
]

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [language, setLanguageState] = useState<Language>("fr")
  const [isDarkMode, setIsDarkModeState] = useState(false)
  const router = useRouter()

  // Load user, language, and dark mode from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    const storedLanguage = localStorage.getItem("language") as Language | null
    const storedDarkMode = localStorage.getItem("isDarkMode")

    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    if (storedLanguage) {
      setLanguageState(storedLanguage)
    }
    if (storedDarkMode) {
      setIsDarkModeState(JSON.parse(storedDarkMode))
    }
  }, [])

  const login = (email: string, password: string): boolean => {
    const foundUser = users.find((u) => u.email === email && u.password === password)
    if (foundUser) {
      const userData = { email: foundUser.email, role: foundUser.role, name: foundUser.name }
      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))

      // Redirect based on role
      if (foundUser.role === "admin") {
        router.push("/admin")
      } else if (foundUser.role === "driver") {
        router.push("/driver")
      } else if (foundUser.role === "vendor") {
        router.push("/vendor")
      } else {
        router.push("/")
      }
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    router.push("/login")
  }

  const handleSetLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
  }

  const handleSetIsDarkMode = (isDark: boolean) => {
    setIsDarkModeState(isDark)
    localStorage.setItem("isDarkMode", JSON.stringify(isDark))
    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        language,
        setLanguage: handleSetLanguage,
        isDarkMode,
        setIsDarkMode: handleSetIsDarkMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
