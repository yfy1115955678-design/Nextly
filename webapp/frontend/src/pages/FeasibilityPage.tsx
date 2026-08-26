import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, StatusBadge } from '../components/PagePrimitives'
import Symbol from '../components/Symbol'
import { revisedRequirement, useProject } from '../lib/projectState'

type FeasibilityTab = '可行性' | 'BOM' | '风险'

const bomRows = [
  ['304 不锈钢水箱＋上盖', '$5.20', '供应商估价 / 中批量', '中'],
  ['静音直流泵模组', '$3.80', '同类泵体报价，寿命资料待补', '低'],
  ['三层滤芯（含初装）', '$1.50', '现有结构估算', '中'],
  ['PCB＋LED＋传感器', '$2.10', '功能清单估算', '低'],
  ['包装与说明书', '$1.40', '同类产品包装估算', '中'],
]

function FeasibilityDetail() {
  return (
    <div className="feasibility-list">
      <article><div><strong>不锈钢冲压 / 拉伸</strong><p>可行，需确认圆角、焊缝与表面处理。</p></div><StatusBadge tone="success">可行</StatusBadge></article>
      <article><div><strong>泵体模块化快拆</strong><p>可行性依赖防水密封与寿命测试。</p></div><StatusBadge tone="warning">待验证</StatusBadge></article>
      <article><div><strong>主要接触水部件可拆洗</strong><p>水箱、上盖和出水组件可拆洗；泵体与 PCB 单独清洁。</p></div><StatusBadge tone="success">可行</StatusBadge></article>
    </div>
  )
}

function BomDetail() {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead><tr><th>部件</th><th>估算</th><th>依据</th><th>把握</th></tr></thead>
        <tbody>{bomRows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={cell}>{index === 3 ? <StatusBadge tone={cell === '低' ? 'warning' : 'neutral'}>{cell}</StatusBadge> : cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}

function RiskDetail({ conflictOpen }: { conflictOpen: boolean }) {
  return (
    <div className="risk-list">
      <article className={conflictOpen ? 'high' : 'resolved'}><i /><div><strong>清洁边界</strong><p>{conflictOpen ? '产品定义与可制造边界冲突。' : '已修订并同步至产品定义 v2。'}</p></div><StatusBadge tone={conflictOpen ? 'danger' : 'success'}>{conflictOpen ? '阻塞' : '已解决'}</StatusBadge></article>
      <article><i /><div><strong>泵体寿命报告</strong><p>样品评审前取得 MTBF ≥8000h 或等效报告。</p></div><StatusBadge tone="warning">推进条件</StatusBadge></article>
      <article><i /><div><strong>正式成本报价</strong><p>模具、包装、物流与退货损耗仍为估算。</p></div><StatusBadge tone="warning">推进条件</StatusBadge></article>
    </div>
  )
}

export default function FeasibilityPage() {
  const { state, acceptRevision } = useProject()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<FeasibilityTab>('可行性')
  const [editing, setEditing] = useState(false)
  const [customRequirement, setCustomRequirement] = useState(revisedRequirement)
  const [keepFeedback, setKeepFeedback] = useState(false)
  const conflictOpen = state.mode === 'conflict'

  return (
    <div className="page-stack">
      <PageHeader
        step="04 落地验证"
        title="这个方案做得出来吗？"
        description={`落地验证 v1 · 读取产品定义 v${state.definitionVersion}`}
        actions={<StatusBadge tone={conflictOpen ? 'danger' : 'warning'}>{conflictOpen ? '1 个阻塞项' : '有条件推进'}</StatusBadge>}
      />

      <section className={`feasibility-verdict ${conflictOpen ? 'blocked' : 'conditional'}`}>
        <div><span>落地结论</span><h2>{conflictOpen ? '暂不建议进入评审' : state.mode === 'approved' ? '已通过阶段评审' : '可以进入阶段评审'}</h2><p>{conflictOpen ? '先解决产品定义与可制造边界冲突。' : '1 个阻塞项已解决，剩余 2 项转为打样推进条件。'}</p></div>
        <div className="feasibility-stats">
          <article><span>BOM 估算</span><strong>$14.00</strong></article>
          <article><span>到岸成本</span><strong>$22–24</strong></article>
          <article><span>建议售价</span><strong>$44.99</strong></article>
          <article><span>交期</span><strong>4–6 周</strong></article>
        </div>
      </section>

      {conflictOpen ? (
        <section className="conflict-workbench">
          <header><div><span>阻塞冲突 · C-001</span><h2>市场机会与可制造边界不一致</h2></div><StatusBadge tone="danger">等待人工确认</StatusBadge></header>
          <div className="conflict-comparison">
            <article className="market-side"><span>产品定义 v1</span><strong>整机洗碗机安全</strong><p>所有接触水部件均可直接机洗。</p></article>
            <div className="versus">VS</div>
            <article className="factory-side"><span>落地证据</span><strong>泵体与 PCB 不可机洗</strong><p>只有水箱、上盖与出水组件可以拆洗。</p></article>
          </div>
          <div className="ai-recommendation">
            <div className="recommendation-mark"><Symbol name="sparkle" /></div>
            <div><span>AI 修改建议</span><strong>{revisedRequirement}</strong><p>确认后将同步影响产品要求 R-04、清洁验收标准和阶段评审建议。</p></div>
          </div>
          <div className="affected-modules"><span>影响范围</span><i>产品定义 R-04</i><i>落地验证</i><i>评审建议</i><i>Decision Log</i></div>

          {editing ? (
            <div className="revision-editor">
              <label htmlFor="revision-copy">修改建议文本</label>
              <textarea id="revision-copy" value={customRequirement} onChange={(event) => setCustomRequirement(event.target.value)} />
              <div><button className="secondary-button" onClick={() => setEditing(false)}>取消</button><button className="primary-button" onClick={() => acceptRevision(customRequirement)}>保存并生成 v2<Symbol name="arrow" /></button></div>
            </div>
          ) : (
            <div className="gate-actions">
              <button className="primary-button" onClick={() => acceptRevision()}>接受并生成 v2<Symbol name="arrow" /></button>
              <button className="secondary-button" onClick={() => setEditing(true)}>修改建议</button>
              <button className="text-button" onClick={() => setKeepFeedback(true)}>保留原要求</button>
            </div>
          )}
          {keepFeedback ? <p className="keep-feedback">已保留原要求。由于工程方案尚未补齐，当前冲突仍保持“阻塞”。</p> : null}
        </section>
      ) : (
        <section className="decision-banner success-banner sync-success">
          <div className="banner-icon"><Symbol name="check" /></div>
          <div><span>同步完成</span><strong>清洁边界冲突已解决</strong><p>产品定义已升级至 v2，落地结论与评审建议已重新计算。</p></div>
          <button className="primary-button" onClick={() => navigate('/review')}>进入阶段评审<Symbol name="arrow" /></button>
        </section>
      )}

      <section className="validation-conditions panel-card">
        <div className="section-title"><h2>{conflictOpen ? '问题分级' : '剩余推进条件'}</h2><StatusBadge tone="warning">2 项待补证据</StatusBadge></div>
        <RiskDetail conflictOpen={conflictOpen} />
      </section>

      <section className="panel-card feasibility-details">
        <div className="tab-row" role="tablist" aria-label="落地验证维度">
          {(['可行性', 'BOM', '风险'] as FeasibilityTab[]).map((tab) => <button key={tab} role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>)}
        </div>
        <div className="tab-content" role="tabpanel">
          {activeTab === '可行性' ? <FeasibilityDetail /> : null}
          {activeTab === 'BOM' ? <BomDetail /> : null}
          {activeTab === '风险' ? <RiskDetail conflictOpen={conflictOpen} /> : null}
        </div>
      </section>
    </div>
  )
}
