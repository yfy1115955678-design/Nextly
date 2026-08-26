import { useNavigate } from 'react-router-dom'
import { PageHeader, StatusBadge } from '../components/PagePrimitives'
import Symbol from '../components/Symbol'
import { useProject } from '../lib/projectState'

const requirements = [
  {
    id: 'R-01',
    title: '水泵工作噪音 ≤25dB，寿命目标 ≥8000h',
    reason: '回应高频且高严重度的水泵噪音与早期故障问题。',
    evidence: '用户痛点 P-01',
    validation: '样品噪音实测＋寿命报告',
  },
  {
    id: 'R-02',
    title: '避免塑料直接接触主要水路',
    reason: '降低生物膜、异味与用户对塑料材质的担忧。',
    evidence: '用户痛点 P-02',
    validation: '材料清单＋水路结构审查',
  },
  {
    id: 'R-03',
    title: '3.0L 有效容量，适配 1–3 只宠物',
    reason: '匹配主流容量与城市公寓目标场景。',
    evidence: '市场价格带 M-02',
    validation: '有效容积测量',
  },
]

export default function ProductPage() {
  const { state } = useProject()
  const navigate = useNavigate()
  const hasRevision = state.definitionVersion === 2

  const exportBrief = () => {
    const markdown = `# AquaPure S1 · Product Brief v${state.definitionVersion}\n\n## 产品定位\n全 304 不锈钢接触水面、低噪音、易清洁的中端宠物饮水机。\n\n## 目标用户\n25–40 岁城市公寓用户，养 1–3 只猫或小型犬。\n\n## 清洁要求\n${state.cleaningRequirement}\n\n## 价格与容量\n- 建议售价：$44.99\n- 核心价格带：$35–50\n- 有效容量：3.0L\n`
    const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `AquaPure-S1-Brief-v${state.definitionVersion}.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="page-stack">
      <PageHeader
        step="03 产品定义"
        title="所以具体做什么？"
        description="把研究结论转成可验证、可追溯的产品要求。"
        actions={<><StatusBadge tone={hasRevision ? 'success' : 'warning'}>产品定义 v{state.definitionVersion}</StatusBadge><button className="secondary-button" onClick={() => navigate('/research')}>查看研究依据</button></>}
      />

      {!hasRevision ? (
        <section className="decision-banner conflict-banner">
          <div className="banner-icon"><Symbol name="alert" /></div>
          <div><span>落地验证发现冲突</span><strong>R-04 超出可制造边界</strong><p>当前版本仍保留原要求，须经人工确认后才能生成 v2。</p></div>
          <button className="primary-button" onClick={() => navigate('/feasibility')}>处理冲突<Symbol name="arrow" /></button>
        </section>
      ) : (
        <section className="decision-banner success-banner">
          <div className="banner-icon"><Symbol name="check" /></div>
          <div><span>版本已同步</span><strong>R-04 已根据人工决定修订</strong><p>落地验证和阶段评审已读取产品定义 v2。</p></div>
          <button className="secondary-button" onClick={() => navigate('/feasibility')}>查看验证<Symbol name="arrow" /></button>
        </section>
      )}

      <section className="definition-summary panel-card">
        <div className="definition-main">
          <span>产品定位</span>
          <h2>AquaPure S1：全 304 不锈钢接触水面、低噪音、易清洁的中端宠物饮水机。</h2>
        </div>
        <div className="definition-user">
          <span>目标用户</span>
          <p>25–40 岁城市公寓用户，养 1–3 只猫或小型犬，愿意为卫生、静音与家居品质支付 $35–50。</p>
        </div>
      </section>

      {hasRevision ? (
        <section className="version-diff">
          <div className="diff-label"><span>v1 → v2</span><strong>清洁边界</strong></div>
          <div className="diff-old"><span>原要求</span><p>整机洗碗机安全，所有接触水部件均可直接机洗。</p></div>
          <Symbol name="arrow" />
          <div className="diff-new"><span>人工确认后</span><p>{state.cleaningRequirement}</p></div>
        </section>
      ) : null}

      <section>
        <div className="section-heading-row"><div><span>核心需求</span><h2>每项要求都有依据与验收方式</h2></div><StatusBadge>Must have · 4</StatusBadge></div>
        <div className="requirement-list">
          {requirements.map((requirement) => (
            <article key={requirement.id}>
              <span className="requirement-id">{requirement.id}</span>
              <div className="requirement-copy"><h3>{requirement.title}</h3><p>{requirement.reason}</p></div>
              <dl><div><dt>依据</dt><dd>{requirement.evidence}</dd></div><div><dt>验证</dt><dd>{requirement.validation}</dd></div></dl>
              <StatusBadge tone="info">必须</StatusBadge>
            </article>
          ))}
          <article className={!hasRevision ? 'requirement-conflict' : 'requirement-resolved'}>
            <span className="requirement-id">R-04</span>
            <div className="requirement-copy"><h3>{state.cleaningRequirement}</h3><p>{hasRevision ? '根据可制造边界修订清洁范围。' : '来自易清洁机会，但尚未通过可制造性验证。'}</p></div>
            <dl><div><dt>依据</dt><dd>用户痛点 P-03</dd></div><div><dt>验证</dt><dd>{hasRevision ? '拆洗步骤＋防水清洁测试' : '落地验证存在冲突'}</dd></div></dl>
            <StatusBadge tone={hasRevision ? 'success' : 'danger'}>{hasRevision ? '已修订' : '阻塞'}</StatusBadge>
          </article>
        </div>
      </section>

      <div className="product-grid">
        <section className="panel-card">
          <div className="section-title"><h2>产品方案</h2><StatusBadge tone="info">MVP</StatusBadge></div>
          <div className="feature-chips">
            {['低噪音直流泵模组', '全 304 接触水面', '5 模块快拆', 'LED 水位提醒', '滤芯寿命提示', 'USB-C 5V/2A'].map((feature) => <span key={feature}>{feature}</span>)}
          </div>
          <dl className="spec-list">
            <div><dt>有效容量</dt><dd>3.0L</dd></div>
            <div><dt>噪音目标</dt><dd>≤25dB（待实测）</dd></div>
            <div><dt>滤芯</dt><dd>活性炭＋离子交换树脂＋无纺布</dd></div>
            <div><dt>供电</dt><dd>USB-C 5V/2A</dd></div>
          </dl>
        </section>

        <section className="panel-card cmf-card">
          <div className="section-title"><h2>CMF 与差异化</h2></div>
          <div className="cmf-swatch-row"><span className="swatch white" /><span className="swatch grey" /><span className="swatch steel" /></div>
          <dl className="spec-list">
            <div><dt>主体材质</dt><dd>304 不锈钢＋可视水位视窗</dd></div>
            <div><dt>主色方向</dt><dd>哑光白 / 冷灰</dd></div>
            <div><dt>细节工艺</dt><dd>拉丝金属＋低反光深灰按键</dd></div>
          </dl>
          <p className="differentiation-copy">全 304 接触水面、低噪音泵体与更少步骤的清洁体验。</p>
        </section>
      </div>

      <section className="brief-output">
        <div><span>Product Brief · v{state.definitionVersion}</span><strong>全 304 不锈钢静音宠物饮水机 · $35–50 · 3.0L</strong></div>
        <button className="secondary-button" onClick={exportBrief}>导出 Brief</button>
        <button className="primary-button" onClick={() => navigate('/feasibility')}>查看落地验证<Symbol name="arrow" /></button>
      </section>
    </div>
  )
}
