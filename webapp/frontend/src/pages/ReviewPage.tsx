import { useNavigate } from 'react-router-dom'
import { PageHeader, StatusBadge } from '../components/PagePrimitives'
import Symbol from '../components/Symbol'
import { useProject } from '../lib/projectState'

function getReviewContent(mode: string) {
  if (mode === 'approved') {
    return {
      badge: '决定已记录',
      badgeTone: 'success' as const,
      title: '有条件进入打样',
      body: '市场机会成立，阻塞冲突已解决，剩余问题已转为样品评审前置条件。',
    }
  }
  if (mode === 'revised') {
    return {
      badge: '等待人工确认',
      badgeTone: 'warning' as const,
      title: '建议有条件进入打样',
      body: '核心方案具备可行性，可以在保留两项前置条件的情况下进入打样。',
    }
  }
  if (mode === 'paused') {
    return {
      badge: '项目已暂停',
      badgeTone: 'neutral' as const,
      title: '保留当前证据与版本',
      body: '暂停决定已生效，项目不会进入下一阶段。',
    }
  }
  return {
    badge: '存在阻塞项',
    badgeTone: 'danger' as const,
    title: '先修改产品定义',
    body: 'R-04 与可制造边界冲突，当前不具备阶段评审条件。',
  }
}

export default function ReviewPage() {
  const { state, approveConditionally, pauseProject } = useProject()
  const navigate = useNavigate()
  const content = getReviewContent(state.mode)
  const canDecide = state.mode === 'revised'

  return (
    <div className="page-stack">
      <PageHeader
        step="05 评审与决策"
        title="现在值得继续推进吗？"
        description="汇总支持依据、剩余条件与人工最终决定。"
        actions={<StatusBadge tone={content.badgeTone}>{content.badge}</StatusBadge>}
      />

      <section className={`review-decision ${state.mode}`}>
        <div className="review-main">
          <span>阶段建议</span>
          <h2>{content.title}</h2>
          <p>{content.body}</p>
        </div>

        <div className="review-evidence-grid">
          <article>
            <span>支持推进的依据</span>
            <ul>
              <li><Symbol name="check" />市场需求稳定，$35–50 价格带清晰</li>
              <li><Symbol name="check" />用户痛点集中在泵体、卫生与清洁</li>
              <li><Symbol name="check" />BOM 与供应商路径已有初步依据</li>
            </ul>
          </article>
          <article>
            <span>{state.mode === 'conflict' ? '当前阻塞' : '打样前置条件'}</span>
            <ul>
              {state.mode === 'conflict' ? <li className="danger"><Symbol name="alert" />清洁边界尚未完成修订</li> : null}
              <li className="warning"><Symbol name="alert" />取得泵体寿命报告或等效验证</li>
              <li className="warning"><Symbol name="alert" />使用正式报价替换成本估算</li>
            </ul>
          </article>
        </div>

        {state.mode === 'conflict' ? (
          <div className="review-actions"><button className="primary-button" onClick={() => navigate('/feasibility')}>处理阻塞冲突<Symbol name="arrow" /></button></div>
        ) : null}

        {canDecide ? (
          <div className="review-actions">
            <button className="primary-button" onClick={approveConditionally}>有条件进入打样<Symbol name="arrow" /></button>
            <button className="secondary-button" onClick={() => navigate('/product')}>返回查看定义</button>
            <button className="text-button" onClick={pauseProject}>暂停项目</button>
          </div>
        ) : null}

        {state.mode === 'approved' ? (
          <div className="next-stage-card"><Symbol name="check" /><div><span>下一阶段</span><strong>样品与供应商验证</strong><p>在样品评审前补齐寿命与成本证据。</p></div></div>
        ) : null}
      </section>

      <section className="decision-log panel-card">
        <div className="section-title"><h2>Decision Log</h2><StatusBadge>{state.decisions.length} 条记录</StatusBadge></div>
        <div className="decision-timeline">
          {[...state.decisions].reverse().map((record) => (
            <article key={record.id}>
              <span className="timeline-marker"><Symbol name="check" /></span>
              <div className="timeline-body">
                <header><div><small>{record.id} · {record.stage}</small><strong>{record.decision}</strong></div><time>{record.date}</time></header>
                <p>{record.rationale}</p>
                <div><span>影响</span>{record.impact}</div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
