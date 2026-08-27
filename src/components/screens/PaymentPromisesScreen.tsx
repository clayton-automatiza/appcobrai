import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/services/api'
import type { PaymentPromise } from '@/types'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  BadgePercent,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Bot,
  User,
  Filter,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function PaymentPromisesScreen() {
  const { selectedTenantId } = useAuth()
  const { toast } = useToast()
  const [promises, setPromises] = useState<PaymentPromise[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchPromises = async () => {
    setLoading(true)
    try {
      const list = await api.paymentPromises.list()
      setPromises(list)
    } catch (err) {
      console.error('Failed to load payment promises', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPromises()
  }, [selectedTenantId])

  const handleUpdateStatus = async (id: string, newStatus: 'kept' | 'broken' | 'cancelled') => {
    try {
      await api.paymentPromises.update(id, { status: newStatus })
      toast({
        title: 'Status Atualizado',
        description: `Promessa marcada como '${newStatus}'.`,
      })
      fetchPromises()
    } catch (err) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Falha na requisição.',
        variant: 'destructive',
      })
    }
  }

  const filtered = promises.filter((p) => {
    if (statusFilter === 'all') return true
    return p.status === statusFilter
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'kept':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Cumprida</Badge>
        )
      case 'broken':
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200">Quebrada</Badge>
      case 'cancelled':
        return <Badge className="bg-slate-100 text-slate-800 border-slate-200">Cancelada</Badge>
      default:
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            Aberta (Aguardando)
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BadgePercent className="w-6 h-6 text-sky-600" /> Promessas de Pagamento
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Acordos informais capturados automaticamente pelo CobraAI e negociadores humanos.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
          {['all', 'open', 'kept', 'broken'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md transition-all ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st === 'all'
                ? 'Todas'
                : st === 'open'
                  ? 'Abertas'
                  : st === 'kept'
                    ? 'Cumpridas'
                    : 'Quebradas'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="border-slate-200 shadow-2xs overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200">
                <TableRow>
                  <TableHead className="text-xs font-bold text-slate-700">
                    Cliente (Sacado)
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Data Prometida</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 text-right">
                    Valor Prometido
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 text-center">
                    Origem
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 text-center">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 text-right">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-xs text-slate-400">
                      Carregando promessas...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-xs text-slate-400">
                      Nenhuma promessa de pagamento encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id} className="hover:bg-slate-50/80 text-xs">
                      <TableCell className="font-bold text-slate-900">
                        {p.expand?.customer?.name || 'Cliente Corporativo'}
                      </TableCell>
                      <TableCell className="font-semibold text-slate-700">
                        {formatDate(p.promised_date)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900">
                        {formatCurrency(p.promised_amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {p.source === 'agent' ? (
                            <>
                              <Bot className="w-3 h-3 text-indigo-600" /> Agente IA
                            </>
                          ) : (
                            <>
                              <User className="w-3 h-3 text-sky-600" /> Humano
                            </>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{getStatusBadge(p.status)}</TableCell>
                      <TableCell className="text-right">
                        {p.status === 'open' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateStatus(p.id, 'kept')}
                              className="h-7 px-2 text-xs text-emerald-700 hover:bg-emerald-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Cumprida
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateStatus(p.id, 'broken')}
                              className="h-7 px-2 text-xs text-rose-700 hover:bg-rose-50"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" /> Quebrada
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
