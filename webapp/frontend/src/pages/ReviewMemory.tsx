import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { IconClipboard, IconHistory, IconUser, IconRobot, IconRefresh, IconCheckCircle } from '../components/Icons'

const API = '/api/analysis'

interface ConvEntry {
  phase: string
  role: string
  type: string
  content: string
  related_entity: string | null
  resolved: boolean
  created_at: string
}

interface DecEntry {
  checkpoint: string
  decision_type: string
  content: string
  rationale: string
  made_by: string
  created_at: string
}

interface RevEntry {
  version: number
  role: string
  action: string
  content: string | null
  issues_found: number | null
  created_at: string
}

interface MemoryData {
  project_id: string
  conversations: ConvEntry[]
  decisions: DecEntry[]
  reviews: RevEntry[]
}

const PHASE_LABELS: Record<string, string> = {
  phase_neg1: '品类判断',
  phase_1: '双线标签',
  phase_2: '聚类分析',
  phase_3: '缺口矩阵',
  brief_review: 'Brief 审查',
}

// Phase left border colors — 4px, subtle
const PHASE_BORDER_COLORS: Record<string, string> = {
  phase_neg1: 'border-l-amber-500',
  phase_1: 'border-l-blue-500',
  phase_2: 'border-l-purple-500',
  phase_3: 'border-l-emerald-500',
  brief_review: 'border-l-red-500',
}

export default function ReviewMemory() {
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('project') || ''
  const [data, setData] = useState<MemoryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'conversations' | 'reviews' | 'decisions'>('conversations')
  const [phaseFilter, setPhaseFilter] = useState('all')

  const loadMemory = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const res = await fetch(`${API}/memory/${projectId}`)
      const d = await res.json()
      setData(d)
    } catch (e) {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { loadMemory() }, [loadMemory])

  // 定时刷新
  useEffect(() => {
    if (!projectId) return
    const timer = setInterval(loadMemory, 10000)
    return () => clearInterval(timer)
  }, [projectId, loadMemory])

  // 筛选
  const filteredConversations = (data?.conversations || []).filter(c =>
    phaseFilter === 'all' || c.phase === phaseFilter
  )

  const filteredReviews = (data?.reviews || []).filter(r =>
    phaseFilter === 'all' || true
  )

  const filteredDecisions = (data?.decisions || []).filter(d =>
    phaseFilter === 'all' || d.checkpoint === phaseFilter
  )

  // 获取各 Phase 的阶段列表
  const phases = [...new Set(
    (data?.conversations || []).map(c => c.phase).filter(Boolean)
  )]

  const getPhaseLabel = (phase: string) => PHASE_LABELS[phase] || phase

  const getPhaseBorderColor = (phase: string) => PHASE_BORDER_COLORS[phase] || 'border-l-hairline'

  const formatTime = (ts: string) => {
    if (!ts) return ''
    const d = new Date(ts)
    return d.toLocaleString('zh-CN', {
      month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const getRoleLabel = (role: string) => {
    const m: Record<string, string> = {
      user: '用户', ai: 'AI', system: '系统',
      agent_a: 'Agent A', agent_b: 'Agent B',
    }
    return m[role] || role
  }

  const getRoleIcon = (role: string) => {
    if (role === 'user') return <IconUser className="w-3.5 h-3.5 text-muted" />
    if (role === 'ai') return <IconRobot className="w-3.5 h-3.5 text-muted" />
    return null
  }

  const getTypeLabel = (type: string) => {
    const m: Record<string, string> = {
      question: '质疑', clarification: '澄清',
      decision: '决策', approval: '确认', revision: '修改',
    }
    return m[type] || type
  }

  const getRoleBadgeStyle = (role: string) => {
    if (role === 'agent_a') return 'border-blue-300 text-blue-600 bg-blue-50'
    if (role === 'agent_b') return 'border-red-300 text-red-600 bg-red-50'
    if (role === 'user') return 'border-green-300 text-green-600 bg-green-50'
    return 'border-hairline text-muted bg-surface-soft'
  }

  if (!projectId) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <IconClipboard className="w-16 h-16 mx-auto mb-4 text-muted" />
        <h2 className="text-2xl font-semibold text-ink mb-2">Review & Memory</h2>
        <p className="text-muted">请先从「数据上传」页面上传数据并完成分析</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-ink mb-1 flex items-center gap-2">
            <IconClipboard className="w-6 h-6 text-ink" />
            Review & Memory
          </h2>
          <p className="text-sm text-muted">
            对话记录 · 评审历史 · 决策日志 ｜ Project {projectId.slice(0, 8)}...
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-outline flex items-center gap-1"
            onClick={loadMemory}
            disabled={loading}
          >
            <IconRefresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      {/* 统计卡片 — Clean white cards, large ink numbers, muted labels */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card !p-6 text-center">
          <div className="text-3xl font-semibold text-ink">{data?.conversations?.length || 0}</div>
          <div className="text-xs text-muted mt-1">对话记录</div>
        </div>
        <div className="card !p-6 text-center">
          <div className="text-3xl font-semibold text-ink">{data?.reviews?.length || 0}</div>
          <div className="text-xs text-muted mt-1">版本记录</div>
        </div>
        <div className="card !p-6 text-center">
          <div className="text-3xl font-semibold text-ink">{data?.decisions?.length || 0}</div>
          <div className="text-xs text-muted mt-1">关键决策</div>
        </div>
        <div className="card !p-6 text-center">
          <div className="text-3xl font-semibold text-ink">
            {(data?.conversations || []).filter(c => c.type === 'question').length}
          </div>
          <div className="text-xs text-muted mt-1">人工质疑</div>
        </div>
      </div>

      {/* Phase 筛选 + Tab 切换 */}
      <div className="flex items-center justify-between mb-4">
        {/* Tab 切换 — Pill 风格 */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('conversations')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'conversations'
                ? 'bg-ink text-canvas'
                : 'bg-surface-soft text-muted hover:bg-hairline-soft'
            }`}
          >
            <IconHistory className="w-4 h-4" />
            对话时间线
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'bg-ink text-canvas'
                : 'bg-surface-soft text-muted hover:bg-hairline-soft'
            }`}
          >
            <IconRefresh className="w-4 h-4" />
            评审记录
          </button>
          <button
            onClick={() => setActiveTab('decisions')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'decisions'
                ? 'bg-ink text-canvas'
                : 'bg-surface-soft text-muted hover:bg-hairline-soft'
            }`}
          >
            <IconCheckCircle className="w-4 h-4" />
            决策日志
          </button>
        </div>

        {/* Phase 筛选下拉 — Clean, hairline border, 8px rounded */}
        <select
          className="text-sm border border-hairline rounded-sm px-3 py-2 bg-canvas text-ink outline-none focus:border-ink"
          value={phaseFilter}
          onChange={(e) => setPhaseFilter(e.target.value)}
        >
          <option value="all">全部阶段</option>
          {phases.map(p => (
            <option key={p} value={p}>{getPhaseLabel(p)}</option>
          ))}
        </select>
      </div>

      {/* Tab 内容 */}
      <div className="card !p-0 overflow-hidden">
        {/* -- 对话时间线 -- */}
        {activeTab === 'conversations' && (
          <div className="divide-y divide-hairline">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-16 text-muted">
                <IconClipboard className="w-12 h-12 mx-auto mb-3 text-muted" />
                <p>暂无对话记录</p>
                <p className="text-sm mt-1">在机会洞察页的审核对话中产生的所有记录将显示在此</p>
              </div>
            ) : (
              filteredConversations.map((c, i) => (
                <div key={i} className={`px-5 py-4 border-l-4 bg-canvas ${getPhaseBorderColor(c.phase)}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono text-muted">{formatTime(c.created_at)}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-hairline text-muted">
                      {getPhaseLabel(c.phase)}
                    </span>
                    {c.type && (
                      <span className="text-xs text-muted">{getTypeLabel(c.type)}</span>
                    )}
                    {c.related_entity && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-surface-soft text-muted">
                        {c.related_entity}
                      </span>
                    )}
                    {c.resolved && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full border border-emerald-200 text-emerald-700 bg-emerald-50">
                        已解决
                      </span>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="flex items-center gap-1 text-sm text-muted mt-0.5 flex-shrink-0">
                      {getRoleIcon(c.role)}
                      {getRoleLabel(c.role)}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap text-ink">{c.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* -- 评审记录 -- */}
        {activeTab === 'reviews' && (
          <div>
            {filteredReviews.length === 0 ? (
              <div className="text-center py-16 text-muted">
                <IconUser className="w-12 h-12 mx-auto mb-3 text-muted" />
                <p>暂无评审记录</p>
                <p className="text-sm mt-1">Agent A 生成、Agent B 审查、人工编辑的操作记录将显示在此</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-hairline bg-surface-soft">
                    <th className="text-left px-5 py-3 font-medium text-muted text-xs">版本</th>
                    <th className="text-left px-5 py-3 font-medium text-muted text-xs">角色</th>
                    <th className="text-left px-5 py-3 font-medium text-muted text-xs">动作</th>
                    <th className="text-center px-5 py-3 font-medium text-muted text-xs">问题数</th>
                    <th className="text-right px-5 py-3 font-medium text-muted text-xs">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReviews.map((r, i) => (
                    <tr key={i} className="border-b border-hairline hover:bg-surface-soft transition-colors">
                      <td className="px-5 py-3">
                        <span className="font-mono font-semibold text-ink">v{r.version}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] border ${getRoleBadgeStyle(r.role)}`}>
                          {getRoleLabel(r.role)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-ink">{r.action}</td>
                      <td className="px-5 py-3 text-center">
                        {r.issues_found != null ? (
                          <span className="font-medium text-ink">{r.issues_found}</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right text-muted text-xs font-mono">
                        {formatTime(r.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* -- 决策日志 -- */}
        {activeTab === 'decisions' && (
          <div className="divide-y divide-hairline">
            {filteredDecisions.length === 0 ? (
              <div className="text-center py-16 text-muted">
                <IconCheckCircle className="w-12 h-12 mx-auto mb-3 text-muted" />
                <p>暂无决策记录</p>
                <p className="text-sm mt-1">审核卡点确认、机会选择等关键决策将记录在此</p>
              </div>
            ) : (
              filteredDecisions.map((d, i) => (
                <div key={i} className={`px-5 py-4 border-l-4 bg-canvas ${getPhaseBorderColor(d.checkpoint)}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-mono text-muted">{formatTime(d.created_at)}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-hairline text-muted">
                      {getPhaseLabel(d.checkpoint)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-medium">
                      决策
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-surface-soft text-muted">
                      {d.decision_type}
                    </span>
                    <span className="text-xs text-muted">
                      by {getRoleLabel(d.made_by)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-ink mb-1">{d.content}</p>
                  {d.rationale && (
                    <p className="text-xs text-muted italic">理由：{d.rationale}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 底部统计 */}
      {data && (
        <div className="mt-6 text-center text-xs text-muted">
          Project: {data.project_id?.slice(0, 12)}... | 对话 {data.conversations?.length || 0} 条 |
          版本 {data.reviews?.length || 0} 个 | 决策 {data.decisions?.length || 0} 项 |
          自动刷新每 10 秒
        </div>
      )}
    </div>
  )
}
