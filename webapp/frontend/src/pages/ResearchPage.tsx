import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { openAssistant, PageHeader, StatusBadge } from '../components/PagePrimitives'
import Symbol from '../components/Symbol'

type ResearchTab = '市场' | '用户' | '竞品' | '趋势' | '规格 / CMF'

const tabs: ResearchTab[] = ['市场', '用户', '竞品', '趋势', '规格 / CMF']

function MarketView() {
  return (
    <div className="metric-grid">
      <article><span>月销售规模</span><strong>$1.2M–$1.8M</strong><small>核心样本估算</small></article>
      <article><span>竞争强度</span><strong>中等</strong><small>头部商品约占 35%</small></article>
      <article><span>核心价格带</span><strong>$35–50</strong><small>不锈钢升级带</small></article>
      <article><span>新品机会</span><strong>存在</strong><small>体验与材质升级</small></article>
    </div>
  )
}

function UserView() {
  return (
    <div className="research-list">
      <article><span>01</span><div><strong>泵体噪音与早期故障</strong><p>高频且高严重度，直接影响持续使用与退货。</p></div><StatusBadge tone="danger">27%</StatusBadge></article>
      <article><span>02</span><div><strong>水路卫生与塑料异味</strong><p>用户倾向为金属接触水面支付溢价。</p></div><StatusBadge tone="warning">21%</StatusBadge></article>
      <article><span>03</span><div><strong>拆洗步骤过多</strong><p>复杂结构降低日常清洁频率，也放大卫生问题。</p></div><StatusBadge tone="warning">18%</StatusBadge></article>
    </div>
  )
}

function CompetitorView() {
  return (
    <div className="cluster-grid">
      <article><span>价格型</span><strong>$20–30</strong><p>塑料结构为主，容量与价格竞争充分。</p></article>
      <article className="highlight"><span>升级型</span><strong>$35–50</strong><p>不锈钢、静音与易清洁仍有组合机会。</p></article>
      <article><span>智能型</span><strong>$55+</strong><p>App 功能增加成本，但并非首要用户需求。</p></article>
    </div>
  )
}

function TrendView() {
  return (
    <div className="evidence-notes">
      <article><StatusBadge tone="success">上升</StatusBadge><div><strong>不锈钢接触水面</strong><p>从材质卖点逐步转向卫生与耐用体验表达。</p></div></article>
      <article><StatusBadge tone="success">上升</StatusBadge><div><strong>模块化快拆</strong><p>清洁步骤和死角数量开始成为详情页核心展示内容。</p></div></article>
      <article><StatusBadge>稳定</StatusBadge><div><strong>App 智能功能</strong><p>可作为后续版本，不进入首期 MVP。</p></div></article>
    </div>
  )
}

function SpecView() {
  return (
    <div className="spec-research-grid">
      <article><span>推荐容量</span><strong>3.0L</strong><p>适配 1–3 只猫或小型犬。</p></article>
      <article><span>噪音目标</span><strong>≤25dB</strong><p>须通过样品实测，不作为既成事实。</p></article>
      <article><span>材质方向</span><strong>304 不锈钢</strong><p>主要接触水面减少塑料使用。</p></article>
      <article><span>CMF 方向</span><strong>哑光白 / 冷灰</strong><p>弱化传统宠物用品感。</p></article>
    </div>
  )
}

function renderTab(tab: ResearchTab) {
  if (tab === '市场') return <MarketView />
  if (tab === '用户') return <UserView />
  if (tab === '竞品') return <CompetitorView />
  if (tab === '趋势') return <TrendView />
  return <SpecView />
}

export default function ResearchPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<ResearchTab>('市场')
  const [evidenceOpen, setEvidenceOpen] = useState(false)

  return (
    <div className="page-stack">
      <PageHeader
        step="02 市场研究"
        title="这个机会成立吗？"
        description="50 个商品 · 729 条评论 · 研究 v1"
        actions={<><StatusBadge tone="success">Gate 已确认</StatusBadge><button className="secondary-button" onClick={openAssistant}>更新数据</button></>}
      />

      <section className="research-verdict">
        <div className="verdict-main">
          <span>研究结论</span>
          <h2>当前证据支持继续推进</h2>
          <p>最明确的机会是：不锈钢接触水面、低噪音泵体与更少步骤的清洁体验。</p>
          <div className="verdict-points">
            <span><Symbol name="check" />需求稳定，价格带清晰</span>
            <span><Symbol name="check" />痛点集中且证据一致</span>
            <span><Symbol name="alert" />泵体寿命与清洁边界待验证</span>
          </div>
        </div>
        <div className="verdict-actions">
          <button className="primary-button" onClick={() => navigate('/product')}>查看产品定义<Symbol name="arrow" /></button>
          <button className="secondary-button" onClick={() => setEvidenceOpen((value) => !value)}>{evidenceOpen ? '收起依据' : '查看依据'}</button>
        </div>
      </section>

      {evidenceOpen ? (
        <section className="evidence-drawer">
          <div><span>数据来源</span><strong>Amazon BSR Top 50＋重点竞品评论</strong></div>
          <div><span>更新时间</span><strong>2026-07-05</strong></div>
          <div><span>证据完整度</span><strong>市场 / 用户 / 竞品已覆盖</strong></div>
          <p>本页面使用预置演示数据，用于展示证据如何进入产品定义与后续验证。</p>
        </section>
      ) : null}

      <section className="research-detail panel-card">
        <div className="tab-row" role="tablist" aria-label="研究维度">
          {tabs.map((tab) => (
            <button key={tab} role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </div>
        <div className="tab-content" role="tabpanel">{renderTab(activeTab)}</div>
      </section>
    </div>
  )
}
