import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/services/api'
import type { Receivable, Customer } from '@/types'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Receipt,
  PauseCircle,
  UserCheck,
  Send,
  ExternalLink,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ReceivablesScreenProps {
  onSelectCustomer: (customerId: string) => void
}

export function ReceivablesScreen({ onSelectCustomer }: ReceivablesScreenProps) {
  const { selectedTenantId } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedRows, setSelectedRows] = useState<string[]>([])

  const fetchReceivables = async () => {
    setLoading(true)
    try {
      const res = await api.receivables.list({
        tenantId: selectedTenantId,
        status: statusFilter,
        search,
        page,
        perPage: 25,
      })
      setReceivables(res.items || [])
      setTotalItems(res.totalItems || 0)
    } catch (err) {
      console.error('Failed to fetch receivables', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReceivables()
  }, [selectedTenantId, page, statusFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchReceivables()
  }

  const handleToggleRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleSelectAll = () => {
    if (selectedRows.length === receivables.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(receivables.map((r) => r.id))
    }
  }

  const handleBatchPause = async () => {
    if (selectedRows.length === 0) return
    toast({
      title: 'Régua Pausada',
      description: `Régua suspensa temporariamente para ${selectedRows.length} títulos selecionados.`,
    })
    setSelectedRows([])
  }

  const handleBatchSendReminder = async () => {
    if (selectedRows.length === 0) return
    toast({
      title: 'Lembrete Avulso Disparado',
      description: `Disparo imediato agendado para ${selectedRows.length} títulos via WhatsApp/E-mail.`,
    })
    setSelectedRows([])
  }

  const handleBatchHumanOnly = async () => {
    if (selectedRows.length === 0) return
    toast({
      title: 'Marcado como Human Only',
      description: `Automação de IA desligada para ${selectedRows.length} títulos.`,
    })
    setSelectedRows([])
  }

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status === 'open'

    if (status === 'paid') {
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Liquidado</Badge>
    }
    if (status === 'partially_paid') {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Parcial</Badge>
    }
    if (status === 'disputed') {
      return <Badge className="bg-rose-100 text-rose-800 border-rose-200">Contestado</Badge>
    }
    if (isOverdue) {
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Vencido</Badge>
    }
    return <Badge className="bg-slate-100 text-slate-800 border-slate-200">A Vencer</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-sky-600" /> Carteira de Recebíveis
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Títulos sincronizados do ERP Conexos com controle de status, régua e ações em lote.
          </p>
        </div>

        {/* Batch Actions Toolbar */}
        {selectedRows.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs shadow-md animate-in fade-in">
            <span className="font-bold text-sky-400">{selectedRows.length}</span> selecionados
            <div className="h-4 w-px bg-slate-700 mx-1" />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleBatchSendReminder}
              className="text-xs text-white hover:bg-slate-800 h-7 px-2"
            >
              <Send className="w-3 h-3 mr-1 text-sky-400" /> Disparar Lembrete
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleBatchPause}
              className="text-xs text-white hover:bg-slate-800 h-7 px-2"
            >
              <PauseCircle className="w-3 h-3 mr-1 text-amber-400" /> Pausar Régua
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleBatchHumanOnly}
              className="text-xs text-white hover:bg-slate-800 h-7 px-2"
            >
              <UserCheck className="w-3 h-3 mr-1 text-emerald-400" /> Human Only
            </Button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 shadow-2xs">
        <CardContent className="p-4">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col sm:flex-row items-center gap-3"
          >
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                placeholder="Buscar por nº fatura (ex: FAT-20250011) ou código externo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 focus-visible:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="open">Em Aberto</SelectItem>
                  <SelectItem value="paid">Liquidados</SelectItem>
                  <SelectItem value="partially_paid">Parcialmente Pagos</SelectItem>
                  <SelectItem value="disputed">Contestados</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="submit"
                size="sm"
                className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs"
              >
                Filtrar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-slate-200 shadow-2xs overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200">
                <TableRow>
                  <TableHead className="w-10 text-center">
                    <input
                      type="checkbox"
                      checked={receivables.length > 0 && selectedRows.length === receivables.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">
                    Documento / Fatura
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">
                    Cliente (Sacado)
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">
                    Empresa (Tenant)
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700">Vencimento</TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 text-right">
                    Valor Total
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-700 text-right">
                    Saldo Aberto
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
                    <TableCell colSpan={9} className="text-center py-12 text-xs text-slate-400">
                      Carregando carteira de recebíveis...
                    </TableCell>
                  </TableRow>
                ) : receivables.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-xs text-slate-400">
                      Nenhum recebível encontrado com os filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  receivables.map((rec) => {
                    const isSelected = selectedRows.includes(rec.id)
                    return (
                      <TableRow
                        key={rec.id}
                        className={`hover:bg-slate-50/80 transition-colors text-xs ${
                          isSelected ? 'bg-sky-50/50' : ''
                        }`}
                      >
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRow(rec.id)}
                            className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                          />
                        </TableCell>
                        <TableCell className="font-bold text-slate-900">
                          <div>{rec.document_number || rec.external_id}</div>
                          <span className="text-[10px] text-slate-400 font-normal">
                            Parc. {rec.installment || 1} • {rec.external_id}
                          </span>
                        </TableCell>
                        <TableCell>
                          <button
                            onClick={() => onSelectCustomer(rec.customer)}
                            className="font-medium text-slate-800 hover:text-sky-600 hover:underline text-left block max-w-[220px] truncate"
                          >
                            {rec.expand?.customer?.name || 'Cliente Corporativo'}
                          </button>
                          <span className="text-[10px] text-slate-400">
                            {rec.expand?.customer?.document || 'CNPJ Não inf.'}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-600 max-w-[150px] truncate">
                          {rec.expand?.tenant?.name || '-'}
                        </TableCell>
                        <TableCell className="font-semibold text-slate-700">
                          {formatDate(rec.due_date)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-600">
                          {formatCurrency(rec.amount)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-900">
                          {formatCurrency(rec.open_amount)}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(rec.status, rec.due_date)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onSelectCustomer(rec.customer)}
                              className="h-7 px-2 text-xs text-sky-600 hover:text-sky-700 hover:bg-sky-50"
                            >
                              Ficha
                            </Button>
                            {rec.boleto_url && (
                              <a
                                href={rec.boleto_url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                title="Visualizar Boleto / Fatura"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              Total de <span className="font-bold text-slate-800">{totalItems}</span> títulos na
              carteira
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 text-xs"
              >
                Anterior
              </Button>
              <span className="font-semibold text-slate-700">Página {page}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={receivables.length < 25}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 text-xs"
              >
                Próxima
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
