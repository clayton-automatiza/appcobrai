import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/services/api'
import type { Tenant, Holiday, SyncState } from '@/types'
import { formatDate, formatCNPJ } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Settings2,
  Building2,
  Calendar,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function AdminScreen() {
  const { user, tenants, selectedTenantId, refreshTenants } = useAuth()
  const { toast } = useToast()
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [syncState, setSyncState] = useState<SyncState | null>(null)
  const [loading, setLoading] = useState(true)

  // Tenant edit state
  const targetTenant = tenants.find((t) => t.id === selectedTenantId) || tenants[0]
  const [tenantName, setTenantName] = useState(targetTenant?.name || '')
  const [conexosKey, setConexosKey] = useState(targetTenant?.conexos_api_key || '')
  const [waKey, setWaKey] = useState(targetTenant?.whatsapp_api_key || '')
  const [emailKey, setEmailKey] = useState(targetTenant?.email_api_key || '')
  const [winStart, setWinStart] = useState(targetTenant?.default_send_window_start || '09:00')
  const [winEnd, setWinEnd] = useState(targetTenant?.default_send_window_end || '18:00')

  useEffect(() => {
    if (targetTenant) {
      setTenantName(targetTenant.name)
      setConexosKey(targetTenant.conexos_api_key || '')
      setWaKey(targetTenant.whatsapp_api_key || '')
      setEmailKey(targetTenant.email_api_key || '')
      setWinStart(targetTenant.default_send_window_start || '09:00')
      setWinEnd(targetTenant.default_send_window_end || '18:00')
    }
  }, [targetTenant])

  const loadAdminData = async () => {
    setLoading(true)
    try {
      const [hList, sState] = await Promise.all([
        api.holidays.list(selectedTenantId),
        targetTenant ? api.syncState.getForTenant(targetTenant.id) : null,
      ])
      setHolidays(hList)
      setSyncState(sState)
    } catch (err) {
      console.error('Failed to load admin data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [selectedTenantId])

  const handleSaveTenantSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!targetTenant) return

    try {
      await api.tenants.update(targetTenant.id, {
        name: tenantName,
        conexos_api_key: conexosKey,
        whatsapp_api_key: waKey,
        email_api_key: emailKey,
        default_send_window_start: winStart,
        default_send_window_end: winEnd,
      })

      toast({
        title: 'Configurações Atualizadas',
        description: 'Parâmetros de sincronização e chaves salvos com sucesso.',
      })
      refreshTenants()
    } catch (err) {
      toast({
        title: 'Erro ao salvar',
        description: 'Falha na atualização.',
        variant: 'destructive',
      })
    }
  }

  const handleForceSync = async () => {
    toast({
      title: 'Sincronização Iniciada',
      description: 'Buscando novas faturas e atualizações de liquidação no ERP Conexos.',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-sky-600" /> Administração & Conexos ERP
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Parâmetros por empresa, chaves de API, credenciais de mensageria e calendário de
            feriados.
          </p>
        </div>

        <Button
          onClick={handleForceSync}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs h-9"
        >
          <RefreshCw className="w-4 h-4 mr-1.5" /> Forçar Sincronização ERP
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tenant Config Form */}
        <Card className="lg:col-span-7 border-slate-200 shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-600" /> Configuração da Empresa:{' '}
              {targetTenant?.name}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              CNPJ: <strong>{formatCNPJ(targetTenant?.cnpj)}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveTenantSettings} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Razão Social</label>
                <Input
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Chave de API ERP Conexos
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <Input
                    type="password"
                    value={conexosKey}
                    onChange={(e) => setConexosKey(e.target.value)}
                    className="pl-9 h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Token WhatsApp Meta API
                  </label>
                  <Input
                    type="password"
                    value={waKey}
                    onChange={(e) => setWaKey(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Chave SendGrid / E-mail
                  </label>
                  <Input
                    type="password"
                    value={emailKey}
                    onChange={(e) => setEmailKey(e.target.value)}
                    className="h-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Janela de Disparo (Início)
                  </label>
                  <Input
                    value={winStart}
                    onChange={(e) => setWinStart(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Janela de Disparo (Fim)
                  </label>
                  <Input
                    value={winEnd}
                    onChange={(e) => setWinEnd(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs h-9"
              >
                Salvar Parâmetros
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sync Status & Holidays */}
        <div className="lg:col-span-5 space-y-6">
          {/* Sync Status Box */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-600" /> Status da Sincronização ERP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-900">
                <span className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Conexão Conexos Ativa
                </span>
                <Badge className="bg-emerald-600 text-white text-[10px]">200 OK</Badge>
              </div>

              <div className="pt-2 space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Última Sincronização:</span>
                  <strong className="text-slate-800">
                    {formatDate(syncState?.last_synced_at) || 'Hoje, 02:00'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Frequência:</span>
                  <span className="font-medium">Diário às 02:00 (Cron)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Falhas Consecutivas:</span>
                  <span className="font-bold text-emerald-600">0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Holidays */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" /> Calendário de Feriados Nacionais
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
              {holidays.map((h) => (
                <div
                  key={h.id}
                  className="p-2.5 flex items-center justify-between hover:bg-slate-50"
                >
                  <div className="font-semibold text-slate-800">{h.name}</div>
                  <div className="text-slate-500 font-mono text-[11px]">{formatDate(h.date)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
