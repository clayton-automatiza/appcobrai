import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  LayoutDashboard,
  Receipt,
  Users,
  MessageSquare,
  Workflow,
  FileText,
  BadgePercent,
  BarChart3,
  Settings2,
  History,
  Building2,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Bell,
  Sparkles,
  Bot,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'

export type NavTab =
  | 'dashboard'
  | 'receivables'
  | 'customers'
  | 'chatbox'
  | 'rules'
  | 'templates'
  | 'promises'
  | 'indicators'
  | 'admin'
  | 'audit'

interface AppLayoutProps {
  activeTab: NavTab
  setActiveTab: (tab: NavTab) => void
  selectedCustomerId?: string | null
  onSelectCustomer?: (id: string | null) => void
  children: React.ReactNode
}

export function AppLayout({ activeTab, setActiveTab, children }: AppLayoutProps) {
  const { user, tenants, selectedTenantId, setSelectedTenantId, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const currentTenant = tenants.find((t) => t.id === selectedTenantId)

  const navItems: {
    id: NavTab
    label: string
    icon: React.ComponentType<{ className?: string }>
    badge?: string
  }[] = [
    { id: 'dashboard', label: 'Dashboard Executivo', icon: LayoutDashboard },
    { id: 'receivables', label: 'Carteira de Recebíveis', icon: Receipt },
    { id: 'customers', label: 'Clientes & Contatos', icon: Users },
    { id: 'chatbox', label: 'Caixa de Atendimento', icon: MessageSquare, badge: 'IA Live' },
    { id: 'rules', label: 'Réguas de Cobrança', icon: Workflow },
    { id: 'templates', label: 'Templates de Mensagem', icon: FileText },
    { id: 'promises', label: 'Promessas de Pagamento', icon: BadgePercent },
    { id: 'indicators', label: 'Indicadores & Relatórios', icon: BarChart3 },
    { id: 'admin', label: 'Administração & ERP', icon: Settings2 },
    { id: 'audit', label: 'Auditoria & Logs', icon: History },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-800">
      {/* Top Glass Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 lg:px-6 h-16 flex items-center justify-between shadow-xs">
        {/* Left: Brand & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-slate-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-md shadow-sky-500/20">
              ⚡
            </div>
            <div className="hidden sm:block">
              <div className="font-extrabold text-lg tracking-tight text-slate-900 leading-tight">
                Cobra<span className="text-sky-600">AI</span>
              </div>
              <div className="text-[10px] font-semibold tracking-wider uppercase text-slate-500">
                Grupo Vila Porto
              </div>
            </div>
          </div>
        </div>

        {/* Center: Tenant Switcher (Super Admin / Diretoria) */}
        <div className="flex items-center gap-2">
          {user?.role === 'super_admin' || tenants.length > 1 ? (
            <div className="flex items-center gap-2 bg-slate-100/90 hover:bg-slate-200/70 border border-slate-200 rounded-lg px-2.5 py-1.5 transition-colors">
              <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
              <select
                value={selectedTenantId}
                onChange={(e) => setSelectedTenantId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-hidden cursor-pointer max-w-[200px] sm:max-w-[280px] truncate"
              >
                {user?.role === 'super_admin' && (
                  <option value="all">🏢 Todas as Empresas (Visão Consolidada)</option>
                )}
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-md text-xs font-medium text-slate-700">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentTenant?.name || 'Vila Porto Org'}</span>
            </div>
          )}
        </div>

        {/* Right: Notifications, AI Status & User Menu */}
        <div className="flex items-center gap-2.5">
          <Badge
            variant="outline"
            className="hidden md:flex items-center gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700 text-xs py-1"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Bot className="w-3.5 h-3.5" />
            <span>Agente IA Ativo</span>
          </Badge>

          <Button
            variant="ghost"
            size="icon"
            className="text-slate-500 hover:text-slate-700 relative"
            onClick={() => setActiveTab('audit')}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-sky-500 rounded-full" />
          </Button>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-80 transition-opacity focus:outline-hidden">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-900 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {user?.name?.slice(0, 2).toUpperCase() || 'VP'}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="text-xs font-semibold text-slate-900 leading-tight">
                    {user?.name || 'Operador'}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium capitalize">
                    {user?.role?.replace('_', ' ') || 'analista'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-white border-slate-200 text-slate-800"
            >
              <DropdownMenuLabel>
                <div className="font-semibold text-slate-900">{user?.name}</div>
                <div className="text-xs text-slate-500">{user?.email}</div>
                <Badge
                  variant="secondary"
                  className="mt-1 text-[10px] uppercase font-bold text-sky-700 bg-sky-50"
                >
                  {user?.role}
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setActiveTab('admin')} className="cursor-pointer">
                <Settings2 className="w-4 h-4 mr-2 text-slate-500" /> Configurações de Tenant
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveTab('audit')} className="cursor-pointer">
                <History className="w-4 h-4 mr-2 text-slate-500" /> Logs & Auditoria
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="text-rose-600 cursor-pointer focus:bg-rose-50"
              >
                <LogOut className="w-4 h-4 mr-2" /> Encerrar Sessão
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 bg-white shrink-0">
          <div className="p-4 flex-1 space-y-1 overflow-y-auto">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Módulos Operacionais
            </div>
            {navItems.slice(0, 4).map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-sky-500 text-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}

            <div className="pt-4 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Automação & Réguas
            </div>
            {navItems.slice(4, 7).map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              )
            })}

            <div className="pt-4 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Gestão & Controle
            </div>
            {navItems.slice(7).map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Sidebar Footer Info */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-500" /> Motor IA Conexos
                </span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">
                  100% OK
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                Cron ativo a cada 10m com guardrails cordiais de compliance.
              </p>
            </div>
          </div>
        </aside>

        {/* Mobile Slideout Navigation */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl p-4 flex flex-col z-10 overflow-y-auto">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="font-extrabold text-lg text-slate-900">
                  Cobra<span className="text-sky-600">AI</span> Menu
                </div>
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="py-4 space-y-1 flex-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = activeTab === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id)
                        setMobileMenuOpen(false)
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold ${
                        isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-sky-500 text-white">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={logout}
                  className="w-full text-rose-600 justify-start text-xs border-rose-200"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Sair
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Main Content Container */}
        <main className="flex-1 overflow-y-auto bg-slate-50/60 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
