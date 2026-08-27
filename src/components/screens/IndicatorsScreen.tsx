import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  TrendingUp,
  Download,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from 'recharts'

export function IndicatorsScreen() {
  const { currentTenant } = useAuth()

  // Aging list data
  const agingData = [
    { range: 'A Vencer', amount: 480000, count: 85 },
    { range: '1-15 dias', amount: 195000, count: 42 },
    { range: '16-30 dias', amount: 112000, count: 28 },
    { range: '31-60 dias', amount: 74000, count: 16 },
    { range: '+60 dias', amount: 38000, count: 9 },
  ]

  const dsoHistory = [
    { month: 'Mar', dso: 38 },
    { month: 'Abr', dso: 35 },
    { month: 'Mai', dso: 32 },
    { month: 'Jun', dso: 29 },
    { month: 'Jul', dso: 27 },
    { month: 'Ago', dso: 24 },
  ]

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,Faixa de Vencimento,Valor (R$),Qtd Titulos\n' +
      agingData.map((e) => `"${e.range}",${e.amount},${e.count}`).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `relatorio_cobranca_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-sky-600" /> Indicadores & Relatórios de Performance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Métricas de DSO (Days Sales Outstanding), aging de carteira, entrega de HSM e
            efetividade de réguas.
          </p>
        </div>

        <Button
          onClick={handleExportCSV}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs h-9"
        >
          <Download className="w-4 h-4 mr-1.5" /> Exportar Dados (CSV)
        </Button>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              DSO Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-slate-900">24 Dias</div>
            <p className="text-[11px] text-emerald-600 mt-1 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Redução de 14 dias com IA
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              Taxa de Entrega HSM
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-emerald-600">98.4%</div>
            <p className="text-[11px] text-slate-500 mt-1">WhatsApp Business Cloud API</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              Taxa de Leitura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-sky-600">89.1%</div>
            <p className="text-[11px] text-slate-500 mt-1">Lembretes abertos em até 1h</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-slate-500 uppercase">
              Resolução Autônoma IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-indigo-600">76.2%</div>
            <p className="text-[11px] text-slate-500 mt-1">Sem necessidade de operador humano</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aging Breakdown Bar Chart */}
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900">
              Aging da Carteira (Faixas de Vencimento)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Distribuição do montante em aberto por dias de atraso
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agingData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="range" stroke="#94A3B8" fontSize={11} tickLine={false} />
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
                    formatter={(val: number) => [`R$ ${val.toLocaleString('pt-BR')}`, 'Montante']}
                  />
                  <Bar dataKey="amount" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* DSO Historical Trend */}
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-900">
              Evolução Histórica do DSO (Últimos 6 Meses)
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Tempo médio de recebimento de faturas
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dsoHistory} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} unit=" dias" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="dso"
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: '#10B981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
