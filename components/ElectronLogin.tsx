"use client"

import { useState } from 'react'
import { Button } from '@/root/components/ui/button'
import { Input } from '@/root/components/ui/input'
import { Label } from '@/root/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/root/components/ui/card'
import { Store, Loader2, AlertCircle } from 'lucide-react'

interface ElectronLoginProps {
  onLoginSuccess: (user: any) => void
}

export default function ElectronLogin({ onLoginSuccess }: ElectronLoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (typeof window !== 'undefined' && window.electronAPI) {
        const result = await window.electronAPI.auth.login({ email, password })
        if (result.success) {
          const user = await window.electronAPI.auth.getUser()
          onLoginSuccess(user)
        } else {
          setError(result.error || 'Login failed')
        }
      } else {
        setError('Electron API not available')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Card className="w-full max-w-md mx-4 bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-400 to-orange-500 flex items-center justify-center shadow-lg">
            <Store className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">AlBaz Vendor</CardTitle>
          <CardDescription className="text-gray-300">
            Sign in to your vendor account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-200">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vendor@example.com"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-200">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 via-cyan-500 to-orange-500 hover:from-teal-600 hover:via-cyan-600 hover:to-orange-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

