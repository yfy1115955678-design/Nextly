import { IconHistory, IconRobot, IconUser } from './Icons'

interface ReviewEntry {
  version: number
  role: string
  action: string
  content: string | null
  issues_found: number | null
  created_at: string
}

interface VersionHistoryProps {
  entries: ReviewEntry[]
}

export function VersionHistory({ entries }: VersionHistoryProps) {
  return (
    <>
      <div className="card !p-5">
        <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-1.5">
          <IconHistory size={16} />
          版本历史
        </h3>
        {entries.length === 0 ? (
          <p className="text-xs text-muted">暂无版本记录</p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {entries.map((v, i) => (
              <div key={i} className="text-xs border-l-2 border-hairline pl-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-ink">v{v.version}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] border border-hairline text-muted flex items-center gap-0.5">
                    {v.role === 'agent_a' && <IconRobot size={10} />}
                    {v.role === 'agent_b' && <IconRobot size={10} />}
                    {v.role === 'user' && <IconUser size={10} />}
                    {v.role === 'agent_a'
                      ? 'Agent A'
                      : v.role === 'agent_b'
                        ? 'Agent B'
                        : v.role === 'user'
                          ? '人工'
                          : v.role}
                  </span>
                  <span className="text-muted ml-auto">{v.action}</span>
                </div>
                {v.issues_found != null && (
                  <div className="text-muted mt-0.5">发现问题：{v.issues_found} 个</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {entries.length > 0 && entries.some((v) => v.role === 'agent_b') && (
        <div className="bg-surface-soft border border-hairline rounded-sm p-4">
          <p className="text-xs text-ink font-medium mb-2">迭代建议流程</p>
          <ol className="text-xs text-muted space-y-1 list-decimal list-inside">
            <li>阅读 Agent B 审查结果</li>
            <li>在编辑器中修改 Brief</li>
            <li>保存 - 再次 Agent B 审查</li>
            <li>直到高优先问题清零</li>
          </ol>
        </div>
      )}
    </>
  )
}
