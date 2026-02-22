'use client'

import { useState, useEffect } from 'react'
import Authentication from './Authentication'
import apiClient from '@/utils/api'

interface User {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

interface AuthWrapperProps {
  children: (user: User) => React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token')
    
    if (!token) {
      setLoading(false)
      setShowAuth(true)
      return
    }

    try {
      const response = await apiClient.get('/api/profile')

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setLoading(false)
      } else {
        // Token is invalid, remove it and show auth
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setLoading(false)
        setShowAuth(true)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setLoading(false)
      setShowAuth(true)
    }
  }

  const handleAuthSuccess = (userData: User) => {
    setUser(userData)
    setShowAuth(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    setShowAuth(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (showAuth || !user) {
    return <Authentication onSuccess={handleAuthSuccess} />
  }

  return (
    <>
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">E-Tax System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.first_name} {user?.last_name || 'User'}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children(user)}
      </main>
    </>
  )
}
