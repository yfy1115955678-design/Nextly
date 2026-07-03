const TOKEN = {
  ink: '#222222',
  muted: '#6a6a6a',
  hairline: '#dddddd',
  canvas: '#ffffff',
  rausch: '#ff385c',
  surface: '#f7f7f7',
  green: '#00a699',
  blue: '#3b82f6',
} as const

export function ArchitectureDiagram() {
  return (
    <div className="card mt-6" style={{ border: `1px dashed ${TOKEN.hairline}`, backgroundColor: TOKEN.surface }}>
      <h3 className="text-sm font-semibold text-ink mb-4">Mock vs Real Architecture</h3>
      <p className="text-xs text-muted mb-4">
        当前 demo 为前端纯 mock 模式（左）。生产环境将接真实栈（右）。评审者可通过此图了解完整的技术架构路径。
      </p>

      <div className="grid grid-cols-2 gap-4">
        {/* Mock (Current) */}
        <div className="p-4 rounded-sm" style={{ backgroundColor: TOKEN.canvas, border: `1px solid ${TOKEN.hairline}` }}>
          <div className="text-xs font-semibold text-ink mb-3 flex items-center gap-1.5">
            <span style={{ width: '7px', height: '7px', borderRadius: '999px', backgroundColor: TOKEN.rausch, display: 'inline-block' }} />
            Portfolio Demo · Mock
          </div>

          <div className="space-y-2 text-[11px]" style={{ color: TOKEN.muted }}>
            {[
              ['Browser → mockFetch.ts', '拦截所有 /api/*'],
              ['demoData.ts', '预烘焙 10 个对象'],
              ['window.fetch override', '无后端、无 DB、无 LLM'],
              ['Vercel Vite SPA', '静态站点一键部署'],
            ].map(([label, desc], i) => (
              <div key={i} className="flex items-start gap-2 py-1" style={{ borderBottom: i < 3 ? `1px solid ${TOKEN.hairline}` : 'none' }}>
                <code className="font-mono flex-shrink-0 px-1 rounded" style={{ backgroundColor: TOKEN.surface, color: TOKEN.ink }}>{label}</code>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Real (Intended Production) */}
        <div className="p-4 rounded-sm" style={{ backgroundColor: TOKEN.canvas, border: `1px solid ${TOKEN.blue}` }}>
          <div className="text-xs font-semibold mb-3 flex items-center gap-1.5" style={{ color: TOKEN.blue }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '999px', backgroundColor: TOKEN.blue, display: 'inline-block' }} />
            Production Stack (Intended)
          </div>

          <div className="space-y-2 text-[11px]" style={{ color: TOKEN.muted }}>
            {[
              ['FastAPI Backend', 'REST /upload, /analysis, /brief'],
              ['PostgreSQL + Redis', 'Project state, trace, eval results'],
              ['LLM Orchestrator', 'DeepSeek/Claude via retry + timeout'],
              ['TraceLogger Middleware', 'Input/output/timing per agent call'],
              ['Eval Harness', 'CI gate: coverage, risk, schema validation'],
              ['Excel Parser', 'openpyxl + inlineStr fallback'],
            ].map(([label, desc], i) => (
              <div key={i} className="flex items-start gap-2 py-1" style={{ borderBottom: i < 5 ? `1px solid ${TOKEN.hairline}` : 'none' }}>
                <code className="font-mono flex-shrink-0 px-1 rounded" style={{ backgroundColor: TOKEN.surface, color: TOKEN.ink }}>{label}</code>
                <span>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data flow arrows */}
      <div className="mt-4 text-center text-[10px]" style={{ color: TOKEN.muted }}>
        In production: User upload → Parser → LLM Orchestrator → TraceLogger → Eval Harness → CI Gate → Deploy
      </div>
    </div>
  )
}
