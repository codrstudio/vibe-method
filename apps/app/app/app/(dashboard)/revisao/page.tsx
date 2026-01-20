'use client'

import { useState, useEffect, useCallback } from 'react'
import { type Metadata } from 'next'
import { CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BreadcrumbBar } from '@/components/breadcrumb-bar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface Report {
  id: string
  title: string
  content: string | null
  source: string
  status: string
  priority: number
  ai_confidence: number | null
  ai_suggestion: string | null
  review_deadline: string | null
  created_at: string
}

interface ReviewStats {
  pending: number
  approved_today: number
  rejected_today: number
  fallback_today: number
  timeout_today: number
  overdue: number
  avg_review_time_ms: number | null
}

type ActionType = 'approve' | 'reject' | 'fallback' | null

export default function RevisaoPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Modal state
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [actionType, setActionType] = useState<ActionType>(null)
  const [reason, setReason] = useState('')
  const [fallbackText, setFallbackText] = useState('')
  const [processing, setProcessing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [reportsRes, statsRes] = await Promise.all([
        fetch('/api/biz/review?endpoint=pending'),
        fetch('/api/biz/review?endpoint=stats'),
      ])

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json()
        setReports(reportsData.data || [])
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.data)
      }
    } catch (error) {
      console.error('Failed to fetch review data:', error)
      toast.error('Erro ao carregar dados de revisao')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [fetchData])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const openActionModal = (report: Report, action: ActionType) => {
    setSelectedReport(report)
    setActionType(action)
    setReason('')
    setFallbackText('')
  }

  const closeModal = () => {
    setSelectedReport(null)
    setActionType(null)
    setReason('')
    setFallbackText('')
  }

  const handleAction = async () => {
    if (!selectedReport || !actionType) return

    if (actionType === 'reject' && !reason.trim()) {
      toast.error('Motivo e obrigatorio para rejeicao')
      return
    }

    if (actionType === 'fallback' && !fallbackText.trim()) {
      toast.error('Texto de fallback e obrigatorio')
      return
    }

    setProcessing(true)

    try {
      const body: Record<string, string> = {}
      if (reason) body.reason = reason
      if (fallbackText) body.fallback_text = fallbackText

      const res = await fetch(`/api/biz/review/${selectedReport.id}/${actionType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Falha ao processar acao')
      }

      const actionLabels = {
        approve: 'aprovado',
        reject: 'rejeitado',
        fallback: 'marcado como fallback',
      }

      toast.success(`Relatorio ${actionLabels[actionType]} com sucesso`)
      closeModal()
      fetchData()
    } catch (error) {
      console.error('Action failed:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao processar acao')
    } finally {
      setProcessing(false)
    }
  }

  const formatTime = (ms: number | null) => {
    if (!ms) return '-'
    const mins = Math.floor(ms / 60000)
    if (mins < 60) return `${mins}min`
    const hours = Math.floor(mins / 60)
    return `${hours}h ${mins % 60}min`
  }

  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  const getTimeRemaining = (deadline: string | null) => {
    if (!deadline) return null
    const diff = new Date(deadline).getTime() - new Date().getTime()
    if (diff < 0) return 'Vencido'
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}min`
    const hours = Math.floor(mins / 60)
    return `${hours}h ${mins % 60}min`
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <BreadcrumbBar items={[]} currentPage="Revisao" />
        <div className="flex flex-1 items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <BreadcrumbBar items={[]} currentPage="Revisao" />

      <div className="flex-1 space-y-4 p-4">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pending || 0}</div>
              {stats?.overdue ? (
                <p className="text-xs text-destructive">
                  {stats.overdue} vencido(s)
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">aguardando revisao</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovados Hoje</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.approved_today || 0}</div>
              <p className="text-xs text-muted-foreground">
                tempo medio: {formatTime(stats?.avg_review_time_ms || null)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejeitados Hoje</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.rejected_today || 0}</div>
              <p className="text-xs text-muted-foreground">precisaram correcao</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fallback/Timeout</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats?.fallback_today || 0) + (stats?.timeout_today || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.fallback_today || 0} fallback, {stats?.timeout_today || 0} timeout
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Reports List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Relatorios Pendentes</CardTitle>
              <CardDescription>
                {reports.length} relatorio(s) aguardando revisao
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  Nenhum relatorio pendente de revisao
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className={`rounded-lg border p-4 ${
                      isOverdue(report.review_deadline)
                        ? 'border-destructive/50 bg-destructive/5'
                        : ''
                    }`}
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-2">
                          <h3 className="font-semibold">{report.title}</h3>
                          {report.priority >= 5 && (
                            <Badge variant="destructive">Urgente</Badge>
                          )}
                          {report.ai_confidence && (
                            <Badge variant="outline">
                              {report.ai_confidence.toFixed(0)}% conf
                            </Badge>
                          )}
                        </div>

                        {report.content && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {report.content}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>Fonte: {report.source}</span>
                          <span>|</span>
                          <span>
                            Criado: {new Date(report.created_at).toLocaleString('pt-BR')}
                          </span>
                          {report.review_deadline && (
                            <>
                              <span>|</span>
                              <span
                                className={
                                  isOverdue(report.review_deadline) ? 'text-destructive font-medium' : ''
                                }
                              >
                                Prazo: {getTimeRemaining(report.review_deadline)}
                              </span>
                            </>
                          )}
                        </div>

                        {report.ai_suggestion && (
                          <p className="text-sm">
                            <span className="text-muted-foreground">Sugestao IA: </span>
                            <span className="font-medium">
                              {report.ai_suggestion === 'approve' ? 'Aprovar' : 'Revisar manualmente'}
                            </span>
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 md:flex-col">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => openActionModal(report, 'approve')}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openActionModal(report, 'reject')}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Rejeitar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openActionModal(report, 'fallback')}
                        >
                          <AlertTriangle className="mr-1 h-4 w-4" />
                          Fallback
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Modal */}
      <Dialog open={!!actionType} onOpenChange={() => closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Aprovar Relatorio'}
              {actionType === 'reject' && 'Rejeitar Relatorio'}
              {actionType === 'fallback' && 'Aplicar Fallback'}
            </DialogTitle>
            <DialogDescription>
              {selectedReport?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {actionType === 'approve' && (
              <div>
                <label className="text-sm font-medium">Motivo (opcional)</label>
                <Textarea
                  placeholder="Motivo da aprovacao..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            )}

            {actionType === 'reject' && (
              <div>
                <label className="text-sm font-medium">Motivo da rejeicao *</label>
                <Textarea
                  placeholder="Explique o motivo da rejeicao..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>
            )}

            {actionType === 'fallback' && (
              <>
                <div>
                  <label className="text-sm font-medium">Texto de fallback *</label>
                  <Textarea
                    placeholder="Digite o texto alternativo a ser usado..."
                    value={fallbackText}
                    onChange={(e) => setFallbackText(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Motivo (opcional)</label>
                  <Textarea
                    placeholder="Motivo do fallback..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeModal} disabled={processing}>
              Cancelar
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              className={
                actionType === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : actionType === 'reject'
                  ? 'bg-destructive hover:bg-destructive/90'
                  : ''
              }
            >
              {processing ? 'Processando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
