import { PageHeader, StatusBadge } from '../components/PagePrimitives'
import Symbol from '../components/Symbol'
import { useProject } from '../lib/projectState'

export default function TracePage() {
  const { state } = useProject()
  const conflictResolved = state.definitionVersion === 2

  const traceEntries = [
    { id: 'RUN-01', title: '机会信号汇总', actor: '机会分析', result: '形成 3 个候选方向', status: '完成' },
    { id: 'RUN-02', title: '市场与评论证据分析', actor: '研究分析', result: '确认 O-001 机会成立', status: '完成' },
    { id: 'RUN-03', title: 'Product Brief 生成', actor: '产品定义', result: `生成产品定义 v${state.definitionVersion}`, status: '完成' },
    { id: 'RUN-04', title: '定义与落地冲突检查', actor: '落地验证', result: conflictResolved ? 'C-001 已解决' : '发现 C-001，等待人工确认', status: conflictResolved ? '完成' : '等待确认' },
    { id: 'RUN-05', title: '阶段评审汇总', actor: '评审', result: state.mode === 'approved' ? '决定：有条件进入打样' : conflictResolved ? '已生成条件性推进建议' : '等待上游状态', status: state.mode === 'approved' ? '完成' : conflictResolved ? '等待确认' : '未开始' },
  ]

  return (
    <div className="page-stack">
      <PageHeader
        step="项目记录"
        title="证据、版本与运行过程"
        description="专业分析在后台运行，前台只保留必要的依据、差异和人工决定。"
        actions={<StatusBadge tone="info">Run Trace</StatusBadge>}
      />

      <div className="trace-summary-grid">
        <article className="panel-card"><span>当前产品定义</span><strong>v{state.definitionVersion}</strong><p>{conflictResolved ? '清洁边界已修订' : '存在 1 个待确认冲突'}</p></article>
        <article className="panel-card"><span>人工决定</span><strong>{state.decisions.length}</strong><p>全部保留依据与影响范围</p></article>
        <article className="panel-card"><span>项目证据</span><strong>{3 + state.artifacts.length}</strong><p>研究数据、落地证据与新增资料</p></article>
      </div>

      <section className="trace-list panel-card">
        <div className="section-title"><h2>运行记录</h2><StatusBadge>只展示关键节点</StatusBadge></div>
        {traceEntries.map((entry, index) => (
          <article key={entry.id}>
            <div className={`trace-marker ${entry.status === '完成' ? 'done' : entry.status === '等待确认' ? 'waiting' : 'muted'}`}>
              {entry.status === '完成' ? <Symbol name="check" /> : <span>{index + 1}</span>}
            </div>
            <div className="trace-copy"><small>{entry.id} · {entry.actor}</small><strong>{entry.title}</strong><p>{entry.result}</p></div>
            <StatusBadge tone={entry.status === '完成' ? 'success' : entry.status === '等待确认' ? 'warning' : 'neutral'}>{entry.status}</StatusBadge>
          </article>
        ))}
      </section>

      {state.artifacts.length ? (
        <section className="panel-card artifact-history">
          <div className="section-title"><h2>最近导入</h2><StatusBadge>{state.artifacts.length} 个文件</StatusBadge></div>
          {state.artifacts.map((artifact) => (
            <article key={artifact.id}><Symbol name="file" /><div><strong>{artifact.name}</strong><p>{artifact.summary}</p></div><span>{artifact.affectedModules.join(' · ')}</span></article>
          ))}
        </section>
      ) : null}
    </div>
  )
}
