import React, { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/services/api'
import type { Conversation, Message, Customer } from '@/types'
import { formatDate, formatDateTime } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  Bot,
  User,
  Send,
  UserCheck,
  RotateCcw,
  Sparkles,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ChatBoxScreenProps {
  initialCustomerId?: string | null
}

export function ChatBoxScreen({ initialCustomerId }: ChatBoxScreenProps) {
  const { user, selectedTenantId } = useAuth()
  const { toast } = useToast()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [aiThinking, setAiThinking] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchConversations = async () => {
    setLoading(true)
    try {
      const list = await api.conversations.list(selectedTenantId)
      setConversations(list)
      if (list.length > 0 && !selectedConv) {
        if (initialCustomerId) {
          const match = list.find((c) => c.customer === initialCustomerId)
          setSelectedConv(match || list[0])
        } else {
          setSelectedConv(list[0])
        }
      }
    } catch (err) {
      console.error('Failed to load conversations', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [selectedTenantId])

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConv) return
      try {
        const msgs = await api.conversations.getMessages(selectedConv.id)
        setMessages(msgs)
      } catch (err) {
        console.error('Failed to load messages', err)
      }
    }
    loadMessages()
  }, [selectedConv])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, aiThinking])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || !selectedConv) return

    setSending(true)
    const text = inputMessage
    setInputMessage('')

    try {
      // 1. Post message in conversation
      const newMsg = await api.conversations.sendMessage(
        selectedConv.id,
        text,
        selectedConv.channel,
      )
      setMessages((prev) => [...prev, newMsg])

      // If conversation is in bot mode, trigger native AI agent hook
      if (selectedConv.status === 'bot' || selectedConv.status === 'awaiting_customer') {
        setAiThinking(true)
        try {
          const custName = selectedConv.expand?.customer?.name || 'Cliente'
          const custDoc = selectedConv.expand?.customer?.document || ''
          const contextStr = `Cliente: ${custName}, CNPJ: ${custDoc}. Canal: ${selectedConv.channel}`

          const agentRes = await api.agent.chat(text, contextStr, selectedConv.id)
          if (agentRes && agentRes.content) {
            // Save AI agent reply
            const aiMsg = await api.conversations.sendMessage(
              selectedConv.id,
              agentRes.content,
              selectedConv.channel,
            )
            setMessages((prev) => [...prev, aiMsg])
          }
        } catch (agentErr) {
          console.error('AI response error:', agentErr)
        } finally {
          setAiThinking(false)
        }
      }
    } catch (err) {
      toast({
        title: 'Erro no envio',
        description: 'Não foi possível enviar a mensagem.',
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  const handleTakeOver = async () => {
    if (!selectedConv) return
    await api.conversations.update(selectedConv.id, {
      status: 'human_active',
      assigned_user: user?.id,
    })
    setSelectedConv({ ...selectedConv, status: 'human_active', assigned_user: user?.id })
    toast({
      title: 'Atendimento Assumido',
      description: 'Você assumiu o controle. O agente de IA foi silenciado para esta conversa.',
    })
  }

  const handleReturnToBot = async () => {
    if (!selectedConv) return
    await api.conversations.update(selectedConv.id, {
      status: 'bot',
      assigned_user: undefined,
    })
    setSelectedConv({ ...selectedConv, status: 'bot', assigned_user: undefined })
    toast({
      title: 'Devolvido ao Agente IA',
      description: 'O CobraAI retomou as respostas automáticas para este cliente.',
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'human_needed':
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px]">
            Escalação Humana
          </Badge>
        )
      case 'human_active':
        return (
          <Badge className="bg-sky-100 text-sky-800 border-sky-200 text-[10px]">
            Operador Ativo
          </Badge>
        )
      case 'awaiting_customer':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
            Aguardando Cliente
          </Badge>
        )
      default:
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
            IA Conexos
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-sky-600" /> Caixa de Atendimento Unificada
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Monitoramento de negociações ativas via WhatsApp e E-mail com intervenção humana em tempo
          real.
        </p>
      </div>

      {/* Split View Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-220px)] min-h-[580px]">
        {/* Left List of Conversations */}
        <Card className="lg:col-span-4 border-slate-200 shadow-2xs flex flex-col overflow-hidden h-full">
          <CardHeader className="p-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Conversas Recentes
              </CardTitle>
              <Badge variant="secondary" className="text-xs font-semibold">
                {conversations.length} ativas
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">Carregando conversas...</div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Nenhuma conversa encontrada.
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`p-3 cursor-pointer transition-all hover:bg-slate-50 ${
                      isSelected ? 'bg-sky-50/60 border-l-4 border-sky-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-xs text-slate-900 truncate">
                        {conv.expand?.customer?.name || 'Cliente Corporativo'}
                      </div>
                      <div className="shrink-0">{getStatusBadge(conv.status)}</div>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        {conv.channel === 'whatsapp' ? (
                          <Phone className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Mail className="w-3 h-3 text-sky-600" />
                        )}
                        <span className="capitalize">{conv.channel}</span>
                      </span>
                      <span>{formatDate(conv.updated)}</span>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        {/* Right Chat Panel */}
        <Card className="lg:col-span-8 border-slate-200 shadow-2xs flex flex-col overflow-hidden h-full">
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="p-3.5 border-b border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {selectedConv.expand?.customer?.name?.slice(0, 2).toUpperCase() || 'VP'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      {selectedConv.expand?.customer?.name || 'Cliente Vila Porto'}
                      {getStatusBadge(selectedConv.status)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Canal: <strong className="capitalize">{selectedConv.channel}</strong> •
                      Documento: {selectedConv.expand?.customer?.document || '-'}
                    </div>
                  </div>
                </div>

                {/* Operator Control Buttons */}
                <div className="flex items-center gap-2">
                  {selectedConv.status === 'human_active' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleReturnToBot}
                      className="text-xs h-8 border-slate-300 text-slate-700"
                    >
                      <RotateCcw className="w-3.5 h-3.5 mr-1 text-sky-600" /> Devolver ao Bot IA
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleTakeOver}
                      className="text-xs h-8 bg-slate-900 hover:bg-slate-800 text-white font-semibold"
                    >
                      <UserCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Assumir
                      Atendimento
                    </Button>
                  )}
                </div>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400">
                    Nenhuma mensagem registrada nesta conversa.
                  </div>
                ) : (
                  messages.map((m) => {
                    const isOut = m.direction === 'out'
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isOut ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-2xs ${
                            isOut
                              ? 'bg-slate-900 text-white rounded-br-xs'
                              : 'bg-white text-slate-900 border border-slate-200 rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.body}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1 px-1">
                          {isOut ? (
                            <span className="flex items-center gap-1 text-sky-600 font-semibold">
                              <Bot className="w-3 h-3" /> CobraAI
                            </span>
                          ) : (
                            <span className="font-medium text-slate-600">Cliente</span>
                          )}
                          <span>•</span>
                          <span>{formatDateTime(m.created)}</span>
                          {m.detected_intent && (
                            <span className="bg-slate-200 text-slate-700 px-1 rounded text-[9px]">
                              Intenção: {m.detected_intent}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}

                {aiThinking && (
                  <div className="flex items-center gap-2 text-xs text-sky-600 bg-sky-50 border border-sky-200 p-2.5 rounded-xl w-fit animate-pulse">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>CobraAI está analisando e formulando resposta cordial...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-3 border-t border-slate-200 bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <Input
                    placeholder="Digite a mensagem para o cliente (ou comando para o assistente)..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    disabled={sending}
                    className="h-10 text-xs bg-slate-50 border-slate-200 focus-visible:ring-sky-500"
                  />
                  <Button
                    type="submit"
                    disabled={sending || !inputMessage.trim()}
                    className="h-10 px-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-sky-500/20"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 text-xs">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-2" />
              <p>Selecione uma conversa ao lado para visualizar o histórico de mensagens.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
