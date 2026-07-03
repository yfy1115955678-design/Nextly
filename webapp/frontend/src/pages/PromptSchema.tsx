import { agentSchemas } from '../lib/demoData'
import { IconRobot } from '../components/Icons'

const TOKEN = {
  ink: '#222222',
  muted: '#6a6a6a',
  hairline: '#dddddd',
  canvas: '#ffffff',
  rausch: '#ff385c',
  surface: '#f7f7f7',
} as const

function SchemaBlock({ label, obj }: { label: string; obj: Record<string, any> }) {
  return (
    <div className="mb-3">
      <div className="text-xs font-semibold text-ink mb-1.5">{label}</div>
      <div className="space-y-1">
        {Object.entries(obj).map(([k, v]) => (
          <div key={k} className="flex items-start gap-2 text-xs">
            <code className="font-mono font-semibold flex-shrink-0" style={{ color: TOKEN.rausch }}>{k}</code>
            <span className="text-muted">{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PromptSchema() {
  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 24px 48px', width: '100%' }}>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-ink mb-1 flex items-center gap-2">
          <IconRobot size={24} />
          Prompt &amp; Schema
        </h2>
        <p className="text-sm text-muted">
          每个 Agent 的输入/输出 schema 和 system prompt 摘要 — 展示 agent 设计的结构化程度
        </p>
      </div>

      <div className="space-y-4">
        {agentSchemas.map((agent, idx) => (
          <div
            key={idx}
            className="card p-5"
            style={{ borderLeft: `3px solid ${TOKEN.rausch}` }}
          >
            <div className="flex items-center gap-2 mb-4">
              <IconRobot size={18} />
              <h3 className="text-base font-semibold text-ink">{agent.agent}</h3>
            </div>

            {/* Input / Output schema side by side */}
            <div className="grid grid-cols-2 gap-6">
              <SchemaBlock label="📥 Input Schema" obj={agent.input_schema} />
              <SchemaBlock label="📤 Output Schema" obj={agent.output_schema} />
            </div>

            {/* System prompt snippet */}
            <div
              className="mt-4 p-3 rounded-sm text-xs font-mono leading-relaxed whitespace-pre-wrap"
              style={{
                backgroundColor: TOKEN.surface,
                border: `1px solid ${TOKEN.hairline}`,
                color: TOKEN.muted,
              }}
            >
              <span className="text-ink font-semibold text-[10px] tracking-wide block mb-1">SYSTEM PROMPT</span>
              {agent.system_prompt_snippet}
            </div>
          </div>
        ))}
      </div>

      <div
        className="mt-6 p-4 rounded-sm text-xs leading-relaxed"
        style={{ border: `1px dashed ${TOKEN.hairline}`, color: TOKEN.muted, backgroundColor: TOKEN.surface }}
      >
        <strong className="text-ink">Production note:</strong> In the real system, prompts are version-controlled in a separate
        <code className="mx-1 px-1 rounded" style={{ backgroundColor: TOKEN.hairline }}>prompts/</code> directory with
        <code className="mx-1 px-1 rounded" style={{ backgroundColor: TOKEN.hairline }}>schema.json</code> and
        <code className="mx-1 px-1 rounded" style={{ backgroundColor: TOKEN.hairline }}>system.txt</code> per agent.
        The eval harness validates output schema compliance automatically.
      </div>
    </div>
  )
}
