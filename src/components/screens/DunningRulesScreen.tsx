import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/services/api'
import type { DunningRule, DunningStep } from '@/types'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Workflow,
  Plus,
  Play,
  Clock,
  Mail,
  Phone,
  Sparkles,
  Layers,
  Calendar,
  CheckCircle2,
  Trash2,
  ArrowRight,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function DunningRulesScreen() {
  const { selectedTenantId, tenants } = useAuth()
  const { toast } = useToast()
  const [rules, setRules] = useState<DunningRule[]>([])
  const [selectedRule, setSelectedRule] = useState<DunningRule | null>(null)
  const [steps, setSteps] = useState<DunningStep[]>([])
  const [loading, setLoading] = useState(true)

  // Simulator state
  const [simDays, setSimDays] = useState('7')
  const [simResults, setSimResults] = useState<{
    days_simulated: number
    total_active_rules?: number
    total_active_steps?: number
    projections: Array<{
      date: string
      day_offset: number
      receivables_count: number
      unique_customers: number
      total_amount: number
    }>
  } | null>(null)
  const [simulating, setSimulating] = useState(false)

  // New Rule Dialog state
  const [newRuleOpen, setNewRuleOpen] = useState(false)
  const [ruleName, setRuleName] = useState('')
  const [ruleScope, setRuleScope] = useState<'global' | 'tenant' | 'segment' | 'customer'>('tenant')
  const [ruleMinAmount, setRuleMinAmount] = useState('50')
  const [ruleWindowStart, setRuleWindowStart] = useState('09:00')
  const [ruleWindowEnd, setRuleWindowEnd] = useState('18:00')

  const fetchRules = async () => {
    setLoading(true)
    try {
      const list = await api.dunningRules.list(selectedTenantId)
      setRules(list)
      if (list.length > 0 && !selectedRule) {
        setSelectedRule(list[0])
      }
    } catch (err) {
      console.error('Failed to load dunning rules', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRules()
  }, [selectedTenantId])

  useEffect(() => {
    const loadSteps = async () => {
      if (!selectedRule) return
      try {
        const stepList = await api.dunningRules.getSteps(selectedRule.id)
        setSteps(stepList)
      } catch (err) {
        console.error('Failed to load steps', err)
      }
    }
    loadSteps()
  }, [selectedRule])

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ruleName.trim()) return

    try {
      const tenantToUse = selectedTenantId === 'all' ? tenants[0]?.id || '' : selectedTenantId
      const created = await api.dunningRules.create({
        tenant: tenantToUse,
        name: ruleName,
        scope: ruleScope,
        min_amount: parseFloat(ruleMinAmount) || 0,
        send_window_start: ruleWindowStart,
        send_window_end: ruleWindowEnd,
        is_active: true,
        priority: 10,
        business_days_only: true,
        max_messages_per_customer_per_week: 3,
        group_by_customer: true,
      })

      // Create standard 3 steps (D-2, D0, D+5)
      await api.dunningRules.createStep({
        dunning_rule: created.id,
        order: 1,
        offset_days: -2,
        channel: 'email',
        fallback_channel: 'whatsapp',
        fallback_after_hours: 24,
        is_active: true,
      })

      await api.dunningRules.createStep({
        dunning_rule: created.id,
        order: 2,
        offset_days: 0,
        channel: 'whatsapp',
        fallback_channel: 'email',
        fallback_after_hours: 12,
        is_active: true,
      })

      await api.dunningRules.createStep({
        dunning_rule: created.id,
        order: 3,
        offset_days: 5,
        channel: 'whatsapp',
        fallback_channel: 'email',
        fallback_after_hours: 24,
        is_active: true,
      })

      toast({
        title: 'Régua Criada',
        description: `Régua '${ruleName}' com timeline de 3 etapas criada com sucesso.`,
      })

      setNewRuleOpen(false)
      setRuleName('')
      fetchRules()
    } catch (err) {
      toast({
        title: 'Erro ao criar',
        description: 'Verifique os dados informados.',
        variant: 'destructive',
      })
    }
  }

  const handleSimulate = async () => {
    const tenantToUse = selectedTenantId === 'all' ? tenants[0]?.id || '' : selectedTenantId
    if (!tenantToUse) return

    setSimulating(true)
    try {
      const res = await api.dunningRules.simulate(tenantToUse, parseInt(simDays, 10))
      setSimResults(res)
      toast({
        title: 'Simulação Concluída',
        description: `Projeção calculada para os próximos ${simDays} dias com base na carteira atual.`,
      })
    } catch (err) {
      console.error('Simulation error', err)
    } finally {
      setSimulating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Workflow className="w-6 h-6 text-sky-600" /> Réguas de Cobrança & Timeline
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Definição de steps temporais (D-N, D0, D+N), canais, janelas de horário e simulador de
            impacto.
          </p>
        </div>

        <Dialog open={newRuleOpen} onOpenChange={setNewRuleOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs h-9">
              <Plus className="w-4 h-4 mr-1.5" /> Nova Régua
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                Criar Nova Régua de Cobrança
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateRule} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Nome da Régua</label>
                <Input
                  required
                  placeholder="Ex: Régua VIP / Exportação"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Escopo</label>
                  <select
                    value={ruleScope}
                    onChange={(e) => setRuleScope(e.target.value as "global" | "tenant" | "segment" | "customer")}
                    className="w-full h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs"
                  >
                    <option value="tenant">Tenant Específico</option>
                    <option value="global">Global (Grupo Todo)</option>
                    <option value="segment">Segmento de Mercado</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Valor Mínimo (R$)</label>
                  <Input
                    type="number"
                    value={ruleMinAmount}
                    onChange={(e) => setRuleMinAmount(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Janela Início</label>
                  <Input
                    value={ruleWindowStart}
                    onChange={(e) => setRuleWindowStart(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Janela Fim</label>
                  <Input
                    value={ruleWindowEnd}
                    onChange={(e) => setRuleWindowEnd(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs"
                >
                  Salvar e Criar Etapas Padrão
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main Grid: Rules List + Step Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Rules List */}
        <Card className="lg:col-span-4 border-slate-200 shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Réguas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">Carregando...</div>
            ) : rules.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Nenhuma régua configurada.
              </div>
            ) : (
              rules.map((r) => {
                const isSelected = selectedRule?.id === r.id
                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRule(r)}
                    className={`p-4 cursor-pointer hover:bg-slate-50 transition-all ${
                      isSelected ? 'bg-sky-50/70 border-l-4 border-sky-600' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-slate-900">{r.name}</div>
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {r.scope}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                      <span>
                        Janela: {r.send_window_start || '09:00'}–{r.send_window_end || '18:00'}
                      </span>
                      <span>•</span>
                      <span>Min: R$ {r.min_amount || 0}</span>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Right Step Timeline */}
        <Card className="lg:col-span-8 border-slate-200 shadow-2xs">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Linha do Tempo de Cobrança: {selectedRule?.name || 'Selecione uma régua'}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Disparos sequenciais baseados no offset da data de vencimento
              </CardDescription>
            </div>
            {selectedRule && (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
                Régua Ativa
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            {steps.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                Nenhum step cadastrado nesta régua.
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
                {steps.map((s, idx) => {
                  const isPre = s.offset_days < 0
                  const isDueDay = s.offset_days === 0
                  const isPost = s.offset_days > 0

                  return (
                    <div key={s.id} className="relative group">
                      {/* Circle indicator on timeline */}
                      <div
                        className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                          isPre ? 'bg-sky-500' : isDueDay ? 'bg-amber-500' : 'bg-indigo-600'
                        }`}
                      />

                      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge
                              className={`text-xs font-bold ${
                                isPre
                                  ? 'bg-sky-100 text-sky-800 border-sky-200'
                                  : isDueDay
                                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                                    : 'bg-indigo-100 text-indigo-800 border-indigo-200'
                              }`}
                            >
                              {isPre
                                ? `D${s.offset_days} (${Math.abs(s.offset_days)} dias antes)`
                                : isDueDay
                                  ? 'D0 (Dia do Vencimento)'
                                  : `D+${s.offset_days} (${s.offset_days} dias vencido)`}
                            </Badge>
                            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                              {s.channel === 'whatsapp' ? (
                                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Mail className="w-3.5 h-3.5 text-sky-600" />
                              )}
                              Canal Primário: <strong className="capitalize">{s.channel}</strong>
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400">Ordem #{s.order}</div>
                        </div>

                        <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                          <span>
                            Fallback:{' '}
                            <strong className="capitalize">{s.fallback_channel || 'Nenhum'}</strong>{' '}
                            após {s.fallback_after_hours || 24}h
                          </span>
                          {isPost && (
                            <span className="flex items-center gap-1 text-[11px] text-indigo-600 font-bold">
                              <Sparkles className="w-3 h-3" /> Habilitado com Agente CobraAI
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Simulator Section */}
      <Card className="border-slate-200 shadow-2xs bg-gradient-to-br from-slate-900 to-slate-950 text-white">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-400" /> Simulador de Impacto de Régua (Dry-Run)
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Projeta quantos clientes, títulos e montante financeiro serão acionados nos próximos
                dias
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={simDays}
                onChange={(e) => setSimDays(e.target.value)}
                className="h-8 rounded bg-slate-800 border border-slate-700 text-xs px-2 text-slate-200"
              >
                <option value="3">Próximos 3 dias</option>
                <option value="7">Próximos 7 dias</option>
                <option value="15">Próximos 15 dias</option>
              </select>
              <Button
                size="sm"
                onClick={handleSimulate}
                disabled={simulating}
                className="bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold h-8"
              >
                <Play className="w-3 h-3 mr-1" />{' '}
                {simulating ? 'Simulando...' : 'Executar Simulação'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {simResults ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Total Títulos Projetados
                  </div>
                  <div className="text-xl font-bold text-sky-400">
                    {simResults.projections.reduce((acc, p) => acc + p.receivables_count, 0)}
                  </div>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Volume Financeiro Impactado
                  </div>
                  <div className="text-xl font-bold text-emerald-400">
                    {formatCurrency(
                      simResults.projections.reduce((acc, p) => acc + p.total_amount, 0),
                    )}
                  </div>
                </div>
                <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">
                    Réguas Ativas Avaliadas
                  </div>
                  <div className="text-xl font-bold text-slate-200">
                    {simResults.total_active_rules}
                  </div>
                </div>
              </div>

              {/* Table of daily projection */}
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800/90 text-slate-300 font-semibold">
                    <tr>
                      <th className="p-2.5">Data Prevista</th>
                      <th className="p-2.5 text-center">Offset</th>
                      <th className="p-2.5 text-center">Títulos Acionados</th>
                      <th className="p-2.5 text-center">Clientes Únicos</th>
                      <th className="p-2.5 text-right">Volume Total (R$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {simResults.projections.map((p, i) => (
                      <tr key={i} className="hover:bg-slate-800/40 text-slate-300">
                        <td className="p-2.5 font-medium text-white">{formatDate(p.date)}</td>
                        <td className="p-2.5 text-center text-slate-400">D+{p.day_offset}</td>
                        <td className="p-2.5 text-center font-bold text-sky-400">
                          {p.receivables_count}
                        </td>
                        <td className="p-2.5 text-center text-slate-300">{p.unique_customers}</td>
                        <td className="p-2.5 text-right font-bold text-emerald-400">
                          {formatCurrency(p.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              Clique em &quot;Executar Simulação&quot; para projetar os volumes de envio da régua.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
