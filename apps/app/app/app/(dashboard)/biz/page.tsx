'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Play,
  AlertCircle,
  CheckCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BreadcrumbBar } from '@/components/breadcrumb-bar'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'

interface DailyStats {
  approved: number
  rejected: number
  fallback: number
  timeout: number
  total: number
}

interface Pattern {
  type: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  title: string
  description: string
  value: number
  threshold: number
}

interface TodayMetrics {
  metrics: {
    pipeline_runs: number
    pipeline_successes: number
    pipeline_failures: number
    avg_duration_ms: number | null
    reports_created: number
    reports_approved: number
    reports_rejected: number
    reports_fallback: number
    reports_timeout: number
  } | null
  stats: DailyStats
  patterns: Pattern[]
}

interface PipelineRun {
  id: string
  pipeline_name: string
  status: string
  started_at: string
  completed_at: string | null
  duration_ms: number | null
  items_processed: number
  items_succeeded: number
  items_failed: number
  error_message: string | null
}

interface Alert {
  id: string
  type: string
  severity: string
  title: string
  message: string | null
  status: string
  created_at: string
}

export default function BizOperacoesPage() {
  const [todayData, setTodayData] = useState<TodayMetrics | null>(null)
  const [pipelineRuns, setPipelineRuns] = useState<PipelineRun[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [todayRes, runsRes, alertsRes] = await Promise.all([
        fetch('/api/biz/metrics?endpoint=today'),
        fetch('/api/biz/metrics?endpoint=pipeline-runs&recent=24'),
        fetch('/api/biz/metrics?endpoint=alerts'),
      ])

      if (todayRes.ok) {
        const data = await todayRes.json()
        setTodayData(data.data)
      }

      if (runsRes.ok) {
        const data = await runsRes.json()
        setPipelineRuns(data.data || [])
      }

      if (alertsRes.ok) {
        const data = await alertsRes.json()
        setAlerts(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
      toast.error('Erro ao carregar metricas')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 60000) // Refresh every 60s
    return () => clearInterval(interval)
  }, [fetchData])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const handleAlertAction = async (alertId: string, action: 'acknowledge' | 'resolve') => {
    try {
      const res = await fetch(`/api/biz/metrics/alerts/${alertId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!res.ok) {
        throw new Error('Failed to process action')
      }

      toast.success(`Alerta ${action === 'acknowledge' ? 'reconhecido' : 'resolvido'}`)
      fetchData()
    } catch (error) {
      toast.error('Erro ao processar acao')
    }
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-'
    if (ms < 1000) return `${ms}ms`
    const secs = Math.floor(ms / 1000)
    if (secs < 60) return `${secs}s`
    const mins = Math.floor(secs / 60)
    return `${mins}m ${secs % 60}s`
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'error':
        return 'destructive'
      case 'warning':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <BreadcrumbBar items={[]} currentPage="Operacoes" />
        <div className="flex flex-1 items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  const stats = todayData?.stats || { approved: 0, rejected: 0, fallback: 0, timeout: 0, total: 0 }
  const patterns = todayData?.patterns || []
  const criticalPatterns = patterns.filter((p) => p.severity === 'critical')
  const warningPatterns = patterns.filter((p) => p.severity === 'warning')

  const approvalRate = stats.total > 0 ? (stats.approved / stats.total) * 100 : 0
  const failureRate = stats.total > 0 ? ((stats.rejected + stats.fallback + stats.timeout) / stats.total) * 100 : 0

  return (
    <div className="flex flex-1 flex-col">
      <BreadcrumbBar items={[]} currentPage="Operacoes" />

      <div className="flex-1 space-y-4 p-4">
        {/* Active Alerts */}
        {alerts.length > 0 && (
          <Card className="border-orange-500/50 bg-orange-500/5">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-base">Alertas Ativos</CardTitle>
                <Badge variant="secondary">{alerts.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle
                        className={`h-4 w-4 ${
                          alert.severity === 'critical'
                            ? 'text-destructive'
                            : 'text-orange-500'
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium">{alert.title}</p>
                        {alert.message && (
                          <p className="text-xs text-muted-foreground">{alert.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      {alert.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAlertAction(alert.id, 'acknowledge')}
                        >
                          <CheckCheck className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAlertAction(alert.id, 'resolve')}
                      >
                        Resolver
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Patterns Detected */}
        {patterns.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {criticalPatterns.length > 0 && (
              <Card className="border-destructive/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <CardTitle className="text-sm">Problemas Criticos</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {criticalPatterns.map((p, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        {p.description}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {warningPatterns.length > 0 && (
              <Card className="border-orange-500/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <CardTitle className="text-sm">Atencao</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {warningPatterns.map((p, i) => (
                      <li key={i} className="text-sm text-muted-foreground">
                        {p.description}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Aprovacao</CardTitle>
              {approvalRate >= 70 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvalRate.toFixed(1)}%</div>
              <Progress value={approvalRate} className="mt-2" />
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.approved} de {stats.total} aprovados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Falha</CardTitle>
              {failureRate <= 30 ? (
                <TrendingDown className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingUp className="h-4 w-4 text-red-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{failureRate.toFixed(1)}%</div>
              <Progress value={failureRate} className="mt-2" />
              <p className="mt-1 text-xs text-muted-foreground">
                {stats.rejected} rejeitados, {stats.fallback} fallback, {stats.timeout} timeout
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Hoje</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pipelineRuns.filter((r) => r.status === 'completed').length}/
                {pipelineRuns.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {pipelineRuns.filter((r) => r.status === 'failed').length} falharam
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alertas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alerts.length}</div>
              <p className="text-xs text-muted-foreground">
                {alerts.filter((a) => a.severity === 'critical').length} criticos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Runs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Execucoes do Pipeline</CardTitle>
              <CardDescription>Ultimas 24 horas</CardDescription>
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
            {pipelineRuns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Play className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  Nenhuma execucao nas ultimas 24 horas
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pipelineRuns.map((run) => (
                  <div
                    key={run.id}
                    className={`rounded-lg border p-3 ${
                      run.status === 'failed' ? 'border-destructive/50 bg-destructive/5' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(run.status)}
                        <div>
                          <p className="text-sm font-medium">{run.pipeline_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(run.started_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-right">
                          <p className="font-medium">{formatDuration(run.duration_ms)}</p>
                          <p className="text-xs text-muted-foreground">
                            {run.items_succeeded}/{run.items_processed} itens
                          </p>
                        </div>
                        <Badge
                          variant={
                            run.status === 'completed'
                              ? 'default'
                              : run.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {run.status === 'completed'
                            ? 'Sucesso'
                            : run.status === 'failed'
                            ? 'Falhou'
                            : run.status === 'running'
                            ? 'Executando'
                            : run.status}
                        </Badge>
                      </div>
                    </div>
                    {run.error_message && (
                      <p className="mt-2 text-xs text-destructive">{run.error_message}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
