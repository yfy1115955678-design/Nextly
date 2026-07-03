import { useEffect, useState, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { safeFetch, safeJSON } from '../lib/api'
import {
  IconStore,
  IconTag,
  IconMicroscope,
  IconTarget,
  IconChart,
  IconDocument,
  IconSearch,
  IconStar,
  IconChat,
  IconUser,
  IconRobot,
  IconSparkles,
  IconAlert,
  IconCheckCircle,
  IconPlay,
  IconClipboard,
  IconLayers,
  IconRefresh,
  IconClip,
  IconUpload,
} from '../components/Icons'

const API = '/api/analysis'

// -- Airbnb Design Tokens --──
const T = {
  rausch: '#ff385c',
  ink: '#222222',
  muted: '#6a6a6a',
  canvas: '#ffffff',
  hairline: '#dddddd',
  surface: '#f7f7f7',
  track: '#ebebeb',
}

// ── 辅助 ──

/** Strip emoji prefix from verdict strings (e.g. colored-circle-prefix + verdict -> verdict text only) */
function verdictText(v: string): string {
  if (!v) return ''
  return v.replace(/^[^\w\u4e00-\u9fff]+/u, '')
}

// ── 类型 ──
interface PhaseData {
  completed: boolean
  result: any
}

interface ProjectState {
  project_id: string
  category: string
  current_phase: string
  phases: Record<string, PhaseData>
  conversations: ChatMsg[]
}

interface ChatMsg {
  role: string
  content: string
  phase?: string
  type?: string
  created_at?: string
  thinking?: boolean
  editApplied?: boolean
  _id?: string
}

const PHASE_LABELS: Record<string, string> = {
  phase_neg1: '品类判断',
  phase_0: '数据检查',
  phase_1: '双线标签',
  phase_2: '聚类分析',
  phase_3: '缺口矩阵',
  phase_4: '生成报告',
}

const PHASE_ICONS: Record<string, (size?: number) => React.ReactNode> = {
  phase_neg1: (size = 18) => <IconStore size={size} />,
  phase_0: (size = 18) => <IconClipboard size={size} />,
  phase_1: (size = 18) => <IconTag size={size} />,
  phase_2: (size = 18) => <IconMicroscope size={size} />,
  phase_3: (size = 18) => <IconTarget size={size} />,
  phase_4: (size = 18) => <IconDocument size={size} />,
}

const NEXT_PHASE: Record<string, string | null> = {
  phase_neg1: 'phase_1',
  phase_1: 'phase_2',
  phase_2: 'phase_3',
  phase_3: null,
}

// ── 子组件 ──

/* Phase -1 结果渲染：品类判断 */
function PhaseNeg1View({ result }: { result: any }) {
  const d = result
  if (!d?.dimension_scores) return <PhasePlaceholder phase="phase_neg1" />

  const verdictStyle: Record<string, { text: string; bg: string; border: string }> = {
    '强烈推荐': { text: '#15803d', bg: '#f0fdf4', border: '#bbf7d0' },
    '推荐': { text: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    '谨慎': { text: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
    '不建议': { text: '#b91c1c', bg: '#fef2f2', border: '#fecaca' },
  }
  const cleanVerdict = verdictText(d.verdict)
  const vs = verdictStyle[cleanVerdict] || { text: T.ink, bg: T.surface, border: T.hairline }

  return (
    <div className="space-y-5">
      {/* 判定横幅 */}
      <div
        className="rounded-[14px] border p-5 text-center"
        style={{
          borderColor: vs.border,
          backgroundColor: vs.bg,
          color: vs.text,
        }}
      >
        <div className="text-[21px] font-bold" style={{ color: T.ink }}>{cleanVerdict}</div>
        {d.summary && (
          <div className="mt-2 text-sm opacity-70" style={{ color: T.muted }}>
            月销额 {d.summary.monthly_revenue} | 年化 {d.summary.annual_estimate} | 整机 {d.summary.machine_count} 款
          </div>
        )}
      </div>

      {/* 9维度评分 */}
      <div>
        <h4 className="text-[22px] font-medium tracking-[-0.44px] mb-3" style={{ color: T.ink }}>
          9 维度评分
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {d.dimension_scores?.map((dim: any) => (
            <div
              key={dim.dimension}
              className="rounded-[14px] p-3 border"
              style={{ backgroundColor: T.surface, borderColor: T.hairline }}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs" style={{ color: T.muted }}>{dim.dimension}</span>
                <span className="text-[21px] font-bold" style={{ color: T.ink }}>{dim.score}/5</span>
              </div>
              <div className="w-full rounded-full" style={{ height: '2px', backgroundColor: T.track }}>
                <div
                  className="rounded-full"
                  style={{
                    width: `${(dim.score / 5) * 100}%`,
                    height: '2px',
                    backgroundColor: T.ink,
                  }}
                />
              </div>
              <div className="text-xs mt-1 truncate" style={{ color: T.muted }} title={dim.rationale}>
                {dim.rationale}
              </div>
            </div>
          ))}
        </div>
        {d.total_score && (
          <div className="mt-4 text-center">
            <span className="text-[21px] font-bold" style={{ color: T.ink }}>
              {d.total_score.pct?.toFixed(0)}%
            </span>
            <span className="text-sm ml-2" style={{ color: T.muted }}>加权总分</span>
          </div>
        )}
      </div>

      {/* 关键发现 */}
      {d.key_findings?.length > 0 && (
        <div>
          <h4 className="text-[22px] font-medium tracking-[-0.44px] mb-3" style={{ color: T.ink }}>
            关键发现
          </h4>
          <ul className="space-y-1">
            {d.key_findings.map((f: string, i: number) => (
              <li key={i} className="text-sm flex items-start gap-2" style={{ color: T.ink }}>
                <span className="mt-0.5" style={{ color: T.rausch }}>•</span> {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 跨境风险 */}
      {d.cross_border_risks?.length > 0 && (
        <div
          className="rounded-[14px] border p-4"
          style={{ backgroundColor: T.surface, borderColor: T.hairline }}
        >
          <h4 className="text-[22px] font-medium tracking-[-0.44px] mb-2 flex items-center gap-1" style={{ color: T.ink }}>
            <IconAlert size={16} /> 跨境风险
          </h4>
          <ul className="space-y-1">
            {d.cross_border_risks.map((r: string, i: number) => (
              <li key={i} className="text-sm" style={{ color: T.muted }}>
                {i + 1}. {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* Phase 1 结果渲染：双线标签 */
function Phase1View({ result }: { result: any }) {
  const combined = result?.combined_summary || {}
  const rev = combined.review_stats || {}
  const bsr = combined.bsr_stats || {}

  return (
    <div className="space-y-5">
      {/* 评论标签 & BSR 标签 */}
      <div className="grid grid-cols-2 gap-4">
        <div
          className="rounded-[14px] p-4 border"
          style={{ backgroundColor: T.surface, borderColor: T.hairline }}
        >
          <h4 className="text-sm font-medium mb-2 flex items-center gap-1" style={{ color: T.ink }}>
            <IconDocument size={14} /> 评论标签
          </h4>
          <div className="text-[21px] font-bold" style={{ color: T.ink }}>{rev.total || '?'}</div>
          <div className="text-xs" style={{ color: T.muted }}>总评论数</div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs">
              <span style={{ color: T.muted }}>正向</span>
              <span className="font-medium" style={{ color: T.ink }}>{rev.sentiment?.positive_pct || 0}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: T.muted }}>负向</span>
              <span className="font-medium" style={{ color: T.ink }}>{rev.sentiment?.negative_pct || 0}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span style={{ color: T.muted }}>机会信号</span>
              <span className="font-medium" style={{ color: T.rausch }}>{rev.opportunity_rate || 0}%</span>
            </div>
          </div>
        </div>
        <div
          className="rounded-[14px] p-4 border"
          style={{ backgroundColor: T.surface, borderColor: T.hairline }}
        >
          <h4 className="text-sm font-medium mb-2 flex items-center gap-1" style={{ color: T.ink }}>
            <IconChart size={14} /> BSR 标签
          </h4>
          <div className="text-[21px] font-bold" style={{ color: T.ink }}>
            {bsr.brand_cr3 ? `${bsr.brand_cr3}%` : '?'}
          </div>
          <div className="text-xs" style={{ color: T.muted }}>Top3 品牌集中度</div>
          <div className="mt-2 space-y-1">
            {bsr.listing_types?.slice(0, 3).map((t: any, i: number) => (
              <div key={i} className="flex justify-between text-xs">
                <span style={{ color: T.muted }}>{t.type}</span>
                <span className="font-medium" style={{ color: T.ink }}>{t.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 问题类型 Top 5 */}
      {rev.top_problems?.length > 0 && (
        <div>
          <h4 className="text-[22px] font-medium tracking-[-0.44px] mb-3" style={{ color: T.ink }}>
            Top 问题类型
          </h4>
          {rev.top_problems.map((p: any, i: number) => (
            <div
              key={i}
              className="flex items-center gap-3 py-1.5"
              style={{ borderBottom: i < rev.top_problems.length - 1 ? `1px solid ${T.hairline}` : 'none' }}
            >
              <span className="text-xs w-6" style={{ color: T.muted }}>{p.rank}</span>
              <span className="flex-1 text-sm" style={{ color: T.ink }}>{p.type}</span>
              <span className="text-xs" style={{ color: T.muted }}>{p.pct}%</span>
            </div>
          ))}
        </div>
      )}

      {/* 卖点渗透 Top 5 */}
      {bsr.top_features?.length > 0 && (
        <div>
          <h4 className="text-[22px] font-medium tracking-[-0.44px] mb-3" style={{ color: T.ink }}>
            Top 卖点渗透率
          </h4>
          {bsr.top_features.slice(0, 5).map((f: any, i: number) => (
            <div
              key={i}
              className="flex items-center gap-3 py-1.5"
              style={{ borderBottom: i < Math.min(bsr.top_features.length, 5) - 1 ? `1px solid ${T.hairline}` : 'none' }}
            >
              <span className="flex-1 text-sm" style={{ color: T.ink }}>{f.feature}</span>
              <div
                className="flex-1 rounded-full"
                style={{ height: '2px', backgroundColor: T.track }}
              >
                <div
                  className="rounded-full"
                  style={{
                    width: `${Math.min(f.penetration_pct, 100)}%`,
                    height: '2px',
                    backgroundColor: T.ink,
                  }}
                />
              </div>
              <span className="text-xs w-10 text-right" style={{ color: T.muted }}>{f.penetration_pct}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* Phase 2 结果渲染：聚类分析 */
function Phase2View({ result }: { result: any }) {
  const painpoint = result?.painpoint_clusters || {}
  const market = result?.market_clusters || {}

  const categoryStyle: Record<string, { text: string; bg: string }> = {
    '功能': { text: T.ink, bg: T.surface },
    '体验': { text: T.ink, bg: T.surface },
    '成本': { text: T.ink, bg: T.surface },
  }

  return (
    <div className="space-y-5">
      {/* 痛点聚类 */}
      <div>
        <h4 className="text-[22px] font-medium tracking-[-0.44px] mb-3 flex items-center gap-1.5" style={{ color: T.ink }}>
          <IconAlert size={18} /> 痛点聚类
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {painpoint.clusters?.map((c: any) => {
            const cs = categoryStyle[c.category] || { text: T.ink, bg: T.surface }
            return (
              <div
                key={c.id}
                className="rounded-[14px] p-3 border"
                style={{ backgroundColor: T.surface, borderColor: T.hairline }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: T.ink }}>{c.id} {c.name}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded border"
                    style={{ color: cs.text, backgroundColor: cs.bg, borderColor: T.hairline }}
                  >
                    {c.category}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: T.muted }}>
                  <span>频次 {c.frequency} ({c.pct}%)</span>
                  <span>严重度 {c.severity}/5</span>
                </div>
                {c.sample_quotes?.length > 0 && (
                  <div className="mt-1 text-xs italic truncate" style={{ color: T.muted }}>
                    &ldquo;{c.sample_quotes[0]}&rdquo;
                  </div>
                )}
                {/* Evidence annotations */}
                {c.evidences && c.evidences.length > 0 && (
                  <div className="mt-2 pt-2 flex flex-wrap gap-1" style={{ borderTop: `1px solid ${T.hairline}` }}>
                    {c.evidences.slice(0, 3).map((ev: any, j: number) => (
                      <span
                        key={j}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]"
                        style={{ backgroundColor: T.canvas, border: `1px solid ${T.hairline}`, color: T.muted }}
                        title={ev.quote}
                      >
                        <span style={{ color: T.rausch, fontWeight: 600 }}>★{ev.rating}</span>
                        <span>{ev.source}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 因果关系 */}
      {painpoint.causality_chains?.length > 0 && (
        <div
          className="rounded-[14px] border p-4"
          style={{ backgroundColor: T.surface, borderColor: T.hairline }}
        >
          <h4 className="text-[22px] font-medium tracking-[-0.44px] mb-2 flex items-center gap-1.5" style={{ color: T.ink }}>
            <IconLayers size={18} /> 因果关系链
          </h4>
          {painpoint.causality_chains.map((c: string, i: number) => (
            <div key={i} className="text-sm" style={{ color: T.muted }}>{c}</div>
          ))}
        </div>
      )}

      {/* 市场格局 */}
      <div>
        <h4 className="text-[22px] font-medium tracking-[-0.44px] mb-3 flex items-center gap-1.5" style={{ color: T.ink }}>
          <IconStore size={18} /> 市场格局
        </h4>
        {market.key_metrics && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div
              className="rounded-[14px] p-3 text-center border"
              style={{ backgroundColor: T.surface, borderColor: T.hairline }}
            >
              <div className="text-[21px] font-bold" style={{ color: T.ink }}>
                {market.key_metrics.price_median ? `$${market.key_metrics.price_median}` : '?'}
              </div>
              <div className="text-xs" style={{ color: T.muted }}>价格中位数</div>
            </div>
            <div
              className="rounded-[14px] p-3 text-center border"
              style={{ backgroundColor: T.surface, borderColor: T.hairline }}
            >
              <div className="text-[21px] font-bold" style={{ color: T.ink }}>
                {market.key_metrics.top3_concentration_pct || '?'}%
              </div>
              <div className="text-xs" style={{ color: T.muted }}>Top3 集中度</div>
            </div>
            <div
              className="rounded-[14px] p-3 text-center border"
              style={{ backgroundColor: T.surface, borderColor: T.hairline }}
            >
              <div className="text-[21px] font-bold" style={{ color: T.ink }}>
                {market.market_clusters?.length || '?'}
              </div>
              <div className="text-xs" style={{ color: T.muted }}>市场聚类</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* Phase 3 结果渲染：缺口矩阵 + 机会评分 */
function Phase3View({ result }: { result: any }) {
  return (
    <div className="space-y-5">
      {/* 缺口矩阵 */}
      {result?.gap_matrix?.length > 0 && (
        <div>
          <h4 className="text-[22px] font-medium tracking-[-0.44px] mb-3 flex items-center gap-1.5" style={{ color: T.ink }}>
            <IconTarget size={18} /> 痛点 x 货架缺口矩阵
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.hairline}` }}>
                  <th className="text-left py-2 font-medium" style={{ color: T.ink }}>痛点</th>
                  <th className="text-center py-2 font-medium" style={{ color: T.ink }}>强度</th>
                  <th className="text-center py-2 font-medium" style={{ color: T.ink }}>BSR覆盖</th>
                  <th className="text-center py-2 font-medium" style={{ color: T.ink }}>拥挤</th>
                  <th className="text-center py-2 font-medium" style={{ color: T.ink }}>未兑现</th>
                  <th className="text-left py-2 font-medium" style={{ color: T.ink }}>机会类型</th>
                </tr>
              </thead>
              <tbody>
                {result.gap_matrix.map((g: any, i: number) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.hairline}` }}>
                    <td className="py-2 font-medium" style={{ color: T.ink }}>{g.painpoint}</td>
                    <td className="py-2 text-center" style={{ color: T.muted }}>{g.intensity}</td>
                    <td className="py-2 text-center" style={{ color: T.muted }}>{g.bsr_coverage}</td>
                    <td className="py-2 text-center" style={{ color: T.muted }}>
                      {g.is_crowded ? <IconCheckCircle size={14} /> : <span>—</span>}
                    </td>
                    <td className="py-2 text-center">
                      {g.is_unfulfilled && <IconAlert size={16} />}
                    </td>
                    <td className="py-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded border"
                        style={{
                          color: T.ink,
                          backgroundColor: T.surface,
                          borderColor: T.hairline,
                        }}
                      >
                        {g.opportunity_type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 机会评分排序 */}
      {result?.opportunity_scores?.length > 0 && (
        <div>
          <h4 className="text-[22px] font-medium tracking-[-0.44px] mb-3 flex items-center gap-1.5" style={{ color: T.ink }}>
            <IconStar size={18} /> 产品机会评分
          </h4>
          {result.opportunity_scores.map((o: any, i: number) => (
            <div
              key={i}
              className="rounded-[14px] p-4 mb-2 border"
              style={{
                backgroundColor: T.canvas,
                borderColor: i === 0 ? T.rausch : T.hairline,
                borderWidth: i === 0 ? '1px' : '1px',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[21px] font-bold" style={{ color: T.ink }}>#{o.rank}</span>
                  <span className="font-medium" style={{ color: T.ink }}>{o.name}</span>
                </div>
                <span className="text-sm font-bold" style={{ color: T.ink }}>
                  {o.total_score}分 {verdictText(o.verdict || '')}
                </span>
              </div>
              {o.scores && (
                <div className="flex gap-1.5 flex-wrap">
                  {Object.entries(o.scores).map(([k, v]: [string, any]) => (
                    <div
                      key={k}
                      className="rounded px-1.5 py-0.5 text-xs border"
                      style={{ backgroundColor: T.canvas, borderColor: T.hairline }}
                    >
                      <span style={{ color: T.muted }}>{k}</span>
                      <span className="ml-1 font-bold" style={{ color: T.ink }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TOP 3 展开 */}
      {result?.top3_detail?.length > 0 && (
        <div>
          <h4 className="text-[22px] font-medium tracking-[-0.44px] mb-3 flex items-center gap-1.5" style={{ color: T.ink }}>
            <IconSparkles size={18} /> TOP 3 机会展开
          </h4>
          {result.top3_detail.map((t: any, i: number) => (
            <div
              key={i}
              className="rounded-[14px] border p-4 mb-3"
              style={{ backgroundColor: T.canvas, borderColor: T.hairline }}
            >
              <div className="font-bold mb-1" style={{ color: T.ink }}>#{t.rank} {t.name}</div>
              <div className="text-sm mb-2" style={{ color: T.rausch }}>{'\u300C'}{t.value_proposition}{'\u300D'}</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span style={{ color: T.muted }}>产品动作：</span>
                  <span style={{ color: T.ink }}>{t.product_action}</span>
                </div>
                <div>
                  <span style={{ color: T.muted }}>Listing：</span>
                  <span style={{ color: T.ink }}>{t.listing_suggestion}</span>
                </div>
              </div>
              {t.risks?.length > 0 && (
                <div className="mt-2 flex gap-1 flex-wrap">
                  {t.risks.map((r: string, j: number) => (
                    <span
                      key={j}
                      className="text-xs px-2 py-0.5 rounded border flex items-center gap-0.5"
                      style={{ backgroundColor: T.surface, color: T.muted, borderColor: T.hairline }}
                    >
                      <IconAlert size={14} /> {r}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* 占位 */
function PhasePlaceholder({ phase }: { phase: string }) {
  return (
    <div className="text-center py-12">
      <div className="mb-3 flex justify-center">{PHASE_ICONS[phase]?.(40)}</div>
      <p className="font-medium" style={{ color: T.ink }}>{PHASE_LABELS[phase]}</p>
      <p className="text-sm mt-1" style={{ color: T.muted }}>点击上方阶段标签执行分析</p>
    </div>
  )
}

/* 加载中 */
function LoadingSpinner({ text }: { text: string }) {
  return (
    <div className="text-center py-12">
      <svg
        className="animate-spin h-8 w-8 mx-auto mb-3"
        style={{ color: T.ink }}
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p className="text-sm" style={{ color: T.muted }}>{text}</p>
    </div>
  )
}

// ── 主组件 ──

export default function OpportunityInsight() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const projectId = searchParams.get('project') || ''

  const [state, setState] = useState<ProjectState | null>(null)
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('phase_neg1')
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [error, setError] = useState('')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatFileRef = useRef<HTMLInputElement>(null)
  const [chatFile, setChatFile] = useState<File | null>(null)
  const [chatDragOver, setChatDragOver] = useState(false)
  const [confirmedQuestions, setConfirmedQuestions] = useState<Record<number, 'yes' | 'no' | 'other'>>({})
  const [otherReasons, setOtherReasons] = useState<Record<number, string>>({})

  // 决策轴状态（Phase -1 后弹出）
  const [decisionPanelOpen, setDecisionPanelOpen] = useState(false)
  const [decisionQuestions, setDecisionQuestions] = useState<any[] | null>(null)
  const [decisionAnswers, setDecisionAnswers] = useState<Record<string, string>>({})
  const [decisionLoading, setDecisionLoading] = useState(false)
  const [decisionConfirmed, setDecisionConfirmed] = useState(false)

  const allPhases = ['phase_neg1', 'phase_1', 'phase_2', 'phase_3']

  // 加载项目状态
  const loadState = useCallback(async () => {
    if (!projectId) return
    try {
      const data = await safeFetch(`${API}/state/${projectId}`)
      setState(data)
    } catch {
      /* silent */
    }
  }, [projectId])

  useEffect(() => {
    loadState()
  }, [loadState])

  // 自动滚动对话
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state?.conversations])

  // 执行分析阶段
  const executePhase = async (phase: string) => {
    setExecuting(phase)
    setError('')
    try {
      const data = await safeFetch(`${API}/execute/${projectId}?phase=${phase}`, { method: 'POST' })
      if (data.ok) {
        await loadState()
        // 不再自动跳转 tab，用户可手动切换
        const item = data.result
        if (item?.combined_summary?.review_stats) {
          // Phase 1
        }
      } else {
        setError(data.detail || '执行失败')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setExecuting(null)
    }
  }

  // 发送对话消息（支持附件）
  const sendChat = async () => {
    if ((!chatInput.trim() && !chatFile) || !projectId) return
    setChatSending(true)
    const content = chatInput.trim() || '[上传了附件]'
    const file = chatFile
    setChatInput('')
    setChatFile(null)

    // 先在本地显示用户消息
    const userDisplay = file ? `${content}\n📎 ${file.name} (${(file.size / 1024).toFixed(1)} KB)` : content
    setState((prev) =>
      prev
        ? {
            ...prev,
            conversations: [
              ...prev.conversations,
              { role: 'user', content: userDisplay, phase: activeTab },
            ],
          }
        : prev
    )

    // 插入一条临时思考标识
    const thinkingId = Date.now().toString()
    setState((prev) =>
      prev
        ? {
            ...prev,
            conversations: [
              ...prev.conversations,
              { role: 'ai', content: '...', phase: activeTab, thinking: true, _id: thinkingId },
            ],
          }
        : prev
    )

    try {
      const formData = new FormData()
      formData.append('project_id', projectId)
      formData.append('phase', activeTab)
      formData.append('content', content)
      if (file) {
        formData.append('attachment', file)
      }

      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        body: formData,
      })
      const text = await res.text()
      const data = safeJSON(text)

      // 用 AI 回复替换思考标识
      setState((prev) =>
        prev
          ? {
              ...prev,
              conversations: prev.conversations
                .filter((m: any) => m._id !== thinkingId)
                .concat({ role: 'ai', content: data?.content || '（无回复）', phase: activeTab, editApplied: data?.edit_applied }),
            }
          : prev
      )

      // 如果 AI 修改了分析结果，刷新左侧数据
      if (data?.edit_applied) {
        setTimeout(() => loadState(), 500)
      }
    } catch {
      setState((prev) =>
        prev
          ? {
              ...prev,
              conversations: prev.conversations
                .filter((m: any) => m._id !== thinkingId)
                .concat({ role: 'ai', content: '⚠️ 发送失败，请重试', phase: activeTab }),
            }
          : prev
      )
    } finally {
      setChatSending(false)
    }
  }

  // 审核确认 — Phase -1 特殊处理：先弹出决策面板
  const approveCheckpoint = async () => {
    // Phase -1 特殊流程：先获取决策问题
    if (activeTab === 'phase_neg1' && !decisionConfirmed) {
      setDecisionLoading(true)
      setError('')
      try {
        const resp = await fetch(`${API}/get-decisions/${projectId}`)
        const data = safeJSON(await resp.text())
        if (data?.questions && data.questions.length > 0) {
          setDecisionQuestions(data.questions)
          setDecisionAnswers({})
          setDecisionPanelOpen(true)
        } else {
          // 无需决策问题，直接推进
          proceedToNext()
        }
      } catch {
        // API 不可用时，提供默认决策问题
        setDecisionQuestions([
          {
            id: 'product_direction',
            label: '产品方向偏好',
            type: 'radio',
            options: [
              { value: 'premium', label: '高端差异化' },
              { value: 'value', label: '性价比款' },
              { value: 'innovative', label: '功能创新' },
              { value: 'custom', label: '其他（自定义填写）', isCustom: true },
            ],
          },
          {
            id: 'price_range',
            label: '目标价位',
            type: 'radio',
            options: [
              { value: 'low', label: '低价位（<$20）' },
              { value: 'mid', label: '中价位（$20-$50）' },
              { value: 'high', label: '高价位（>$50）' },
            ],
          },
        ])
        setDecisionAnswers({})
        setDecisionPanelOpen(true)
      } finally {
        setDecisionLoading(false)
      }
      return
    }

    proceedToNext()
  }

  // 实际推进到下一阶段（并自动执行）
  const proceedToNext = async () => {
    const next = NEXT_PHASE[activeTab]
    try {
      await fetch(`${API}/checkpoint/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, checkpoint: activeTab }),
      })
      await loadState()
      // 自动跳转到下一阶段
      if (next) {
        setActiveTab(next)
        setError('')
        // 自动执行下一阶段，减少点击
        setTimeout(() => {
          executePhase(next)
        }, 300)
      }
    } catch {
      // ignore
    }
  }

  // 确认决策并推进
  const confirmDecisions = async () => {
    setDecisionLoading(true)
    try {
      await fetch(`${API}/save-decisions/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: decisionAnswers }),
      })
    } catch {
      // 保存失败也继续推进
    }
    setDecisionConfirmed(true)
    setDecisionPanelOpen(false)
    setDecisionLoading(false)
    await loadState()
    proceedToNext()
  }

  // 非线性的 tab 点击 —— 检查前置条件
  const handleTabClick = (phase: string) => {
    const phaseIndex = allPhases.indexOf(phase)
    if (phaseIndex < 0) return

    // 检查所有前置 phase 是否已完成
    for (let i = 0; i < phaseIndex; i++) {
      const priorPhase = allPhases[i]
      if (!state?.phases?.[priorPhase]?.completed) {
        setError(`请先完成「${PHASE_LABELS[priorPhase]}」阶段的分析`)
        return
      }
    }

    setActiveTab(phase)
    setError('')
    setConfirmedQuestions({})  // 切换 Phase 时重置确认状态
  }

  // 获取当前阶段结果
  const currentResult = state?.phases?.[activeTab]?.result
  const allQuestionsConfirmed =
    currentResult?.review_questions?.length > 0 &&
    currentResult.review_questions.every((_: string, i: number) => !!confirmedQuestions[i])

  // 渲染阶段结果
  const renderPhaseResult = () => {
    const result = currentResult
    if (!result) return <PhasePlaceholder phase={activeTab} />

    switch (activeTab) {
      case 'phase_neg1':
        return <PhaseNeg1View result={result} />
      case 'phase_1':
        return <Phase1View result={result} />
      case 'phase_2':
        return <Phase2View result={result} />
      case 'phase_3':
        return <Phase3View result={result} />
      default:
        return <PhasePlaceholder phase={activeTab} />
    }
  }

  if (!projectId) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16" style={{ backgroundColor: T.canvas }}>
        <div className="mb-4 flex justify-center"><IconSearch size={40} /></div>
        <h2 className="text-[22px] font-medium tracking-[-0.44px] mb-2" style={{ color: T.ink }}>
          机会洞察
        </h2>
        <p className="text-sm" style={{ color: T.muted }}>
          请先从「数据上传」页面上传数据
        </p>
      </div>
    )
  }

  const phaseComplete = state?.phases?.[activeTab]?.completed
  const nextPhase = NEXT_PHASE[activeTab]

  return (
    <div className="flex gap-6" style={{ minHeight: 'calc(100vh - 140px)' }}>
      {/* 左侧：分析看板 */}
      <div className="flex-1 flex flex-col space-y-4">
        {/* Phase 标签切换 — pill-shaped */}
        <div
          className="rounded-[14px] border p-3"
          style={{ backgroundColor: T.canvas, borderColor: T.hairline }}
        >
          <div className="flex gap-1">
            {allPhases.map((p) => {
              const isActive = activeTab === p
              const isCompleted = state?.phases?.[p]?.completed
              return (
                <button
                  key={p}
                  onClick={() => handleTabClick(p)}
                  className="flex-1 py-2 rounded-full text-sm font-medium transition-colors flex flex-col items-center"
                  style={{
                    backgroundColor: isActive ? T.ink : 'transparent',
                    color: isActive ? T.canvas : isCompleted ? T.ink : T.muted,
                    border: !isActive && isCompleted ? `1px solid ${T.hairline}` : '1px solid transparent',
                  }}
                >
                  <div className="mb-0.5">{PHASE_ICONS[p]?.(18)}</div>
                  <div className="text-xs">{PHASE_LABELS[p]}</div>
                  {isCompleted && (
                    <span className="mt-0.5"><IconCheckCircle size={12} /></span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div
            className="p-3 rounded-[14px] border text-sm"
            style={{ backgroundColor: T.surface, borderColor: T.hairline, color: T.muted }}
          >
            {error}
            <button
              className="ml-2 underline"
              style={{ color: T.rausch }}
              onClick={() => setError('')}
            >
              关闭
            </button>
          </div>
        )}

        {/* 决策轴面板 — Phase -1 审核确认后弹出 */}
        {decisionPanelOpen && decisionQuestions && (
          <div
            className="rounded-[14px] border p-6"
            style={{ backgroundColor: T.canvas, borderColor: T.hairline }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3
                style={{
                  fontSize: '22px',
                  fontWeight: 500,
                  lineHeight: 1.18,
                  letterSpacing: '-0.44px',
                  color: T.ink,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <IconTarget size={20} /> 品类决策轴
              </h3>
              <button
                onClick={() => setDecisionPanelOpen(false)}
                style={{
                  padding: '4px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: T.muted,
                  cursor: 'pointer',
                }}
              >
                暂不决策
              </button>
            </div>
            <p style={{ fontSize: '14px', color: T.muted, marginBottom: '24px' }}>
              基于 Phase -1 品类分析结果，请选择以下决策以辅助后续分析聚焦。
            </p>

            {decisionQuestions.map((q: any) => (
              <div
                key={q.id}
                style={{
                  marginBottom: '24px',
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: T.surface,
                  border: `1px solid ${T.hairline}`,
                }}
              >
                <p style={{ fontSize: '15px', fontWeight: 500, color: T.ink, marginBottom: '12px' }}>
                  {q.label}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {q.options?.map((opt: any) => (
                    <label
                      key={opt.value}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: `1px solid ${
                          decisionAnswers[q.id] === opt.value ? T.ink : T.hairline
                        }`,
                        backgroundColor:
                          decisionAnswers[q.id] === opt.value ? T.canvas : T.canvas,
                        cursor: 'pointer',
                        transition: 'border-color 0.15s',
                      }}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.value}
                        checked={decisionAnswers[q.id] === opt.value}
                        onChange={(e) =>
                          setDecisionAnswers((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                        style={{ accentColor: T.ink, width: '16px', height: '16px' }}
                      />
                      <span style={{ fontSize: '14px', color: T.ink, flex: 1 }}>{opt.label}</span>
                    </label>
                  ))}
                  {/* 如果有 isCustom 选项，被选中时显示自定义输入框 */}
                  {q.options?.some((o: any) => o.isCustom) &&
                    decisionAnswers[q.id] === 'custom' && (
                      <input
                        type="text"
                        value={decisionAnswers[`${q.id}_custom`] || ''}
                        onChange={(e) =>
                          setDecisionAnswers((prev) => ({
                            ...prev,
                            [`${q.id}_custom`]: e.target.value,
                          }))
                        }
                        placeholder="请输入自定义方向..."
                        style={{
                          marginTop: '4px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: `1px solid ${T.hairline}`,
                          fontSize: '14px',
                          color: T.ink,
                          backgroundColor: T.canvas,
                          outline: 'none',
                          width: '100%',
                        }}
                      />
                    )}
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button
                className="text-sm py-1.5 px-4 rounded-full font-medium border"
                style={{
                  backgroundColor: T.canvas,
                  color: T.ink,
                  borderColor: T.hairline,
                }}
                onClick={() => setDecisionPanelOpen(false)}
              >
                跳过
              </button>
              <button
                className="text-sm py-1.5 px-4 rounded-full font-medium"
                disabled={
                  decisionLoading ||
                  decisionQuestions.some((q: any) => !decisionAnswers[q.id])
                }
                style={{
                  backgroundColor:
                    decisionLoading ||
                    decisionQuestions.some((q: any) => !decisionAnswers[q.id])
                      ? T.hairline
                      : T.rausch,
                  color: T.canvas,
                  cursor:
                    decisionLoading ||
                    decisionQuestions.some((q: any) => !decisionAnswers[q.id])
                      ? 'not-allowed'
                      : 'pointer',
                  opacity:
                    decisionLoading ||
                    decisionQuestions.some((q: any) => !decisionAnswers[q.id])
                      ? 0.6
                      : 1,
                }}
                onClick={confirmDecisions}
              >
                {decisionLoading ? '保存中...' : '确认决策 →'}
              </button>
            </div>
          </div>
        )}

        {/* 当前阶段分析结果 */}
        <div
          className="flex-1 overflow-y-auto rounded-[14px] border p-6"
          style={{ backgroundColor: T.canvas, borderColor: T.hairline }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[22px] font-medium tracking-[-0.44px] flex items-center gap-1.5" style={{ color: T.ink }}>
              {PHASE_ICONS[activeTab]?.(18)} {PHASE_LABELS[activeTab]}
            </h3>
            <div className="flex gap-2">
              {!phaseComplete && (
                <button
                  className="text-sm py-1.5 px-4 rounded-full font-medium inline-flex items-center gap-1"
                  disabled={executing !== null}
                  onClick={() => executePhase(activeTab)}
                  style={{
                    backgroundColor: executing !== null ? T.hairline : T.rausch,
                    color: T.canvas,
                    opacity: executing !== null ? 0.5 : 1,
                    cursor: executing !== null ? 'not-allowed' : 'pointer',
                  }}
                >
                  {executing === activeTab ? (
                    '执行中...'
                  ) : (
                    <><IconPlay size={14} /> 执行分析</>
                  )}
                </button>
              )}
              {phaseComplete && (
                <button
                  className="text-sm py-1.5 px-4 rounded-full font-medium inline-flex items-center gap-1 border transition-colors"
                  disabled={executing !== null}
                  onClick={() => executePhase(activeTab)}
                  style={{
                    backgroundColor: T.canvas,
                    color: T.ink,
                    borderColor: executing !== null ? T.hairline : T.ink,
                    opacity: executing !== null ? 0.5 : 1,
                    cursor: executing !== null ? 'not-allowed' : 'pointer',
                  }}
                >
                  {executing === activeTab ? (
                    '重新分析中...'
                  ) : (
                    <><IconRefresh size={14} /> 重新分析</>
                  )}
                </button>
              )}
            </div>
          </div>

          {executing === activeTab ? (
            <LoadingSpinner text={`正在执行 ${PHASE_LABELS[activeTab]}... （需 30-60 秒，LLM 分析中）`} />
          ) : (
            renderPhaseResult()
          )}
        </div>

        {/* 审核卡点 — 每条确认信息可交互 */}
        {phaseComplete && (
          <div
            className="rounded-[14px] border p-5"
            style={{ backgroundColor: T.surface, borderColor: T.hairline }}
          >
            {currentResult?.review_questions?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-3" style={{ color: T.ink }}>
                  请逐条确认以下分析点：
                </p>
                <div className="space-y-3">
                  {currentResult.review_questions.map((q: string, i: number) => {
                    const answer = confirmedQuestions[i]
                    const isOther = answer === 'other'
                    return (
                      <div
                        key={i}
                        className="rounded-sm p-3"
                        style={{
                          border: `1px solid ${answer ? T.ink : T.hairline}`,
                          backgroundColor: answer ? T.surface : T.canvas,
                        }}
                      >
                        <p className="text-sm mb-2" style={{ color: answer ? T.ink : T.muted }}>
                          {q}
                        </p>
                        <div className="flex items-center gap-2">
                          {/* 是 */}
                          <button
                            onClick={() => {
                              const next = { ...confirmedQuestions }
                              next[i] = 'yes'
                              setConfirmedQuestions(next)
                            }}
                            className="text-xs py-1.5 px-3 rounded-full font-medium transition-colors"
                            style={{
                              backgroundColor: answer === 'yes' ? T.ink : T.canvas,
                              color: answer === 'yes' ? T.canvas : T.muted,
                              border: `1px solid ${answer === 'yes' ? T.ink : T.hairline}`,
                            }}
                          >
                            是
                          </button>
                          {/* 否 */}
                          <button
                            onClick={() => {
                              const next = { ...confirmedQuestions }
                              next[i] = 'no'
                              setConfirmedQuestions(next)
                            }}
                            className="text-xs py-1.5 px-3 rounded-full font-medium transition-colors"
                            style={{
                              backgroundColor: answer === 'no' ? '#e53935' : T.canvas,
                              color: answer === 'no' ? '#ffffff' : T.muted,
                              border: `1px solid ${answer === 'no' ? '#e53935' : T.hairline}`,
                            }}
                          >
                            否
                          </button>
                          {/* 其他 */}
                          <button
                            onClick={() => {
                              const next = { ...confirmedQuestions }
                              next[i] = 'other'
                              setConfirmedQuestions(next)
                            }}
                            className="text-xs py-1.5 px-3 rounded-full font-medium transition-colors"
                            style={{
                              backgroundColor: answer === 'other' ? T.rausch : T.canvas,
                              color: answer === 'other' ? '#ffffff' : T.muted,
                              border: `1px solid ${answer === 'other' ? T.rausch : T.hairline}`,
                            }}
                          >
                            其他
                          </button>
                          {/* 质疑按钮 */}
                          <button
                            className="flex-shrink-0 text-xs py-1 px-2 rounded-full border transition-colors ml-auto"
                            style={{
                              color: T.muted,
                              borderColor: T.hairline,
                              backgroundColor: T.canvas,
                            }}
                            onClick={() => {
                              setChatInput(`关于「${q.slice(0, 40)}...」我有疑问：`)
                            }}
                            title="向 AI 质疑这条结论"
                          >
                            💬
                          </button>
                        </div>
                        {/* 其他 — 自定义输入 */}
                        {isOther && (
                          <input
                            type="text"
                            className="w-full mt-2 text-sm py-1.5 px-3 rounded-sm border outline-none"
                            style={{
                              borderColor: T.hairline,
                              backgroundColor: T.canvas,
                              color: T.ink,
                            }}
                            placeholder="请输入你的看法..."
                            value={otherReasons[i] || ''}
                            onChange={(e) => setOtherReasons({ ...otherReasons, [i]: e.target.value })}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
                {allQuestionsConfirmed && (
                  <p className="text-xs mt-3" style={{ color: '#2e7d32' }}>
                    ✓ 全部确认完成，可以进入下一阶段
                  </p>
                )}
              </div>
            )}
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: T.muted }}>
                {nextPhase
                  ? activeTab === 'phase_neg1' && !decisionConfirmed
                    ? `审核结果是否合理？确认后将弹出决策轴面板，辅助确定产品方向和价位。可在右侧对话面板中提出质疑。`
                    : `审核结果是否合理？可在右侧对话面板中提出质疑，或确认进入 ${PHASE_LABELS[nextPhase]}`
                  : '所有分析阶段完成！可进入 Brief 工作台生成产品 Brief'}
              </p>
              {nextPhase ? (
                <button
                  className="text-sm py-1.5 px-4 rounded-full font-medium"
                  style={{ backgroundColor: T.rausch, color: T.canvas }}
                  onClick={approveCheckpoint}
                  disabled={decisionLoading}
                >
                  {decisionLoading
                    ? '加载决策问题...'
                    : activeTab === 'phase_neg1' && !decisionConfirmed
                    ? '确认 → 打开决策轴'
                    : `确认 → ${PHASE_LABELS[nextPhase]}`}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    className="text-sm py-1.5 px-4 rounded-full font-medium inline-flex items-center gap-1"
                    style={{ backgroundColor: T.rausch, color: T.canvas }}
                    onClick={() => navigate(`/brief?project=${projectId}`)}
                  >
                    <IconDocument size={16} /> 进入 Brief 工作台
                  </button>
                  <button
                    className="text-sm py-1.5 px-4 rounded-full font-medium border inline-flex items-center gap-1"
                    style={{ backgroundColor: T.canvas, color: T.ink, borderColor: T.hairline }}
                    onClick={() => navigate(`/review?project=${projectId}`)}
                  >
                    <IconClipboard size={16} /> 查看 Review & Memory
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 右侧：对话面板 */}
      <div className="w-96 flex flex-col" style={{ position: 'sticky', top: '96px', height: 'calc(100vh - 116px)' }}>
        <div
          className="flex-1 flex flex-col rounded-[14px] border p-5 relative min-h-0"
          style={{ backgroundColor: T.canvas, borderColor: T.hairline }}
          onDragOver={(e) => {
             e.preventDefault()
             e.stopPropagation()
             setChatDragOver(true)
           }}
           onDragLeave={(e) => {
             // Only hide if we're actually leaving the panel (not entering a child)
             if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
               setChatDragOver(false)
             }
           }}
           onDrop={(e) => {
             e.preventDefault()
             e.stopPropagation()
             setChatDragOver(false)
             const files = Array.from(e.dataTransfer.files)
             if (files.length > 0) {
               const f = files[0]
               const name = f.name.toLowerCase()
               if (name.endsWith('.md') || name.endsWith('.txt') || name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls')) {
                 setChatFile(f)
               } else {
                 setError(`不支持的文件类型: ${f.name}（仅支持 .md .txt .csv .xlsx .xls）`)
               }
             }
           }}
        >
          {/* 拖拽提示遮罩 */}
          {chatDragOver && (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center rounded-[14px]"
              style={{ backgroundColor: 'rgba(255,255,255,0.85)', border: `2px dashed ${T.ink}` }}
              onDragLeave={(e) => {
                if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
                  setChatDragOver(false)
                }
              }}
            >
              <div className="text-center">
                <IconUpload size={36} />
                <p className="text-sm mt-2 font-medium" style={{ color: T.ink }}>释放以添加附件</p>
                <p className="text-xs mt-1" style={{ color: T.muted }}>.md .txt .csv .xlsx .xls</p>
              </div>
            </div>
          )}
          <h3 className="text-[22px] font-medium tracking-[-0.44px] mb-3 flex items-center gap-1.5" style={{ color: T.ink }}>
            <IconChat size={18} /> 审核对话
          </h3>

          {/* 消息列表 */}
          <div
            className="flex-1 overflow-y-auto space-y-3 mb-4"
            style={{ maxHeight: 'calc(100vh - 320px)' }}
          >
            {(!state?.conversations || state.conversations.length === 0) && (
              <div className="text-center py-8 text-sm" style={{ color: T.muted }}>
                在此审核分析结果，对话会保存到记忆系统
              </div>
            )}
            {state?.conversations?.map((msg: any, i) => (
              <div
                key={i}
                className="p-3 text-sm"
                style={{
                  borderRadius: '8px',
                  backgroundColor: msg.role === 'user' ? T.surface : T.canvas,
                  color: T.ink,
                  border: msg.role === 'ai' ? `1px solid ${T.hairline}` : '1px solid transparent',
                  marginLeft: msg.role === 'user' ? '16px' : undefined,
                  marginRight: msg.role === 'ai' ? '16px' : undefined,
                }}
              >
                <div className="text-xs mb-1 flex items-center gap-2" style={{ color: T.muted }}>
                  {msg.role === 'user' ? (
                    <span className="inline-flex items-center gap-0.5"><IconUser size={12} /> 你</span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5"><IconRobot size={12} /> AI</span>
                  )}
                  {msg.thinking && (
                    <span className="inline-flex items-center gap-1" style={{ color: T.rausch }}>
                      <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                        <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75" />
                      </svg>
                      思考中
                    </span>
                  )}
                  {msg.editApplied && (
                    <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: T.surface, color: T.rausch, border: `1px solid ${T.hairline}` }}>
                      已更新分析
                    </span>
                  )}
                  {msg.type && msg.type !== 'approval' && ` · ${msg.type}`}
                </div>
                {msg.thinking ? (
                  <div className="text-muted animate-pulse">AI 正在分析...</div>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* 输入区 */}
          <div style={{ borderTop: `1px solid ${T.hairline}`, paddingTop: '12px' }}>
            {/* 附件预览 */}
            {chatFile && (
              <div
                className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-sm"
                style={{ backgroundColor: T.surface, border: `1px solid ${T.hairline}` }}
              >
                <span className="text-xs" style={{ color: T.muted }}>
                  📎 {chatFile.name} ({(chatFile.size / 1024).toFixed(1)} KB)
                </span>
                <button
                  className="text-xs ml-auto"
                  style={{ color: T.muted, cursor: 'pointer' }}
                  onClick={() => setChatFile(null)}
                >
                  ✕
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={chatFileRef}
                type="file"
                accept=".md,.txt,.csv,.xlsx,.xls"
                style={{ display: 'none' }}
                onChange={(e) => setChatFile(e.target.files?.[0] || null)}
              />
              <button
                onClick={() => chatFileRef.current?.click()}
                className="text-sm flex-shrink-0"
                title="添加附件"
                style={{
                  height: '56px',
                  width: '40px',
                  borderRadius: '8px',
                  border: `1px solid ${T.hairline}`,
                  backgroundColor: T.canvas,
                  color: chatFile ? T.ink : T.muted,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconClip size={18} />
              </button>
              <input
                type="text"
                className="flex-1 text-sm"
                style={{
                  height: '56px',
                  borderRadius: '8px',
                  border: `1px solid ${T.hairline}`,
                  backgroundColor: T.canvas,
                  color: T.ink,
                  padding: '0 14px',
                  outline: 'none',
                }}
                placeholder={`质疑${PHASE_LABELS[activeTab]}结果、调整分析方向、确认进入${NEXT_PHASE[activeTab] ? PHASE_LABELS[NEXT_PHASE[activeTab]!] : '下一阶段'}...`}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onPaste={(e) => {
                  const items = Array.from(e.clipboardData.items)
                  for (const item of items) {
                    if (item.kind === 'file') {
                      e.preventDefault()
                      const f = item.getAsFile()
                      if (f) {
                        const name = f.name.toLowerCase()
                        if (name.endsWith('.md') || name.endsWith('.txt') || name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls')) {
                          setChatFile(f)
                        }
                      }
                      return
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (chatInput.trim() || chatFile) && !chatSending) {
                    sendChat()
                  }
                }}
              />
              <button
                className="text-sm px-3 rounded-full font-medium flex-shrink-0"
                style={{
                  backgroundColor: chatSending || (!chatInput.trim() && !chatFile) ? T.hairline : T.rausch,
                  color: T.canvas,
                  cursor: chatSending || (!chatInput.trim() && !chatFile) ? 'not-allowed' : 'pointer',
                  opacity: chatSending || (!chatInput.trim() && !chatFile) ? 0.6 : 1,
                }}
                disabled={chatSending || (!chatInput.trim() && !chatFile)}
                onClick={sendChat}
              >
                {chatSending ? '...' : '发送'}
              </button>
            </div>
            <p className="text-xs mt-2 leading-relaxed" style={{ color: T.muted }}>
              可用审核语言：疑问（&ldquo;为什么噪音排第一？&rdquo;）、指令（&ldquo;把水流声从噪音里拆出来&rdquo;）、确认（&ldquo;可以，继续下一步&rdquo;） | 支持上传 .md .txt .csv .xlsx 附件
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}