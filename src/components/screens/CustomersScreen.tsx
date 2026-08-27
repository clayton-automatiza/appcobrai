import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/services/api'
import type { Customer, CustomerContact, Receivable, PaymentPromise, Ticket } from '@/types'
import { formatCurrency, formatDate, formatCNPJ, formatPhone } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Users,
  Search,
  Phone,
  Mail,
  Receipt,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Ban,
  UserX,
  History,
  ArrowLeft,
  Bot,
  ExternalLink,
  MessageSquare,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CustomersScreenProps {
  selectedCustomerId?: string | null
  onClearCustomerSelection: () => void
  onOpenChat: (customerId: string) => void
}

export function CustomersScreen({
  selectedCustomerId,
  onClearCustomerSelection,
  onOpenChat,
}: CustomersScreenProps) {
  const { selectedTenantId } = useAuth()
  const { toast } = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [contacts, setContacts] = useState<CustomerContact[]>([])
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [promises, setPromises] = useState<PaymentPromise[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])

  // Load Customer List
  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const res = await api.customers.list(selectedTenantId, search, 1, 50)
      setCustomers(res.items || [])
    } catch (err) {
      console.error('Failed to fetch customers', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [selectedTenantId])

  // Load Specific Customer Details if selected
  useEffect(() => {
    const loadDetails = async () => {
      if (!selectedCustomerId) {
        setSelectedCustomer(null)
        return
      }
      try {
        const cust = await api.customers.get(selectedCustomerId)
        setSelectedCustomer(cust)

        const [cntRes, recRes, promRes, tktRes] = await Promise.all([
          api.customers.getContacts(selectedCustomerId),
          api.receivables.list({ customerId: selectedCustomerId, perPage: 100 }),
          api.paymentPromises.list(selectedCustomerId),
          api.tickets.list(undefined),
        ])

        setContacts(cntRes || [])
        setReceivables(recRes.items || [])
        setPromises(promRes || [])
        setTickets((tktRes || []).filter((t) => t.customer === selectedCustomerId))
      } catch (err) {
        console.error('Failed to load customer profile', err)
      }
    }

    loadDetails()
  }, [selectedCustomerId])

  const handleToggleOptOut = async () => {
    if (!selectedCustomer) return
    const newVal = !selectedCustomer.is_opted_out
    await api.customers.update(selectedCustomer.id, { is_opted_out: newVal })
    setSelectedCustomer({ ...selectedCustomer, is_opted_out: newVal })
    toast({
      title: newVal ? 'Cliente em Opt-Out' : 'Opt-Out Removido',
      description: newVal
        ? 'Envios automáticos bloqueados para este cliente.'
        : 'Cliente reativado para réguas normais.',
    })
  }

  const handleToggleHumanOnly = async () => {
    if (!selectedCustomer) return
    const newVal = !selectedCustomer.human_only
    await api.customers.update(selectedCustomer.id, { human_only: newVal })
    setSelectedCustomer({ ...selectedCustomer, human_only: newVal })
    toast({
      title: newVal ? 'Marcado como Human-Only' : 'Human-Only Desativado',
      description: newVal
        ? 'Atendimento da IA silenciado; escalado apenas para operadores humanos.'
        : 'IA reabilitada para responder dúvidas.',
    })
  }

  // If a single customer is selected, show the full detailed profile view
  if (selectedCustomer) {
    const totalDebt = receivables
      .filter((r) => r.status === 'open' || r.status === 'partially_paid')
      .reduce((acc, r) => acc + (Number(r.open_amount) || 0), 0)

    return (
      <div className="space-y-6 animate-in fade-in">
        {/* Back and Header Action Bar */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearCustomerSelection}
            className="text-xs text-slate-600 hover:text-slate-900 gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para lista de clientes
          </Button>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={selectedCustomer.human_only ? 'default' : 'outline'}
              onClick={handleToggleHumanOnly}
              className={`text-xs h-8 ${
                selectedCustomer.human_only ? 'bg-amber-600 hover:bg-amber-500 text-white' : ''
              }`}
            >
              <UserX className="w-3.5 h-3.5 mr-1" />
              {selectedCustomer.human_only ? 'Human Only (Ativo)' : 'Definir Human Only'}
            </Button>
            <Button
              size="sm"
              variant={selectedCustomer.is_opted_out ? 'destructive' : 'outline'}
              onClick={handleToggleOptOut}
              className="text-xs h-8"
            >
              <Ban className="w-3.5 h-3.5 mr-1" />
              {selectedCustomer.is_opted_out ? 'Opt-Out (Bloqueado)' : 'Aplicar Opt-Out'}
            </Button>
            <Button
              size="sm"
              onClick={() => onOpenChat(selectedCustomer.id)}
              className="text-xs h-8 bg-sky-500 hover:bg-sky-400 text-white font-semibold shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1" /> Abrir Atendimento
            </Button>
          </div>
        </div>

        {/* Profile Card Header */}
        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900">{selectedCustomer.name}</h1>
                  <Badge variant="outline" className="text-[11px] font-semibold">
                    {selectedCustomer.segment || 'Geral'}
                  </Badge>
                  {selectedCustomer.is_opted_out && (
                    <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px]">
                      Opt-Out
                    </Badge>
                  )}
                  {selectedCustomer.human_only && (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
                      Human-Only
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                  <span>
                    CNPJ/CPF: <strong>{formatCNPJ(selectedCustomer.document)}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    ID Conexos: <code>{selectedCustomer.external_id || 'N/A'}</code>
                  </span>
                  <span>•</span>
                  <span>
                    Risco:{' '}
                    <strong className="capitalize text-slate-700">
                      {selectedCustomer.risk_flag || 'baixo'}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Total Debt Box */}
              <div className="bg-slate-900 text-white p-4 rounded-xl text-right min-w-[200px] shadow-sm">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">
                  Saldo Devedor Aberto
                </div>
                <div className="text-2xl font-black text-sky-400">{formatCurrency(totalDebt)}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {receivables.filter((r) => r.status === 'open').length} títulos pendentes
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contacts and Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contacts Panel */}
          <Card className="border-slate-200 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-sky-600" /> Contatos Validados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contacts.length === 0 ? (
                <div className="text-xs text-slate-400 py-4 text-center">
                  Nenhum contato cadastrado.
                </div>
              ) : (
                contacts.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                        {c.type === 'whatsapp' ? (
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Mail className="w-3.5 h-3.5 text-sky-600" />
                        )}
                        <span>{c.type === 'whatsapp' ? formatPhone(c.value) : c.value}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {c.is_primary ? 'Principal' : 'Secundário'} •{' '}
                        {c.is_valid !== false ? 'Válido' : 'Inválido'}
                      </div>
                    </div>
                    {c.is_valid !== false ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Promises & Tickets */}
          <Card className="border-slate-200 shadow-2xs lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" /> Promessas e Chamados Abertos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="text-xs font-bold text-slate-900 mb-2 flex items-center justify-between">
                    <span>Promessas de Pagamento</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {promises.length}
                    </Badge>
                  </div>
                  {promises.length === 0 ? (
                    <p className="text-xs text-slate-400">Nenhuma promessa ativa.</p>
                  ) : (
                    promises.map((p) => (
                      <div
                        key={p.id}
                        className="text-xs py-1 border-b border-slate-100 last:border-0"
                      >
                        <div className="font-semibold text-amber-700">
                          {formatCurrency(p.promised_amount)} para {formatDate(p.promised_date)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Origem: {p.source} • Status: {p.status}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="text-xs font-bold text-slate-900 mb-2 flex items-center justify-between">
                    <span>Chamados / Tickets</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {tickets.length}
                    </Badge>
                  </div>
                  {tickets.length === 0 ? (
                    <p className="text-xs text-slate-400">Nenhum ticket aberto.</p>
                  ) : (
                    tickets.map((t) => (
                      <div
                        key={t.id}
                        className="text-xs py-1 border-b border-slate-100 last:border-0"
                      >
                        <div className="font-semibold text-slate-800 truncate">{t.reason}</div>
                        <div className="text-[10px] text-slate-400">
                          Status: {t.status} • Criado em {formatDate(t.created)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Receivables Table */}
        <Card className="border-slate-200 shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-sky-600" /> Histórico de Títulos & Faturas
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Todos os títulos vinculados a este cliente no ERP Conexos
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3">Fatura</th>
                    <th className="p-3">Emissão</th>
                    <th className="p-3">Vencimento</th>
                    <th className="p-3 text-right">Valor</th>
                    <th className="p-3 text-right">Saldo Aberto</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">2ª Via</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receivables.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="p-3 font-semibold text-slate-900">
                        {r.document_number || r.external_id}
                      </td>
                      <td className="p-3 text-slate-500">{formatDate(r.issue_date)}</td>
                      <td className="p-3 font-medium text-slate-700">{formatDate(r.due_date)}</td>
                      <td className="p-3 text-right text-slate-600">{formatCurrency(r.amount)}</td>
                      <td className="p-3 text-right font-bold text-slate-900">
                        {formatCurrency(r.open_amount)}
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant="secondary"
                          className={
                            r.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-800'
                          }
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        {r.boleto_url && (
                          <a
                            href={r.boleto_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-600 hover:underline flex items-center justify-end gap-1"
                          >
                            Boleto <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Otherwise, render full customer directory list
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-sky-600" /> Diretório de Clientes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Sacados, contatos validados, flags de risco e preferências de cobrança friendly.
          </p>
        </div>
      </div>

      {/* Search Header */}
      <Card className="border-slate-200 shadow-2xs">
        <CardContent className="p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              fetchCustomers()
            }}
            className="flex items-center gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                placeholder="Buscar por Razão Social, Nome Fantasia ou CNPJ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 focus-visible:ring-sky-500"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              className="h-9 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs"
            >
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Grid of Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-xs text-slate-400">
            Carregando clientes...
          </div>
        ) : customers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-xs text-slate-400">
            Nenhum cliente encontrado.
          </div>
        ) : (
          customers.map((c) => (
            <Card
              key={c.id}
              onClick={() => setSelectedCustomer(c)}
              className="border-slate-200 shadow-2xs hover:shadow-md hover:border-sky-300 transition-all cursor-pointer group"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
                    {c.name}
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {c.risk_flag || 'baixo'}
                  </Badge>
                </div>
                <CardDescription className="text-xs text-slate-500 font-mono">
                  {formatCNPJ(c.document)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 text-xs text-slate-600 space-y-2">
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                  <span className="text-slate-400">{c.segment || 'Geral'}</span>
                  <div className="flex items-center gap-1">
                    {c.is_opted_out && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-bold">
                        Opt-Out
                      </span>
                    )}
                    {c.human_only && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold">
                        Human-Only
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
