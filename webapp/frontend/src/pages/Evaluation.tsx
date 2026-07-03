import { evaluationCategories, evaluationDimensions } from '../lib/demoData'

const TOKEN = {
  ink: '#222222',
  muted: '#6a6a6a',
  hairline: '#dddddd',
  canvas: '#ffffff',
  rausch: '#ff385c',
  surface: '#f7f7f7',
  green: '#00a699',
  amber: '#ffb400',
  red: '#ff385c',
} as const

const colorMap = [TOKEN.rausch, '#3b82f6', TOKEN.green]

function scoreColor(v: number, isRisk: boolean) {
  if (isRisk) return v === 0 ? TOKEN.green : v <= 1 ? TOKEN.amber : TOKEN.red
  if (v >= 0.9) return TOKEN.green
  if (v >= 0.7) return TOKEN.amber
  return TOKEN.red
}

export default function Evaluation() {
  return (
    <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '24px 24px 48px', width: '100%' }}>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-ink mb-1">Evaluation</h2>
        <p className="text-sm text-muted">
          跨品类评分对比 — 展示 agent 输出质量的量化评估维度（3 个 demo 品类模拟数据）
        </p>
      </div>

      {/* Hero cards: 3 categories */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {evaluationCategories.map((cat, i) => {
          const scores = Object.values(cat.scores).filter(v => typeof v === 'number') as number[]
          const avg = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100)
          return (
            <div
              key={cat.projectId}
              className="card p-5 text-center"
              style={{ borderTop: `3px solid ${colorMap[i]}` }}
            >
              <div className="text-lg font-semibold text-ink mb-1">{cat.name}</div>
              <div className="text-3xl font-bold mb-2" style={{ color: colorMap[i] }}>{avg}%</div>
              <div className="text-xs text-muted">综合评分</div>
              <div className="mt-3 text-xs text-muted leading-relaxed">{cat.summary}</div>
            </div>
          )
        })}
      </div>

      {/* Score table */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-ink mb-4">维度对比</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: `2px solid ${TOKEN.hairline}` }}>
                <th className="text-left py-3 pr-6 font-medium text-ink">维度</th>
                {evaluationCategories.map(cat => (
                  <th key={cat.projectId} className="text-center py-3 px-4 font-medium text-ink">{cat.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {evaluationDimensions.map(dim => (
                <tr key={dim.key} style={{ borderBottom: `1px solid ${TOKEN.hairline}` }}>
                  <td className="py-3 pr-6">
                    <div className="text-ink font-medium">{dim.label}</div>
                    <div className="text-muted mt-0.5">{dim.desc}</div>
                  </td>
                  {evaluationCategories.map(cat => {
                    const val = (cat.scores as any)[dim.key]
                    const isRisk = dim.key === 'red_risks'
                    const displayVal = dim.unit === '%' ? `${Math.round(val * 100)}%` : val
                    const color = dim.unit === 'qty' ? scoreColor(val, isRisk) : scoreColor(val, false)
                    return (
                      <td key={cat.projectId + dim.key} className="text-center py-3 px-4">
                        <span className="text-sm font-semibold" style={{ color }}>{displayVal}</span>
                        {dim.unit === '%' && (
                          <div className="mt-1 mx-auto h-1.5 rounded-full" style={{ width: '48px', backgroundColor: TOKEN.hairline }}>
                            <div
                              className="h-1.5 rounded-full"
                              style={{ width: `${Math.round(val * 100)}%`, backgroundColor: color }}
                            />
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insight footer */}
      <div
        className="mt-4 p-4 rounded-sm text-xs leading-relaxed"
        style={{ border: `1px dashed ${TOKEN.hairline}`, color: TOKEN.muted, backgroundColor: TOKEN.surface }}
      >
        <strong className="text-ink">评估方法:</strong> 痛点覆盖率基于评论引用回测；Brief 完整度基于 12 章结构化解析；红色风险来自 Agent B 审查报告；
        打分在真实系统中由专用 <code className="mx-1 px-1 rounded" style={{ backgroundColor: TOKEN.hairline }}>eval-harness</code> 模块自动执行，并可作为 CI gate。
      </div>
    </div>
  )
}
