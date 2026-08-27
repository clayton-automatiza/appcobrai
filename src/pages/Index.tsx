import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AppLayout, type NavTab } from '@/components/AppLayout'
import { LoginScreen } from '@/components/LoginScreen'
import { Dashboard } from '@/components/screens/Dashboard'
import { ReceivablesScreen } from '@/components/screens/ReceivablesScreen'
import { CustomersScreen } from '@/components/screens/CustomersScreen'
import { ChatBoxScreen } from '@/components/screens/ChatBoxScreen'
import { DunningRulesScreen } from '@/components/screens/DunningRulesScreen'
import { TemplatesScreen } from '@/components/screens/TemplatesScreen'
import { PaymentPromisesScreen } from '@/components/screens/PaymentPromisesScreen'
import { IndicatorsScreen } from '@/components/screens/IndicatorsScreen'
import { AdminScreen } from '@/components/screens/AdminScreen'
import { AuditScreen } from '@/components/screens/AuditScreen'

export function Index() {
  const { user, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-3">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-medium">Carregando CobraAI...</p>
      </div>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  const handleSelectCustomer = (customerId: string | null) => {
    setSelectedCustomerId(customerId)
    if (customerId) {
      setActiveTab('customers')
    }
  }

  const handleOpenChatForCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId)
    setActiveTab('chatbox')
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={(tab, customerId) => {
              setActiveTab(tab as NavTab)
              if (customerId) setSelectedCustomerId(customerId)
            }}
          />
        )
      case 'receivables':
        return <ReceivablesScreen onSelectCustomer={handleSelectCustomer} />
      case 'customers':
        return (
          <CustomersScreen
            selectedCustomerId={selectedCustomerId}
            onClearCustomerSelection={() => setSelectedCustomerId(null)}
            onOpenChat={handleOpenChatForCustomer}
          />
        )
      case 'chatbox':
        return <ChatBoxScreen initialCustomerId={selectedCustomerId} />
      case 'rules':
        return <DunningRulesScreen />
      case 'templates':
        return <TemplatesScreen />
      case 'promises':
        return <PaymentPromisesScreen />
      case 'indicators':
        return <IndicatorsScreen />
      case 'admin':
        return <AdminScreen />
      case 'audit':
        return <AuditScreen />
      default:
        return <Dashboard onNavigate={(tab) => setActiveTab(tab as NavTab)} />
    }
  }

  return (
    <AppLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      selectedCustomerId={selectedCustomerId}
      onSelectCustomer={handleSelectCustomer}
    >
      {renderActiveScreen()}
    </AppLayout>
  )
}

export default Index
