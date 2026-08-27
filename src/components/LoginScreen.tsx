import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ShieldCheck, Sparkles, Building2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function LoginScreen() {
  const { login } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('claytonfreire@gmail.com')
  const [password, setPassword] = useState('Skip@Pass')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast({
        title: 'Acesso autorizado',
        description: 'Bem-vindo ao CobraAI Grupo Vila Porto.',
      })
    } catch (err: unknown) {
      toast({
        title: 'Erro ao entrar',
        description: err instanceof Error ? err.message : 'Verifique suas credenciais de acesso.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-sky-950 flex flex-col justify-center items-center p-4 selection:bg-sky-500 selection:text-white">
      {/* Glow highlight */}
      <div className="absolute top-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-black text-2xl tracking-tight">
            ⚡
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Cobra<span className="text-sky-400">AI</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-xs">
            Follow-up de recebíveis inteligente e cobrança friendly do Grupo Vila Porto
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/90 backdrop-blur-md shadow-2xl text-slate-100">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-semibold text-white">Entrar na Plataforma</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Informe suas credenciais corporativas do ERP / Backoffice
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-slate-300">
                  E-mail Corporativo
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nome@vilaporto.com.br"
                  className="bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-sky-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-medium text-slate-300">
                    Senha de Acesso
                  </Label>
                  <a
                    href="#esqueci"
                    onClick={(e) => {
                      e.preventDefault()
                      toast({
                        title: 'Recuperação de Senha',
                        description: 'Link enviado para o e-mail cadastrado caso exista.',
                      })
                    }}
                    className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    Esqueceu?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-sky-500"
                />
              </div>

              {/* Quick credential presets */}
              <div className="pt-2 border-t border-slate-800/80">
                <p className="text-[11px] text-slate-400 mb-2 flex items-center gap-1 font-medium">
                  <Sparkles className="w-3 h-3 text-sky-400" /> Acessos Rápidos de Demonstração:
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('claytonfreire@gmail.com')
                      setPassword('Skip@Pass')
                    }}
                    className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700/80 text-left text-slate-300 border border-slate-700/60 transition-all hover:border-sky-500/50"
                  >
                    <div className="font-semibold text-white">Super Admin</div>
                    <div className="text-[10px] text-slate-400 truncate">claytonfreire@...</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('gestor.financeiro@vilaporto.com.br')
                      setPassword('Skip@Pass')
                    }}
                    className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700/80 text-left text-slate-300 border border-slate-700/60 transition-all hover:border-sky-500/50"
                  >
                    <div className="font-semibold text-white">Gestor Financeiro</div>
                    <div className="text-[10px] text-slate-400 truncate">gestor.financeiro@...</div>
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-2 flex flex-col gap-3">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold shadow-md shadow-sky-500/25 h-10"
              >
                {loading ? 'Entrando...' : 'Acessar CobraAI Backoffice'}
              </Button>

              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Multi-tenant Isolado
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-sky-500" /> ERP Conexos Sync
                </span>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Friendly Principle Badge */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 text-xs text-slate-400 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-slate-200">Princípio Inegociável:</strong> Cobrança friendly e
            relacional. Lembretes cordiais, suporte ágil com IA e total respeito às regras de
            negócio.
          </p>
        </div>
      </div>
    </div>
  )
}
