import { useNavigate } from 'react-router-dom'
import { openAssistant, PageHeader, StatusBadge } from '../components/PagePrimitives'
import Symbol from '../components/Symbol'

const opportunities = [
  {
    id: 'O-001',
    label: 'A',
    title: '全 304 不锈钢＋静音＋易拆洗',
    description: '同时回应卫生、噪音与清洁三类高频痛点。',
    trend: '上升',
    market: '强',
    competition: '中',
    uncertainty: '泵体早期故障率',
    selected: true,
  },
  {
    id: 'O-002',
    label: 'B',
    title: '无线电池款大容量',
    description: '摆脱电源线束缚，拓展摆放场景。',
    trend: '上升',
    market: '中',
    competition: '低',
    uncertainty: '续航与认证成本',
    selected: false,
  },
  {
    id: 'O-003',
    label: 'C',
    title: '陶瓷高端设计款',
    description: '把饮水机进一步融入家居环境。',
    trend: '稳定',
    market: '中',
    competition: '中',
    uncertainty: '运输破损率',
    selected: false,
  },
]

export default function OpportunityPage() {
  const navigate = useNavigate()

  return (
    <div className="page-stack">
      <PageHeader
        step="01 机会发现"
        title="哪个方向值得研究？"
        description="从市场、用户与竞争信号中收敛 3 个候选方向。"
        actions={<><StatusBadge tone="success">Gate 已确认</StatusBadge><button className="secondary-button" onClick={openAssistant}>更新机会池</button></>}
      />

      <section className="decision-banner success-banner">
        <div className="banner-icon"><Symbol name="check" /></div>
        <div><span>人工决定</span><strong>O-001 已进入深度研究</strong><p>选择依据已写入 Decision Log，另外两个方向保留为备选。</p></div>
        <button className="secondary-button" onClick={() => navigate('/research')}>查看研究<Symbol name="arrow" /></button>
      </section>

      <section>
        <div className="section-heading-row"><div><span>候选方向</span><h2>3 个机会假设</h2></div><small>Demo data · 2026-07-03</small></div>
        <div className="opportunity-grid">
          {opportunities.map((opportunity) => (
            <article className={`opportunity-card ${opportunity.selected ? 'selected' : ''}`} key={opportunity.id}>
              <div className="opportunity-top">
                <span className="opportunity-letter">{opportunity.label}</span>
                <div className="opportunity-id"><small>{opportunity.id}</small>{opportunity.selected ? <StatusBadge tone="success">已选择</StatusBadge> : <StatusBadge>备选</StatusBadge>}</div>
              </div>
              <h3>{opportunity.title}</h3>
              <p>{opportunity.description}</p>
              <dl className="signal-grid">
                <div><dt>趋势</dt><dd>{opportunity.trend}</dd></div>
                <div><dt>市场信号</dt><dd>{opportunity.market}</dd></div>
                <div><dt>竞争</dt><dd>{opportunity.competition}</dd></div>
              </dl>
              <div className="uncertainty"><span>最大不确定性</span><strong>{opportunity.uncertainty}</strong></div>
              {opportunity.selected ? (
                <button className="card-action" onClick={() => navigate('/research')}>查看研究依据<Symbol name="arrow" /></button>
              ) : (
                <span className="not-selected">暂不进入首期</span>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
