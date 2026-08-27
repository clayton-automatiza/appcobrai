import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/services/api'
import type { MessageTemplate } from '@/types'
import { formatDate } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  FileText,
  Plus,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  Sparkles,
  Eye,
  Trash2,
  Copy,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function TemplatesScreen() {
  const { selectedTenantId, tenants } = useAuth()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [selectedTpl, setSelectedTpl] = useState<MessageTemplate | null>(null)
  const [loading, setLoading] = useState(true)

  // New Template Dialog
  const [newOpen, setNewOpen] = useState(false)
  const [name, setName] = useState('')
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp')
  const [category, setCategory] = useState('utility')
  const [hsmName, setHsmName] = useState('')
  const [body, setBody] = useState('')

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const list = await api.templates.list(selectedTenantId)
      setTemplates(list)
      if (list.length > 0 && !selectedTpl) {
        setSelectedTpl(list[0])
      }
    } catch (err) {
      console.error('Failed to load templates', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [selectedTenantId])

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !body.trim()) return

    try {
      const tenantToUse = selectedTenantId === 'all' ? tenants[0]?.id || '' : selectedTenantId
      await api.templates.create({
        tenant: tenantToUse,
        name,
        channel,
        category,
        external_template_name: hsmName,
        language: 'pt_BR',
        body,
        variables: ['customer_name', 'document_number', 'amount', 'due_date', 'boleto_url'],
        approval_status: 'approved',
      })

      toast({
        title: 'Template Criado',
        description: `Template '${name}' salvo com status aprovado.`,
      })

      setNewOpen(false)
      setName('')
      setHsmName('')
      setBody('')
      fetchTemplates()
    } catch (err) {
      toast({
        title: 'Erro ao criar',
        description: 'Falha ao persistir template.',
        variant: 'destructive',
      })
    }
  }

  // Render dummy live preview
  const renderPreviewBody = (rawBody: string) => {
    return rawBody
      .replace(/{{customer_name}}/g, 'Transportes & Logística Silva S.A.')
      .replace(/{{document_number}}/g, 'FAT-20250912')
      .replace(/{{amount}}/g, 'R$ 4.850,00')
      .replace(/{{due_date}}/g, '28/08/2025')
      .replace(/{{boleto_url}}/g, 'https://fatura.vilaporto.com.br/boleto/REC-912')
      .replace(/{{payment_link_url}}/g, 'https://fatura.vilaporto.com.br/pay/REC-912')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-sky-600" /> Templates de Mensagem (WhatsApp & E-mail)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Modelos de comunicação cordial com homologação HSM Meta e preview de variáveis.
          </p>
        </div>

        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs h-9">
              <Plus className="w-4 h-4 mr-1.5" /> Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-white">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                Criar Template de Mensagem
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTemplate} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Nome Interno</label>
                <Input
                  required
                  placeholder="Ex: Lembrete Cordial D-2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Canal</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="w-full h-9 rounded-md border border-slate-200 bg-slate-50 px-3 text-xs"
                  >
                    <option value="whatsapp">WhatsApp (HSM)</option>
                    <option value="email">E-mail Transacional</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Nome HSM (Meta)</label>
                  <Input
                    placeholder="hsm_lembrete_v1"
                    value={hsmName}
                    onChange={(e) => setHsmName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">Corpo da Mensagem</label>
                  <span className="text-[10px] text-slate-400">
                    Use tags: {'{{customer_name}}'}, {'{{document_number}}'}, {'{{amount}}'},{' '}
                    {'{{due_date}}'}
                  </span>
                </div>
                <Textarea
                  rows={5}
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Olá {{customer_name}}, lembramos que o título {{document_number}}..."
                  className="text-xs font-mono bg-slate-50 border-slate-200"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="submit"
                  className="w-full bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs"
                >
                  Salvar Template
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* List */}
        <Card className="lg:col-span-5 border-slate-200 shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Templates Cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">Carregando...</div>
            ) : templates.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Nenhum template encontrado.
              </div>
            ) : (
              templates.map((tpl) => {
                const isSelected = selectedTpl?.id === tpl.id
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTpl(tpl)}
                    className={`p-4 cursor-pointer hover:bg-slate-50 transition-all ${
                      isSelected ? 'bg-sky-50/70 border-l-4 border-sky-600' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        {tpl.channel === 'whatsapp' ? (
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Mail className="w-3.5 h-3.5 text-sky-600" />
                        )}
                        <span>{tpl.name}</span>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                        Aprovado
                      </Badge>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{tpl.body}</div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Live Preview Panel */}
        <Card className="lg:col-span-7 border-slate-200 shadow-2xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-600" /> Pré-visualização com Dados Reais
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Como o cliente do Grupo Vila Porto visualizará a mensagem em seu aplicativo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {selectedTpl ? (
              <>
                {/* Meta Header */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">{selectedTpl.name}</div>
                    <div className="text-[11px] text-slate-500">
                      HSM: <code>{selectedTpl.external_template_name || 'hsm_default'}</code> •
                      Idioma: {selectedTpl.language || 'pt_BR'}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs uppercase font-bold">
                    {selectedTpl.channel}
                  </Badge>
                </div>

                {/* Simulated Phone Screen */}
                <div className="max-w-md mx-auto bg-slate-900 p-4 rounded-3xl shadow-xl border-4 border-slate-800">
                  <div className="bg-[#EFEAE2] p-4 rounded-2xl min-h-[220px] text-slate-800 flex flex-col justify-end">
                    <div className="bg-white p-3.5 rounded-xl rounded-tl-xs shadow-sm max-w-[90%] text-xs leading-relaxed space-y-2 border border-slate-200/60">
                      <p className="whitespace-pre-wrap">{renderPreviewBody(selectedTpl.body)}</p>
                      <div className="text-[10px] text-slate-400 text-right">
                        10:42 • <CheckCircle2 className="w-3 h-3 text-sky-500 inline ml-0.5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Raw Body Code */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-700">
                    Estrutura com Placeholders:
                  </div>
                  <pre className="p-3 bg-slate-950 text-slate-200 rounded-lg text-xs font-mono whitespace-pre-wrap">
                    {selectedTpl.body}
                  </pre>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-xs text-slate-400">
                Selecione um template para visualizar a simulação.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
