import { useNavigate } from 'react-router-dom'
import { ArrowButton, PageHeader, SectionTitle, StatusBadge, WorkflowStrip } from '../components/PagePrimitives'
import Symbol from '../components/Symbol'
import { useProject } from '../lib/projectState'

function getPrimaryTask(mode: string) {
  if (mode === 'revised') {
    return {
      eyebrow: '当前任务 · Human Gate',
      title: '完成阶段评审',
      body: '清洁边界冲突已解决，剩余两项可作为打样推进条件。',
      action: '进入评审',
      to: '/review',
      tone: 'ready',
    }
  }

  if (mode === 'approved') {
    return {
      eyebrow: '本轮结果',
      title: '有条件进入打样',
      body: '决定已记录。泵体寿命报告和正式报价须在样品评审前补齐。',
      action: '查看决定',
      to: '/review',
      tone: 'complete',
    }
  }

  if (mode === 'paused') {
    return {
      eyebrow: '项目状态',
      title: '项目已暂停',
      body: '当前证据、版本与决定已保留，可以从项目记录中回看。',
      action: '查看记录',
      to: '/trace',
      tone: 'paused',
    }
  }

  return {
    eyebrow: '当前任务 · Human Gate',
    title: '确认清洁边界修订',
    body: '产品定义中的“整机洗碗机安全”与泵体、PCB 的可制造边界冲突。',
    action: '处理冲突',
    to: '/feasibility',
    tone: 'attention',
  }
}

export default function OverviewPage() {
  const { state } = useProject()
  const navigate = useNavigate()
  const task = getPrimaryTask(state.mode)
  const latestDecision = state.decisions[state.decisions.length - 1]
  const latestArtifact = state.artifacts[0]

  return (
    <div className="page-stack overview-page">
      <PageHeader
        step="NEXTLY 2.0 · AI 协作的产品开发 WORKFLOW DEMO"
        title="AquaPure S1 · 宠物饮水机"
        description="AI 协助分析和影响定位，人确认关键决策，系统负责同步项目状态。"
        actions={<><StatusBadge tone="info">US Amazon</StatusBadge><StatusBadge>宠物饮水机</StatusBadge></>}
      />

      <WorkflowStrip />

      <section className={`primary-task ${task.tone}`}>
        <div className="task-icon"><Symbol name={state.mode === 'conflict' ? 'alert' : 'sparkle'} /></div>
        <div className="task-copy">
          <span>{task.eyebrow}</span>
          <h2>{task.title}</h2>
          <p>{task.body}</p>
        </div>
        <button className="primary-button" onClick={() => navigate(task.to)}>{task.action}<Symbol name="arrow" /></button>
      </section>

      <div className="overview-grid">
        <section className="panel-card">
          <SectionTitle title="最近决定" meta={<StatusBadge tone="success">已记录</StatusBadge>} />
          <button className="decision-summary" onClick={() => navigate('/trace')}>
            <span className="decision-check"><Symbol name="check" /></span>
            <div>
              <strong>{latestDecision.decision}</strong>
              <p>{latestDecision.rationale}</p>
              <small>{latestDecision.stage} · {latestDecision.date}</small>
            </div>
            <Symbol name="arrow" />
          </button>
          {latestArtifact ? (
            <div className="latest-artifact">
              <Symbol name="file" />
              <div><span>最近导入</span><strong>{latestArtifact.name}</strong></div>
              <StatusBadge tone="warning">{latestArtifact.kind}</StatusBadge>
            </div>
          ) : null}
        </section>

        <section className="panel-card">
          <SectionTitle
            title={state.mode === 'conflict' ? '待处理' : '推进条件'}
            meta={<StatusBadge tone={state.mode === 'conflict' ? 'danger' : 'warning'}>{state.mode === 'conflict' ? '1 个阻塞项' : '2 项'}</StatusBadge>}
          />
          <div className="issue-list">
            <button className={`issue-row ${state.mode === 'conflict' ? 'blocker' : 'resolved'}`} onClick={() => navigate('/feasibility')}>
              <i />
              <div><strong>清洁边界</strong><small>{state.mode === 'conflict' ? '需要人工确认修订范围' : '已同步至产品定义 v2'}</small></div>
              <StatusBadge tone={state.mode === 'conflict' ? 'danger' : 'success'}>{state.mode === 'conflict' ? '阻塞' : '已解决'}</StatusBadge>
            </button>
            <button className="issue-row condition" onClick={() => navigate('/review')}>
              <i />
              <div><strong>泵体寿命报告</strong><small>样品评审前补齐 MTBF 或等效验证</small></div>
              <StatusBadge tone="warning">推进条件</StatusBadge>
            </button>
            <button className="issue-row condition" onClick={() => navigate('/review')}>
              <i />
              <div><strong>正式成本报价</strong><small>替换模具、包装与物流估算值</small></div>
              <StatusBadge tone="warning">推进条件</StatusBadge>
            </button>
          </div>
          <ArrowButton onClick={() => navigate(state.mode === 'conflict' ? '/feasibility' : '/review')}>
            {state.mode === 'conflict' ? '查看影响范围' : '查看评审条件'}
          </ArrowButton>
        </section>
      </div>
    </div>
  )
}
