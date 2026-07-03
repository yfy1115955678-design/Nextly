import { traceEntries } from '../lib/demoData'
import { IconRobot } from '../components/Icons'

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

function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

export default function RunTrace() {
  const totalDuration = traceEntries.reduce((s, e) => s + e.duration_ms, 0)

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 24px 48px', width: '100%' }}>
      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-ink mb-1 flex items-center gap-2">
          <IconRobot size={24} />
          Run Trace
        </h2>
        <p className="text-sm text-muted">
          Agent observability — 每个 Phase 的输入、输出、耗时、状态。真实环境下 trace 由 dedicated logger 实时写入。
        </p>
      </div>

      {/* Summary bar */}
      <div
        className="mb-6 p-4 rounded-sm flex items-center justify-between"
        style={{ backgroundColor: TOKEN.surface, border: `1px solid ${TOKEN.hairline}` }}
      >
        <div className="flex items-center gap-6">
          <div>
            <span className="text-xs text-muted">Steps</span>
            <div className="text-lg font-semibold text-ink">{traceEntries.length}</div>
          </div>
          <div>
            <span className="text-xs text-muted">Total Duration</span>
            <div className="text-lg font-semibold text-ink">{formatDuration(totalDuration)}</div>
          </div>
          <div>
            <span className="text-xs text-muted">Success Rate</span>
            <div className="text-lg font-semibold" style={{ color: TOKEN.green }}>100%</div>
          </div>
          <div>
            <span className="text-xs text-muted">Mock Mode</span>
            <div className="text-lg font-semibold text-ink">10 / 10</div>
          </div>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
          style={{ border: `1px solid ${TOKEN.hairline}`, color: TOKEN.muted }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '999px', backgroundColor: TOKEN.green, display: 'inline-block' }} />
          All traces healthy
        </div>
      </div>

      {/* Trace timeline */}
      <div className="space-y-0">
        {traceEntries.map((entry, idx) => {
          const relativeTime = formatDuration(
            traceEntries.slice(0, idx + 1).reduce((s, e) => s + e.duration_ms, 0)
          )
          return (
            <div key={entry.id} className="flex items-stretch" style={{ minHeight: '64px' }}>
              {/* Timeline gutter */}
              <div className="flex flex-col items-center mr-4" style={{ width: '32px', flexShrink: 0 }}>
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '999px',
                    backgroundColor: entry.status === 'success' ? TOKEN.green : TOKEN.red,
                    flexShrink: 0,
                    marginTop: '14px',
                  }}
                />
                {idx < traceEntries.length - 1 && (
                  <div style={{ width: '2px', flex: 1, backgroundColor: TOKEN.hairline, marginTop: '4px', marginBottom: '4px' }} />
                )}
              </div>

              {/* Card */}
              <div
                className="flex-1 p-3 mb-2 rounded-sm"
                style={{ backgroundColor: TOKEN.canvas, border: `1px solid ${TOKEN.hairline}` }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: TOKEN.ink,
                        color: TOKEN.canvas,
                        fontSize: '11px',
                      }}
                    >
                      {entry.phase}
                    </span>
                    <span className="text-sm font-semibold text-ink">{entry.label}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span style={{ color: TOKEN.rausch, fontWeight: 500 }}>{formatDuration(entry.duration_ms)}</span>
                    <span title="Cumulative">+{relativeTime}</span>
                    <span
                      className="px-1.5 py-0.5 rounded-full"
                      style={{
                        fontSize: '10px',
                        border: `1px solid ${TOKEN.hairline}`,
                        backgroundColor: TOKEN.surface,
                      }}
                    >
                      {entry.mock ? 'MOCK' : 'LIVE'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2 text-xs">
                  <div>
                    <span className="text-muted">Input</span>
                    <div className="text-ink font-mono truncate">{entry.input}</div>
                  </div>
                  <div>
                    <span className="text-muted">Output</span>
                    <div className="text-ink font-mono truncate">{entry.output}</div>
                  </div>
                  <div className="col-span-2 mt-1 flex items-center gap-1">
                    <span className="text-muted">Agent</span>
                    <code className="text-xs font-mono px-1 py-0.5 rounded" style={{ backgroundColor: TOKEN.surface, color: TOKEN.ink }}>
                      {entry.agent}
                    </code>
                    <span
                      className="ml-2"
                      style={{ width: '6px', height: '6px', borderRadius: '999px', backgroundColor: entry.status === 'success' ? TOKEN.green : TOKEN.red, display: 'inline-block' }}
                    />
                    <span className="text-xs" style={{ color: TOKEN.green }}>{entry.status}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer note */}
      <div
        className="mt-6 p-4 rounded-sm text-xs"
        style={{ border: `1px dashed ${TOKEN.hairline}`, color: TOKEN.muted, backgroundColor: TOKEN.surface }}
      >
        <strong className="text-ink">Production note:</strong> In the real version, each trace entry would be emitted by a dedicated
        <code className="mx-1 px-1 rounded" style={{ backgroundColor: TOKEN.hairline }}>TraceLogger</code> middleware that captures
        input payloads, output snapshots, token usage, and wall-clock timing per agent call. This demo simulates those values.
      </div>
    </div>
  )
}
