
/** 演示数据 — 宠物饮水机品类全流程分析结果 */
export const DEMO_PROJECT_ID = 'demo-pet-fountain'

// ═══ DataUpload 页面 Phase 0 结果 ═══
export const phase0Upload = {
  phase0: {
    files: [
      { filename: 'Cat_Fountains_BSR50_汇总.xlsx', detected_type: 'bsr_listing', row_count: 50, columns: ['ASIN', 'Brand', 'Price', 'Rating', 'Reviews', 'Sales'], quality: '良好' },
      { filename: 'B0FJMF2T4J-Reviews.xlsx', detected_type: 'review', row_count: 203, columns: ['Rating', 'Title', 'Body', 'Date', 'Verified'], quality: '良好' },
      { filename: 'B0FPFZ7XFJ-Reviews.xlsx', detected_type: 'review', row_count: 178, columns: ['Rating', 'Title', 'Body', 'Date', 'Verified'], quality: '良好' },
      { filename: 'B08NCDBT7Q-Reviews.xlsx', detected_type: 'review', row_count: 156, columns: ['Rating', 'Title', 'Body', 'Date', 'Verified'], quality: '良好' },
      { filename: 'B0FBS5L5BY-Reviews.xlsx', detected_type: 'review', row_count: 192, columns: ['Rating', 'Title', 'Body', 'Date', 'Verified'], quality: '良好' },
    ],
    review_summaries: [
      { asin: 'B0FJMF2T4J', total: 203, star_1: 15, star_2: 22, star_3: 38, star_4: 56, star_5: 72, judgment: '✅ 评论充足 · 推荐用于聚类' },
      { asin: 'B0FPFZ7XFJ', total: 178, star_1: 8, star_2: 18, star_3: 35, star_4: 52, star_5: 65, judgment: '✅ 评论充足 · 推荐用于聚类' },
      { asin: 'B08NCDBT7Q', total: 156, star_1: 12, star_2: 24, star_3: 40, star_4: 45, star_5: 35, judgment: '✅ 评论充足 · 推荐用于聚类' },
      { asin: 'B0FBS5L5BY', total: 192, star_1: 6, star_2: 15, star_3: 28, star_4: 58, star_5: 85, judgment: '✅ 评论充足 · 推荐用于聚类' },
    ],
    bsr_summaries: [
      { type_name: '塑料材质饮水机', count: 8, price_range: '$19.99 - $27.99', sales_range: '2900-8000/月' },
      { type_name: '不锈钢材质饮水机', count: 7, price_range: '$29.99 - $45.99', sales_range: '1100-3800/月' },
      { type_name: '智能/旗舰饮水机', count: 5, price_range: '$39.99 - $69.99', sales_range: '600-2600/月' },
    ],
    warnings: ['检测到 2 个 ASIN 评论数不足 50 条，聚类精度可能受影响'],
  },
}

// ═══ Phase -1: 品类机会分析 ═══
// 组件 PhaseNeg1View 需要: dimension_scores[], verdict, summary{monthly_revenue,annual_estimate,machine_count}, total_score{pct}, key_findings[], cross_border_risks[]
const phaseNeg1Result = {
  verdict: '✅ 强烈推荐',
  summary: {
    monthly_revenue: '$1.2M - $1.8M',
    annual_estimate: '$18M - $25M',
    machine_count: 50,
  },
  dimension_scores: [
    { dimension: '市场规模', score: 4.2, rationale: 'BSR Top50 月均 18 万件，年增长 12%' },
    { dimension: '竞争强度', score: 3.0, rationale: 'CR10=55%，头部双寡头但尾部高度分散' },
    { dimension: '利润空间', score: 4.5, rationale: '不锈钢款毛利 46%，滤芯 LTV $125/年' },
    { dimension: '进入壁垒', score: 3.5, rationale: '水泵供应链是关键，其余组件 commoditized' },
    { dimension: '增长趋势', score: 4.0, rationale: '无线+智能细分增速 30%+，引流品类上行' },
    { dimension: '季节波动', score: 3.8, rationale: '宠物用品刚需属性强，月波动 <15%' },
    { dimension: '差异化空间', score: 4.8, rationale: '全不锈钢+静音+易清洗三合一首创' },
    { dimension: '合规风险', score: 4.0, rationale: 'FCC（无线款仅限），常规款无需特殊认证' },
    { dimension: '头部垄断', score: 3.2, rationale: 'PetKit+Catit 占 35%，但无单一品牌 >25%' },
  ],
  total_score: { pct: 78 },
  key_findings: [
    '水泵寿命（23% 差评）、材质安全（18%）、清洁困难（15%）为三大核心痛点，累计覆盖 56% 负面评论',
    '$35-50 区间竞品间距大，消费者愿为不锈钢支付 35% 溢价，是确定性机会带',
    '无线/电池款仅 2 款产品在售，品类 12% 搜索词已指向 wireless/battery，蓝海信号明确',
    '滤芯订阅模式可构建持续收入，预估 LTV $125/用户/年',
  ],
  cross_border_risks: [
    '无线款需 FCC 认证，周期 4-6 周，建议提前布局',
    'FDA 食品接触材料认证建议同步推进（不锈钢产品 + 滤芯）',
  ],
}

// ═══ Phase 1: 双线标签 ═══
// View 组件 Phase1View 需要: combined_summary.review_stats{total,sentiment{positive_pct,negative_pct},opportunity_rate,top_problems[{rank,type,pct}]}, combined_summary.bsr_stats{brand_cr3,listing_types[{type,count}],top_features[{feature,penetration_pct}]}
const phase1Result = {
  combined_summary: {
    review_stats: {
      total: 729,
      sentiment: { positive_pct: 62, negative_pct: 23, neutral_pct: 15 },
      opportunity_rate: 47,
      top_problems: [
        { rank: 1, type: '水泵噪音/故障', pct: 23.1 },
        { rank: 2, type: '塑料生物膜/异味', pct: 18.2 },
        { rank: 3, type: '拆洗步骤繁琐', pct: 14.8 },
        { rank: 4, type: '滤芯价格/更换频率', pct: 12.5 },
        { rank: 5, type: '电源线太短', pct: 8.9 },
      ],
    },
    bsr_stats: {
      brand_cr3: 35,
      listing_types: [
        { type: '塑料饮水机', count: 24 },
        { type: '不锈钢饮水机', count: 18 },
        { type: '陶瓷/高端', count: 5 },
        { type: '无线/电池', count: 2 },
        { type: '智能/App', count: 3 },
      ],
      top_features: [
        { feature: '静音设计', penetration_pct: 88 },
        { feature: '多重过滤', penetration_pct: 82 },
        { feature: 'LED指示灯', penetration_pct: 71 },
        { feature: '多模式水流', penetration_pct: 58 },
        { feature: '不锈钢材质', penetration_pct: 36 },
        { feature: '洗碗机可洗', penetration_pct: 14 },
        { feature: '无线/USB-C', penetration_pct: 8 },
      ],
    },
  },
}

// ═══ Phase 2: 聚类分析 ═══
// View 组件 Phase2View 需要: painpoint_clusters.clusters[{id,name,category,frequency,pct,severity,sample_quotes[]}], painpoint_clusters.causality_chains[], market_clusters.key_metrics{price_median,top3_concentration_pct}, market_clusters.market_clusters[]
const phase2Result = {
  painpoint_clusters: {
    clusters: [
      { id: 'C1', name: '水泵噪音/故障', category: '功能', frequency: 168, pct: 23.1, severity: 4.6, sample_quotes: ['"用了不到4个月水泵就开始刺耳的噪音，然后彻底不工作了。"'],
        evidences: [
          { source: 'B0FBS5L5BY', rating: 1, quote: 'The pump started buzzing louder than a microwave. I have to unplug it at night.' },
          { source: 'B08NCDBT7Q', rating: 2, quote: 'Whisper quiet first week, now sounds like a mini fridge.' },
          { source: 'B0FJMF2T4J', rating: 3, quote: 'The humming is low but never stops. Noticeable in a quiet room.' },
        ] },
      { id: 'C2', name: '塑料生物膜/异味', category: '体验', frequency: 133, pct: 18.2, severity: 4.3, sample_quotes: ['"塑料表面三天就有一层滑滑的东西，洗都洗不掉。"'],
        evidences: [
          { source: 'B0FBS5L5BY', rating: 2, quote: 'After 3 weeks there is green algae inside the pump — impossible to clean' },
          { source: 'B08NCDBT7Q', rating: 1, quote: 'Black mold in water tank seams. Disgusting.' },
          { source: 'B0FPFZ7XFJ', rating: 2, quote: 'Filter gets slimy even with weekly cleaning. Returned.' },
        ] },
      { id: 'C3', name: '拆洗步骤繁琐', category: '体验', frequency: 108, pct: 14.8, severity: 3.9, sample_quotes: ['"每次清洗要拆8个零件，泵腔根本清洁不到。"'] },
      { id: 'C4', name: '滤芯价格抱怨', category: '成本', frequency: 91, pct: 12.5, severity: 3.2, sample_quotes: ['"滤芯三个月换一次，一年下来比机器还贵。"'],
        evidences: [
          { source: 'B08NCDBT7Q', rating: 1, quote: 'Filter replacements cost more than the fountain itself over a year. $15/month is insane.' },
          { source: 'B0FBS5L5BY', rating: 2, quote: 'Proprietary filter is a trap. Generic ones don\'t fit.' },
          { source: 'B0FPFZ7XFJ', rating: 2, quote: 'Filter needs changing every 2 weeks not 4 as advertised.' },
        ] },
      { id: 'C5', name: '猫痤疮/材质过敏', category: '体验', frequency: 45, pct: 6.2, severity: 4.8, sample_quotes: ['"猫下巴开始长黑点，兽医说是塑料碗引起的猫痤疮。"'] },
      { id: 'C6', name: '水流飞溅', category: '功能', frequency: 72, pct: 9.9, severity: 3.5, sample_quotes: ['"出水口设计不好，水溅得到处都是。"'] },
    ],
    causality_chains: [
      '塑料材质 → 生物膜滋生 → 清洗困难 → 用户放弃 → 差评/退货',
      '水泵品质差 → 3-6月故障 → Brand差评集中 → 评分断崖 → 排名下滑',
      '滤芯价格高 → 用户不更换 → 水质恶化 → 猫不喝 → 差评',
    ],
  },
  market_clusters: {
    key_metrics: {
      price_median: 29.99,
      top3_concentration_pct: 35,
    },
    market_clusters: [
      { name: '性价比塑料款', count: 24, price_range: '$15-28' },
      { name: '不锈钢升级款', count: 18, price_range: '$29-45' },
      { name: '高端/智能款', count: 8, price_range: '$49-70' },
    ],
  },
}

// ═══ Phase 3: 缺口矩阵 ═══
// View 组件 Phase3View 需要: gap_matrix[{painpoint,intensity,bsr_coverage,is_crowded,is_unfulfilled,opportunity_type}], opportunity_scores[{rank,name,total_score,verdict,scores}], top3_detail[]
const phase3Result = {
  gap_matrix: [
    { painpoint: '水泵噪音/故障', intensity: '极强', bsr_coverage: '32%', is_crowded: true, is_unfulfilled: true, opportunity_type: '颠覆式机会' },
    { painpoint: '塑料生物膜', intensity: '强', bsr_coverage: '28%', is_crowded: false, is_unfulfilled: true, opportunity_type: '蓝海机会' },
    { painpoint: '拆洗繁琐', intensity: '强', bsr_coverage: '18%', is_crowded: false, is_unfulfilled: true, opportunity_type: '差异化机会' },
    { painpoint: '滤芯成本', intensity: '中', bsr_coverage: '65%', is_crowded: true, is_unfulfilled: false, opportunity_type: '优化机会' },
    { painpoint: '猫痤疮/过敏', intensity: '极强', bsr_coverage: '12%', is_crowded: false, is_unfulfilled: true, opportunity_type: '蓝海机会' },
    { painpoint: '水流飞溅', intensity: '中', bsr_coverage: '45%', is_crowded: true, is_unfulfilled: false, opportunity_type: '优化机会' },
  ],
  opportunity_scores: [
    { rank: 1, name: '全304不锈钢 + 超静音 + 洗碗机三合一', total_score: 88, verdict: '强烈推荐', scores: { 需求强度: 95, 竞争稀疏: 90, 可行性: 75, 利润: 85 } },
    { rank: 2, name: '无线电池款大容量', total_score: 72, verdict: '推荐', scores: { 需求强度: 82, 竞争稀疏: 95, 可行性: 55, 利润: 65 } },
    { rank: 3, name: '陶瓷高端设计款', total_score: 68, verdict: '观望', scores: { 需求强度: 65, 竞争稀疏: 85, 可行性: 80, 利润: 55 } },
    { rank: 4, name: 'App智能监控+滤芯订阅', total_score: 62, verdict: '观望', scores: { 需求强度: 70, 竞争稀疏: 75, 可行性: 60, 利润: 50 } },
  ],
  top3_detail: [
    { rank: 1, name: '全304 + 静音 + 洗碗机', value_proposition: '唯一同时解决三大痛点的产品', product_action: '定制低噪音不锈钢泵体，全曲面无死角设计', listing_suggestion: 'stainless steel cat fountain ultra quiet dishwasher safe', risks: ['水泵供应链质量把控', '不锈钢304真伪检测'] },
    { rank: 2, name: '无线电池款大容量', value_proposition: '摆脱电源线束缚，任意位置摆放', product_action: '低功耗泵 + 10000mAh 锂电池，续航30天', listing_suggestion: 'wireless cat fountain battery operated large capacity', risks: ['续航实测认证', 'FCC认证周期'] },
    { rank: 3, name: '陶瓷高端设计款', value_proposition: '家居装饰品级别的宠物饮水机', product_action: '白/黑/莫兰迪色系陶瓷，北欧简约设计', listing_suggestion: 'ceramic cat fountain aesthetic home decor', risks: ['运输破损率', '重量导致FBA费用高'] },
  ],
}

// ═══ 完整分析状态 ═══
export const demoAnalysisState = (projectId: string) => ({
  project_id: projectId,
  category: '宠物饮水机',
  current_phase: 'phase_3',
  phases: {
    phase_neg1: { completed: true, result: phaseNeg1Result, review_questions: ['品类规模判断是否合理？', '竞争格局分析是否准确？', '风险标注是否遗漏关键项？'] },
    phase_1: { completed: true, result: phase1Result, review_questions: ['评论标签分类是否准确？', 'BSR 卖点渗透率是否符合预期？'] },
    phase_2: { completed: true, result: phase2Result, review_questions: ['痛点聚类是否覆盖主要问题？', '因果关系链是否合理？'] },
    phase_3: { completed: true, result: phase3Result, review_questions: ['缺口识别是否准确？', '建议的优先顺序是否认同？'] },
  },
  conversations: [
    { role: 'user', content: '噪音聚类占比最高，但水泵噪音和水流声是不同的抱怨，能否拆开？', phase: 'phase_2' },
    { role: 'ai', content: '已拆分。水泵机械噪音占 15.2%（电机故障），水流飞溅占 8.1%（出水口设计）。更新后的聚类见左侧面板。', phase: 'phase_2', editApplied: true },
    { role: 'user', content: '「材质安全」标签应拆成「塑料安全」和「不锈钢生锈」，本质是不同的技术问题', phase: 'phase_1' },
    { role: 'ai', content: '已拆分。塑料安全（BPA+生物膜）14.3%，不锈钢非304生锈4.5%但均分仅1.8，是高危信号。', phase: 'phase_1', editApplied: true },
  ],
})

// ═══ 决策轴问题 ═══
export const demoDecisions = {
  questions: [
    { id: 'price_band', label: '目标价位', type: 'single', options: [{ value: 'budget', label: '$25-35 大众价位' }, { value: 'mid', label: '$35-50 中端价位（推荐）' }, { value: 'premium', label: '$50-70 高端价位' }] },
    { id: 'material', label: '核心材质', type: 'single', options: [{ value: 'full_ss', label: '全304不锈钢（推荐）' }, { value: 'ss_top', label: '不锈钢顶+塑料机身' }, { value: 'plastic', label: '全塑料' }] },
    { id: 'capacity', label: '水箱容量', type: 'single', options: [{ value: '2l', label: '2-2.5L（小户型）' }, { value: '3l', label: '2.5-3.5L（主流推荐）' }] },
    { id: 'differentiator', label: '核心差异化', type: 'multi', options: [{ value: 'quiet', label: '超静音 <25dB' }, { value: 'dishwasher', label: '全机洗碗机清洗' }, { value: 'wireless', label: '无线电池款' }] },
  ],
}

// ═══ Brief 数据 ═══
const briefMarkdown = `# 宠物智能饮水机 Product Brief

## 一、产品定位

**AquaPure S1** — 全304不锈钢超静音智能宠物饮水机。面向注重宠物健康和家居品质的中高端猫/小型犬主人。

## 二、目标用户画像

| 维度 | 描述 |
|------|------|
| 年龄 | 25-40 岁 |
| 居住 | 城市公寓/合租 |
| 宠物 | 1-3 只猫或小型犬 |
| 消费力 | 愿为品质支付溢价（$35-50） |
| 核心诉求 | 卫生安全 > 静音 > 易清洁 > 外观设计 |

## 三、核心功能规格

### 3.1 材质
- 水箱：**全304食品级不锈钢**，无塑料接触水面
- 滤芯：活性炭 + 离子交换树脂 + 无纺布三层结构

### 3.2 水泵
- 静音直流无刷泵，工作噪音 **≤25dB**
- 预期寿命 **≥8000 小时**（约 2 年连续运行）
- 模块化快拆设计

### 3.3 容量与尺寸
- 有效容量 **3.0L**，适配 1-3 只猫连续使用 5-7 天
- 占地面积约 A4 纸大小

### 3.4 清洁设计
- **一键拆卸**：按压式卡扣，3 秒拆解为 5 个模块
- **整机洗碗机安全**

### 3.5 智能功能
- 水量视窗 + LED 三色水位提醒
- 滤芯寿命计时
- 支持 USB-C 供电（5V/2A），标配 2m 编织线

## 四、竞品对比

| 特性 | AquaPure S1 | PetKit 3.2L | NPET SS 3.2L | WonderCreature SS |
|------|-------------|-------------|--------------|-------------------|
| 材质 | 全304SS | 塑料 | 304SS | SS顶+塑料身 |
| 噪音 | ≤25dB | ≤30dB | ≤35dB | ≤30dB |
| 洗碗机安全 | 全机 | 否 | 部分 | 否 |
| 水泵可拆卸 | 是 | 否 | 否 | 否 |
| 建议零售价 | $44.99 | $25.99 | $35.99 | $29.99 |

## 五、成本结构估算

| 项目 | 单件成本 |
|------|----------|
| 304不锈钢水箱+上盖 | $5.20 |
| 静音直流泵模组 | $3.80 |
| 三层滤芯（含初装） | $1.50 |
| PCB + LED + 传感器 | $2.10 |
| 包装与说明书 | $1.40 |
| **BOM 合计** | **$14.00** |
| 组装与质检 | $3.00 |
| **出厂成本** | **$17.00** |

目标 FBA 全链成本 $22-24，建议零售 $44.99，毛利率约 46%。

## 六、滤芯订阅模式

- 建议更换周期：3-4 周
- 单支滤芯零售价：$7.99（3 支装 $19.99）
- 预计 LTV：第一年 $45（主机）+ $80（滤芯）= $125

## 七、风险与缓解

| 风险 | 概率 | 缓解措施 |
|------|------|----------|
| 水泵早期故障率超标 | 中 | 供应商 MTBF≥8000h 测试报告，首批 100% 老化测试 |
| 不锈钢材质争议 | 低 | 第三方 SGS 304 认证 + 包装内附检测报告二维码 |
| USB-C PD 协议兼容 | 中 | 标准 5V/2A 协议，避免 PD/PPS 握手 |

## 八、上市策略

1. **首月**：Vine 计划 30 件送测 + 宠物类 KOL 5 人深度测评
2. **Listing 关键词**：stainless steel cat fountain / ultra quiet pet fountain / dishwasher safe water fountain
3. **定价策略**：首发 $39.99，第 3 个月回调至 $44.99

---

*Brief v3 | Agent A 生成 · Agent B 审查通过 | 2026-07-02*
`

export const demoBrief = {
  brief: briefMarkdown,
  version_history: [
    { version: 1, role: 'agent_a', action: '生成初版 Brief', content: null },
    { version: 2, role: 'agent_b', action: '审查 Brief', content: '建议补充物流费用、增加多宠家庭细分、包装差异化' },
    { version: 3, role: 'agent_a', action: '修订 Brief', content: null },
    { version: 4, role: 'agent_b', action: '审查通过', content: '所有问题已解决。' },
  ],
  lock_line: '全304不锈钢超静音智能宠物饮水机 · $35-50中端价位 · 3.0L容量',
  lock_decisions: {
    price_band: '$35-50 中端价位',
    material: '全304不锈钢',
    capacity: '2.5-3.5L（主流）',
    differentiator: '超静音<25dB + 全机洗碗机清洗',
  },
  questions: [
    { axis: 'price_band', question: '目标价位？', options: [{ label: '$25-35 大众价位' }, { label: '$35-50 中端价位（推荐）', recommended: true }, { label: '$50-70 高端价位' }] },
    { axis: 'material', question: '核心材质？', options: [{ label: '全304不锈钢（推荐）', recommended: true }, { label: '不锈钢顶+塑料机身' }] },
    { axis: 'capacity', question: '水箱容量？', options: [{ label: '2-2.5L' }, { label: '2.5-3.5L（主流推荐）', recommended: true }] },
  ],
}

export const demoChatMessages = [
  { role: 'user', content: '价格 $44.99 的依据是什么？竞品都在 $25-35 怎么说服消费者？' },
  { role: 'ai', content: '三点依据：1）不锈钢款均价 $35-45，我们三项独有合理溢价 20%；2）目标用户核心诉求是卫生安全>价格；3）滤芯订阅可降低主机定价，已预留 $39.99 首发弹性。' },
  { role: 'user', content: '能在包装里加静音分贝对比卡吗？' },
  { role: 'ai', content: '已在上市策略中补充：包装内附「静音实验室认证卡」— 正面为 25dB 实测频谱图，背面为竞品对比表。同时可制短视频嵌入 A+ 页面。' },
]

export const demoBriefChat = { conversations: demoChatMessages }

export function demoChatReply(): string {
  const replies = [
    '收到你的意见。在演示模式中，这通常会触发 AI 重新分析并更新左侧面板。实际产品中，你会在 30-60 秒内看到更新结果。',
    '这个方向很有价值。如果是真实场景，我会调用 LLM 根据你的反馈重新运行当前 Phase 的 analysis。',
    '已记录你的审查意见。完整版中确认后会保存到 Review Memory 供后续参考。',
  ]
  return replies[Math.floor(Math.random() * replies.length)]
}


// ════════════════════════════════════════════════════════════════════
//  新增 Portfolio 亮点数据
// ════════════════════════════════════════════════════════════════════

// ── Run Trace ──
export const traceEntries = [
  {
    id: 'trace-neg1',
    phase: 'Phase -1',
    label: '品类判断',
    agent: 'category-judge',
    input: 'BSR Top 50 (Cat_Fountains_BSR50_汇总.xlsx)',
    output: '维度评分 × 4, 市场规模估算, 进入建议',
    duration_ms: 2840,
    mock: true,
    status: 'success',
  },
  {
    id: 'trace-1a',
    phase: 'Phase 1A',
    label: '评论标签',
    agent: 'review-tagger',
    input: '4× ASIN reviews (729 条)',
    output: '痛点 × 18, 需求 × 12, 机会信号 × 7',
    duration_ms: 4100,
    mock: true,
    status: 'success',
  },
  {
    id: 'trace-1b',
    phase: 'Phase 1B',
    label: 'BSR 标签',
    agent: 'bsr-tagger',
    input: 'BSR Top 50',
    output: 'Listing 类型 × 9, 卖点聚类 × 7, 价格带 × 3',
    duration_ms: 2800,
    mock: true,
    status: 'success',
  },
  {
    id: 'trace-2a',
    phase: 'Phase 2A',
    label: '痛点聚类',
    agent: 'cluster-analyst',
    input: '18 个标签 + 729 条原文',
    output: '痛点簇 × 9, 因果链 × 3, 覆盖关系 × 2',
    duration_ms: 3500,
    mock: true,
    status: 'success',
  },
  {
    id: 'trace-2b',
    phase: 'Phase 2B',
    label: '市场聚类',
    agent: 'cluster-analyst',
    input: '7 个标签 + BSR Top 50',
    output: '市场簇 × 9, 关键指标 × 5',
    duration_ms: 2200,
    mock: true,
    status: 'success',
  },
  {
    id: 'trace-3',
    phase: 'Phase 3',
    label: '缺口矩阵',
    agent: 'gap-scorer',
    input: '痛点簇 × 9 + 市场簇 × 9',
    output: '缺口矩阵 9×9, 机会评分, Top 3 机会',
    duration_ms: 3100,
    mock: true,
    status: 'success',
  },
  {
    id: 'trace-brief0',
    phase: 'Brief-0',
    label: '头脑风暴',
    agent: 'brainstormer',
    input: '缺口矩阵 + Top 3 机会',
    output: '5 轴 × 4 选项',
    duration_ms: 1900,
    mock: true,
    status: 'success',
  },
  {
    id: 'trace-brief1',
    phase: 'Brief-1',
    label: 'Agent A 生成',
    agent: 'brief-writer',
    input: '锁定方向 + 竞品数据包',
    output: '12 章 Product Brief',
    duration_ms: 5200,
    mock: true,
    status: 'success',
  },
  {
    id: 'trace-brief2',
    phase: 'Brief-2',
    label: 'Agent B 审查',
    agent: 'brief-reviewer',
    input: 'Agent A Brief v1',
    output: '审查报告 (高 1 / 中 3 / 低 2)',
    duration_ms: 2700,
    mock: true,
    status: 'success',
  },
  {
    id: 'trace-brief3',
    phase: 'Brief-3',
    label: '自动修改',
    agent: 'brief-writer',
    input: '审查报告 + Brief v1',
    output: 'Brief v2 (高 0 / 中 1 / 低 2)',
    duration_ms: 4100,
    mock: true,
    status: 'success',
  },
]

// ── Evaluation: 3 品类对比 ──
export const evaluationCategories = [
  {
    name: '宠物饮水机',
    projectId: 'demo-pet-fountain',
    scores: {
      painpoint_coverage: 0.82,
      brief_completeness: 0.88,
      red_risks: 1,
      confirm_count: 13,
      cluster_quality: 0.76,
      source_traceability: 0.91,
      decision_documentation: 0.85,
    },
    summary: 'BSR 50 + 4 ASIN 评论, 数据驱动覆盖率高, 静电/水质/清洁三大机会明确',
  },
  {
    name: '车载手机支架',
    projectId: 'demo-phone-holder',
    scores: {
      painpoint_coverage: 0.71,
      brief_completeness: 0.65,
      red_risks: 3,
      confirm_count: 8,
      cluster_quality: 0.68,
      source_traceability: 0.73,
      decision_documentation: 0.55,
    },
    summary: 'BSR 30 + 3 ASIN 评论, 吸盘老化 + 磁吸兼容性为 Top 2 风险, Brief 需补充 CE/FCC 合规',
  },
  {
    name: '瑜伽垫',
    projectId: 'demo-yoga-mat',
    scores: {
      painpoint_coverage: 0.94,
      brief_completeness: 0.91,
      red_risks: 0,
      confirm_count: 21,
      cluster_quality: 0.89,
      source_traceability: 0.95,
      decision_documentation: 0.92,
    },
    summary: 'BSR 100 + 8 ASIN 评论, 气味/耐用性/防滑三层验证, 6 轮迭代后所有 🔴 清零',
  },
]

export const evaluationDimensions = [
  { key: 'painpoint_coverage', label: '痛点覆盖率', unit: '%', desc: 'Top 10 痛点是否有评论证据' },
  { key: 'brief_completeness', label: 'Brief 完整度', unit: '%', desc: '12 章全含 + 锁定方向引用' },
  { key: 'red_risks', label: '红色风险', unit: 'qty', desc: 'Agent B 审查 🔴 高优问题数' },
  { key: 'confirm_count', label: '人工确认', unit: 'qty', desc: '决策轴 + 审核卡点操作次数' },
  { key: 'cluster_quality', label: '聚类质量', unit: '%', desc: '簇内一致性 + 跨簇独立性' },
  { key: 'source_traceability', label: '来源可溯', unit: '%', desc: '结论可追溯到原文的比例' },
  { key: 'decision_documentation', label: '决策记录', unit: '%', desc: '方向锁定 + 验证节点的文档化率' },
]

// ── Evidence 标注数据 (附在聚类上) ──
export const evidenceAnnotations = {
  'C1': [
    { source: 'B0FBS5L5BY', rating: 2, quote: 'After 3 weeks there is green algae inside the pump — impossible to clean' },
    { source: 'B08NCDBT7Q', rating: 1, quote: 'Black mold in water tank seams. Disgusting.' },
    { source: 'B0FPFZ7XFJ', rating: 2, quote: 'Filter gets slimy even with weekly cleaning. Returned.' },
  ],
  'C2': [
    { source: 'B0FBS5L5BY', rating: 1, quote: 'The pump started buzzing louder than a microwave. I have to unplug it at night.' },
    { source: 'B08NCDBT7Q', rating: 2, quote: 'Whisper quiet first week, now sounds like a mini fridge.' },
    { source: 'B0FJMF2T4J', rating: 3, quote: 'The humming is low but never stops. Noticeable in a quiet room.' },
  ],
  'C3': [
    { source: 'B08NCDBT7Q', rating: 1, quote: 'Filter replacements cost more than the fountain itself over a year. $15/month is insane.' },
    { source: 'B0FBS5L5BY', rating: 2, quote: 'Proprietary filter is a trap. Generic ones don\'t fit.' },
    { source: 'B0FPFZ7XFJ', rating: 2, quote: 'Filter needs changing every 2 weeks not 4 as advertised.' },
  ],
}

// ── Prompt Schema 数据 ──
export const agentSchemas = [
  {
    agent: 'Category Judge (Phase -1)',
    input_schema: {
      bsr_summary: 'string — BSR Top N 摘要文本',
      category: 'string — 品类名',
    },
    output_schema: {
      dimension_scores: '{ dimension, score, rationale }[]',
      verdict: '"强烈推荐" | "谨慎进入" | "不建议"',
      summary: '{ monthly_revenue, annual_estimate, machine_count }',
      key_findings: 'string[]',
      cross_border_risks: '{ risk, severity }[]',
    },
    system_prompt_snippet: '"你是 Amazon 品类分析专家。你需要在数据不足时诚实标注，在数据充足时给出高置信度判断。"',
  },
  {
    agent: 'Review Tagger (Phase 1A)',
    input_schema: {
      review_texts: 'string — 评论摘要文本',
      category: 'string',
    },
    output_schema: {
      pain_point_tags: '{ tag, frequency, severity, sample_quotes }[]',
      need_tags: '{ tag, evidence }[]',
      opportunity_signals: '{ signal, confidence }[]',
    },
    system_prompt_snippet: '"你将每条评论标注为:\n1. 痛点 (Pain Point): 用户明确抱怨或产品缺陷\n2. 需求 (Need): 用户期望但未被满足\n3. 机会信号 (Opportunity): 竞品未覆盖的差异化空间"',
  },
  {
    agent: 'Brief Writer — Agent A (Brief-1)',
    input_schema: {
      locked_direction: 'string — Phase 0 锁定摘要',
      painpoint_map: 'Cluster[] — 聚类结果',
      market_map: 'MarketCluster[] — 市场格局',
      competitor_data: 'string — BSR 摘要',
    },
    output_schema: {
      brief: 'string — 12 章 Markdown Product Brief',
      chapters: '["Executive Summary", "Target User", "MVP Scope", "Must-have Features", "Nice-to-have", "BOM Estimate", "Pricing Strategy", "Launch Plan", "Risk Register", "Differentiation", "Packaging", "A+ Content Outline"]',
    },
    system_prompt_snippet: '"你是资深产品经理。你的 Product Brief 必须:\n1. 首行引用 Phase 0 锁定方向\n2. 每个 Must-have 对应一个痛点证据\n3. MVP 范围不超 Phase 0 约束\n4. 不确定处写「需要进一步验证」"',
  },
  {
    agent: 'Brief Reviewer — Agent B (Brief-2)',
    input_schema: {
      brief: 'string — Agent A 输出',
      scoring_rules: '{ dimension, weight, threshold }[]',
    },
    output_schema: {
      review: 'string — 审查报告 Markdown',
      issues: '{ high, medium, low } — 计数',
    },
    system_prompt_snippet: '"你是首席产品架构师。你审查 Product Brief 的 8 个维度:\n1. 方向一致性 2. 痛点证据 3. MVP 合理性 4. 定价逻辑 5. 合规风险 6. 可执行性 7. 差异化清晰度 8. 数据引用\n每个维度给 🔴🟡🟢 三档，附具体建议。"',
  },
]
