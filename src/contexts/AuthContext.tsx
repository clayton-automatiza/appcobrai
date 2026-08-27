import React, { createContext, useContext, useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import type { User, Tenant } from '@/types'
import { api } from '@/services/api'

interface AuthContextType {
  user: User | null
  tenants: Tenant[]
  currentTenant: Tenant | null
  selectedTenantId: string
  setSelectedTenantId: (id: string) => void
  isLoading: boolean
  login: (email: string, pass: string) => Promise<void>
  logout: () => void
  refreshTenants: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(pb.authStore.record as unknown as User | null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState<string>('all')
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const refreshTenants = async () => {
    try {
      const list = await api.tenants.list()
      setTenants(list)
      if (list.length > 0 && selectedTenantId === 'all' && user?.role !== 'super_admin') {
        if (user?.tenant) {
          setSelectedTenantId(user.tenant)
        } else {
          setSelectedTenantId(list[0].id)
        }
      }
    } catch (err) {
      console.error('Failed to load tenants', err)
    }
  }

  useEffect(() => {
    const unsub = pb.authStore.onChange(() => {
      setUser(pb.authStore.record as unknown as User | null)
    })

    const init = async () => {
      setIsLoading(true)
      if (pb.authStore.isValid) {
        await refreshTenants()
      }
      setIsLoading(false)
    }
    init()

    return () => {
      unsub()
    }
  }, [])

  const login = async (email: string, pass: string) => {
    await pb.collection('users').authWithPassword(email, pass)
    setUser(pb.authStore.record as unknown as User | null)
    await refreshTenants()
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
  }

  const currentTenant = tenants.find((t) => t.id === selectedTenantId) || null

  return (
    <AuthContext.Provider
      value={{
        user,
        tenants,
        currentTenant,
        selectedTenantId,
        setSelectedTenantId,
        isLoading,
        login,
        logout,
        refreshTenants,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
