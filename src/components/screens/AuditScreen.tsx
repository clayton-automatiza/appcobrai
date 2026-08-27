import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/services/api'
import type { AuditLog } from '@/types'
import { formatDate, formatDateTime } from '@/lib/formatters'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { History, ShieldCheck, Search, Activity, FileCode2 } from 'lucide-react'

export function AuditScreen() {
  const { selectedTenantId } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      try {
        const res = await api.auditLogs.list(selectedTenantId, 1, 50)
        setLogs(res.items || [])
      } catch (err) {
        console.error('Failed to load audit logs', err)
      } finally {
        setLoading(false)
      }
    }

    fetchLogs()
  }, [selectedTenantId])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <History className="w-6 h-6 text-sky-600" /> Auditoria & Trilha de Eventos
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Registro imutável de disparos de réguas, alterações manuais de clientes, opt-outs e
          sincronizações ERP.
        </p>
      </div>

      <Card className="border-slate-200 shadow-2xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Eventos Recentes ({logs.length})
            </CardTitle>
            <Badge variant="outline" className="text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 mr-1" /> Imutável
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Carregando logs de auditoria...
              </div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhum evento registrado ainda.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 hover:bg-slate-50 transition-colors text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-sky-500" />
                      <span>{log.action}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {log.entity}
                      </Badge>
                    </div>
                    <div className="text-slate-400 font-mono text-[11px]">
                      {formatDateTime(log.occurred_at || log.created)}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>Usuário: {log.expand?.user?.name || 'Sistema Conexos / Cron'}</span>
                    <span>•</span>
                    <span>Tenant: {log.expand?.tenant?.name || 'Grupo Geral'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
