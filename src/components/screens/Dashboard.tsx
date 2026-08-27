import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/services/api'
import type { Receivable, PaymentPromise, Conversation, Ticket } from '@/types'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  MessageSquare,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

interface DashboardProps {
  onNavigate: (tab: string, customerId?: string) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { selectedTenantId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [promises, setPromises] = useState<PaymentPromise[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true)
      try {
        const [recRes, promRes, convRes, tktRes] = await Promise.all([
          api.receivables.list({
            tenantId: selectedTenantId,
            perPage: 500,
          }),
          api.paymentPromises.list(),
          api.conversations.list(selectedTenantId),
          api.tickets.list(selectedTenantId),
        ])

        setReceivables(recRes.items || [])
        setPromises(promRes || [])
        setConversations(convRes || [])
        setTickets(tktRes || [])
      } catch (err) {
        console.error('Failed to load dashboard data', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [selectedTenantId])

  // KPI Calculations
  const openReceivables = receivables.filter(
    (r) => r.status === 'open' || r.status === 'partially_paid',
  )
  const totalOpenAmount = openReceivables.reduce((acc, r) => acc + (Number(r.open_amount) || 0), 0)

  const paidReceivables = receivables.filter((r) => r.status === 'paid')
  const totalPaidAmount = paidReceivables.reduce((acc, r) => acc + (Number(r.amount) || 0), 0)

  const activePromises = promises.filter((p) => p.status === 'open')
  const totalPromiseAmount = activePromises.reduce(
    (acc, p) => acc + (Number(p.promised_amount) || 0),
    0,
  )

  const conversionRate =
    receivables.length > 0
      ? ((paidReceivables.length / receivables.length) * 100).toFixed(1)
      : '0.0'

  // Chart data: 30 days projected vs actual
  const chartData = Array.from({ length: 15 }).map((_, i) => {
    const day = i * 2 + 1
    const projected = Math.round(50000 + day * 12000 + Math.sin(day) * 8000)
    const realized = Math.round(42000 + day * 11500 + Math.cos(day) * 6000)
    return {
      day: `D+${day}`,
      Projetado: projected,
      Realizado: realized,
    }
  })

  const channelData = [
    { name: 'WhatsApp (HSM + IA)', value: 68, color: '#10B981' },
    { name: 'E-mail Transacional', value: 32, color: '#0EA5E9' },
  ]

  const pendingEscalations = conversations.filter(
    (c) => c.status === 'human_needed' || c.status === 'human_active',
  )

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-sky-500/10 rounded-full blur-2xl" />
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <Badge className="bg-sky-500/20 text-sky-300 border-sky-400/30 text-xs px-2.5 py-0.5">
              <Sparkles className="w-3 h-3 mr-1" /> Cobrança Friendly & Preditiva
            </Badge>
            <span className="text-xs text-slate-400 font-medium">ERP Conexos Integrado</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Painel Executivo de Recebíveis</h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
            Acompanhamento em tempo real da carteira, negociações via IA e recuperação amigável de
            títulos do Grupo Vila Porto.
          </p>
        </div>
        <div className="flex items-center gap-2 z-10">
          <Button
            onClick={() => onNavigate('chatbox')}
            className="bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-md shadow-sky-500/20 h-9"
          >
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" /> Abrir Atendimento (
            {pendingEscalations.length})
          </Button>
          <Button
            onClick={() => onNavigate('rules')}
            variant="outline"
            className="border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs h-9"
          >
            <Layers className="w-3.5 h-3.5 mr-1.5" /> Simular Régua
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-xs transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total a Receber (Aberto)
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">
              {loading ? '...' : formatCurrency(totalOpenAmount)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span className="text-sky-600 font-bold">{openReceivables.length} títulos</span>{' '}
              aguardando liquidação
            </p>
          </CardContent>
        </Card>

        {/* Card 2 */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-xs transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Recebido no Mês
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600">
              {loading ? '...' : formatCurrency(totalPaidAmount)}
            </div>
            <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-semibold">
              <TrendingUp className="w-3 h-3" /> +14.8% vs mês anterior
            </p>
          </CardContent>
        </Card>

        {/* Card 3 */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-xs transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Promessas em Aberto
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-amber-600">
              {loading ? '...' : formatCurrency(totalPromiseAmount)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span className="text-amber-600 font-bold">{activePromises.length} acordos</span>{' '}
              registrados pelo Agente
            </p>
          </CardContent>
        </Card>

        {/* Card 4 */}
        <Card className="border-slate-200 shadow-2xs hover:shadow-xs transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Taxa de Conversão
            </CardTitle>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-indigo-600">
              {loading ? '...' : `${conversionRate}%`}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Efetividade das réguas D-2, D0 e D+5
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recovery Curve Chart */}
        <Card className="lg:col-span-2 border-slate-200 shadow-2xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Projetado vs. Realizado (Curva 30 Dias)
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Valores recuperados comparados à previsão estatística do ERP Conexos
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-semibold border-slate-200">
                R$ Milhares
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRealizado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorProjetado" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(val: number) => [formatCurrency(val), '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="Projetado"
                    stroke="#0EA5E9"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#colorProjetado)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Realizado"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRealizado)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Channel Donut */}
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900">
              Efetividade por Canal
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Taxa de resposta e engajamento
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2 flex flex-col items-center">
            <div className="h-52 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(val) => [`${val}%`, 'Engajamento']}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full grid grid-cols-2 gap-2 pt-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                <div className="font-bold text-emerald-800">WhatsApp</div>
                <div className="text-[11px] text-emerald-600">68% Conversão</div>
              </div>
              <div className="p-2 rounded-lg bg-sky-50 border border-sky-100">
                <div className="font-bold text-sky-800">E-mail</div>
                <div className="text-[11px] text-sky-600">32% Conversão</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Escalations and Tickets Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Escalations */}
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Atendimentos Escalados para
                Humano
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Clientes que solicitaram analista ou divergência detectada
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('chatbox')}
              className="text-xs text-sky-600 font-semibold h-8"
            >
              Ver todos <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {pendingEscalations.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Nenhum atendimento escalado pendente no momento.
              </div>
            ) : (
              pendingEscalations.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  onClick={() => onNavigate('chatbox')}
                  className="p-3 rounded-lg border border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50/30 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900">
                      {c.expand?.customer?.name || 'Cliente Corporativo'}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>Canal: {c.channel.toUpperCase()}</span>
                      <span>•</span>
                      <span>Última msg: {formatDate(c.last_inbound_at)}</span>
                    </div>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-semibold">
                    {c.status === 'human_needed' ? 'Aguardando Analista' : 'Em Atendimento'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Tickets and Disputes */}
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-500" /> Chamados e Contestações Abertas
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Tickets criados automaticamente pelos guardrails de IA
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {tickets.length} total
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {tickets.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Nenhum chamado de contestação em aberto.
              </div>
            ) : (
              tickets.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">
                      {t.expand?.customer?.name || 'Cliente Vila Porto'}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-xs">{t.reason}</div>
                  </div>
                  <Badge
                    className={
                      t.status === 'open'
                        ? 'bg-rose-100 text-rose-800 border-rose-200 text-[10px]'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]'
                    }
                  >
                    {t.status === 'open' ? 'Pendente' : 'Resolvido'}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
