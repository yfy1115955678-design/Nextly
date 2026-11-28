import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader, StatusBadge } from '../components/PagePrimitives'
import { listProjectFiles, uploadProjectFile, type ProjectFileRecord } from '../lib/api'
import {
  addProductAsset,
  removeProductAsset,
  confirmVersion,
  createVersion,
  currentVersion,
  getProjectWorkspace,
  versionPath,
  type ProjectWorkspaceState,
  getVersion,
  getVersionDiff,
  saveBom,
  saveDefinition,
  saveDevelopmentIssues,
  saveExperienceFlows,
  savePersonas,
  saveQualityStandards,
  saveRequirements,
  saveRisks,
  type BomItem,
  type DevelopmentIssue,
  type ExperienceFlow,
  type ProductDefinition,
  type ProductPersona,
  type ProductRequirement,
  type ProductRisk,
  type ProductVersionDetail,
  type QualityStandard,
} from '../lib/productApi'

type TabKey = 'definition' | 'personas' | 'requirements' | 'issues' | 'experience' | 'bom' | 'quality' | 'risks' | 'assets'

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'definition', label: '基本信息' },
  { key: 'personas', label: '用户画像' },
  { key: 'requirements', label: '产品需求' },
  { key: 'issues', label: '开发问题' },
  { key: 'experience', label: '体验流程' },
  { key: 'bom', label: 'BOM 与报价' },
  { key: 'quality', label: '质量与合规' },
  { key: 'risks', label: '风险管理' },
  { key: 'assets', label: '产品资料' },
]

const emptyDefinition: ProductDefinition = {
  product_name: '',
  sku: '',
  specification_summary: '',
  category: '',
  product_type: '',
  priority: 'P1',
  planned_launch_date: null,
  positioning: '',
  market_entry: '',
  target_price_min: null,
  target_price_max: null,
  target_price_currency: 'USD',
  target_contribution: null,
  pricing_strategy: '',
  certification_requirements: '',
  warranty_policy: '',
  summary: '',
}

const EditorMode = createContext({ editing: false, locked: true, reading: false, begin: () => {}, cancel: () => {} })

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  type = 'text',
  disabled = false,
}: {
  label: string
  value: string | number | null | undefined
  onChange: (value: string) => void
  placeholder?: string
  multiline?: boolean
  type?: string
  disabled?: boolean
}) {
  const { reading } = useContext(EditorMode)
  if (reading) return <div className="definition-field local-read-field"><span>{label}</span><div>{value == null || value === '' ? '—' : value}</div></div>
  return (
    <label className="definition-field">
      <span>{label}</span>
      {multiline ? (
        <textarea rows={3} value={value ?? ''} placeholder={placeholder} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input type={type} value={value ?? ''} placeholder={placeholder} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const { reading } = useContext(EditorMode)
  if (reading) return <div className="definition-field local-read-field"><span>{label}</span><div>{options.find(o => o.value === value)?.label || value || '—'}</div></div>
  return (
    <label className="definition-field">
      <span>{label}</span>
      <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
      </select>
    </label>
  )
}

function EditorSection({
  title,
  description,
  children,
  onSave,
  saving,
  readOnly,
}: {
  title: string
  description: string
  children: React.ReactNode
  onSave: () => void
  saving: boolean
  readOnly: boolean
}) {
  const mode = useContext(EditorMode)
  return (
    <section className="definition-editor-section">
      <div className="definition-editor-heading">
        <div><h2>{title}</h2><p>{description}</p></div>
        {!mode.locked && <div className="project-actions">{mode.editing ? <><button className="secondary-button" disabled={saving} onClick={mode.cancel}>取消</button><button className="primary-button" disabled={saving || readOnly} onClick={onSave}>{saving ? '保存中…' : '保存本节'}</button></> : <button className="secondary-button" disabled={saving} onClick={mode.begin}>编辑本节</button>}</div>}
      </div>
      <fieldset disabled={readOnly || saving} className={'definition-fieldset' + (mode.reading ? ' local-readonly' : '')}>{children}</fieldset>
    </section>
  )
}

function patchList<T>(items: T[], index: number, patch: Partial<T>): T[] {
  return items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)
}

function numberOrNull(value: string): number | null {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function statusLabel(status: ProductVersionDetail['version']['status']) {
  if (status === 'draft') return '编辑中'
  if (status === 'confirmed') return '已确认'
  return '已被新版本替代'
}

export default function ProductVersionEditorPage() {
  const { projectId = '', versionId = '' } = useParams()
  const [workspace, setWorkspace] = useState<ProjectWorkspaceState | null>(null)
  const [editing, setEditing] = useState(false)
  const [detail, setDetail] = useState<ProductVersionDetail | null>(null)
  const [definition, setDefinition] = useState<ProductDefinition>(emptyDefinition)
  const [personas, setPersonas] = useState<ProductPersona[]>([])
  const [requirements, setRequirements] = useState<ProductRequirement[]>([])
  const [issues, setIssues] = useState<DevelopmentIssue[]>([])
  const [flows, setFlows] = useState<ExperienceFlow[]>([])
  const [bom, setBom] = useState<BomItem[]>([])
  const [quality, setQuality] = useState<QualityStandard[]>([])
  const [risks, setRisks] = useState<ProductRisk[]>([])
  const [assets, setAssets] = useState<ProductVersionDetail['assets']>([])
  const [projectFiles, setProjectFiles] = useState<ProjectFileRecord[]>([])
  const [assetRole, setAssetRole] = useState('reference')
  const [assetCaption, setAssetCaption] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('definition')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [diff, setDiff] = useState<string | null>(null)

  const locked = detail?.version.status !== 'draft'
  const readOnly = locked || (!editing && activeTab !== 'assets')
  useEffect(() => {
    if (!editing && !saving) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [editing, saving])

  const refresh = useCallback(async () => {
    if (!versionId) return
    setLoading(true)
    try {
      const result = await getVersion(versionId)
      if (result.project.id !== projectId) throw new Error('此版本不属于当前项目。')
      const [files, scope] = await Promise.all([listProjectFiles(projectId), getProjectWorkspace(projectId)])
      setWorkspace(scope)
      setDetail(result)
      setProjectFiles(files)
      setAssets(result.assets)
      setDefinition({ ...emptyDefinition, ...(result.definition ?? {}) })
      setPersonas(result.personas.map(({ id, ...item }) => item))
      setRequirements(result.requirements.map(({ id, ...item }) => item))
      setIssues(result.development_issues.map(({ id, ...item }) => item))
      setFlows(result.experience_flows.map(({ flow, steps }) => ({
        ...flow,
        steps: steps.map(({ step, bom_item_codes }) => ({
          ...step,
          bom_item_codes,
        })),
      })))
      setBom(result.bom_items.map(({ item, parent_item_code, quotes }) => ({
        ...item,
        parent_item_code,
        quotes,
      })))
      setQuality(result.quality_standards.map(({ id, ...item }) => item))
      setRisks(result.risks.map(({ id, ...item }) => item))
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '产品定义读取失败')
    } finally {
      setLoading(false)
    }
  }, [projectId, versionId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const saveSection = async (action: () => Promise<unknown>, label: string) => {
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await action()
      setEditing(false)
      await refresh()
      setNotice(label + '已保存。')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : label + '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleAssetUpload = async (file?: File) => {
    if (!file || !detail || readOnly) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const uploaded = await uploadProjectFile(detail.project.id, file)
      await addProductAsset(versionId, {
        file_id: uploaded.id,
        asset_role: assetRole,
        caption: assetCaption.trim() || uploaded.original_name,
        sort_order: assets.length,
      })
      setAssetCaption('')
      setNotice('文件已上传并关联到当前产品版本。')
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '文件上传失败')
    } finally {
      setSaving(false)
    }
  }

  const handleAssetRemove = async (assetId: string) => {
    if (!window.confirm('从当前版本移除这份资料？项目文件本身不会被删除。')) return
    setSaving(true)
    setError('')
    try {
      await removeProductAsset(versionId, assetId)
      setAssets(assets.filter((asset) => asset.id !== assetId))
      setNotice('资料关联已移除，原文件仍保留在项目文件库。')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '资料移除失败')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirm = async () => {
    if (editing) return
    const rationale = window.prompt('确认当前定义快照。请输入确认依据或仍待验证的事项（不代表批准量产）。', '')
    if (rationale === null) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await confirmVersion(versionId, {
        decision_type: 'continue',
        outcome: '确认产品定义快照 v' + detail?.version.version_number,
        rationale: rationale.trim(),
      })
      setNotice('版本已确认，历史快照已保存。')
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '版本确认失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDiff = async () => {
    setError('')
    try {
      const result = await getVersionDiff(versionId)
      setDiff(JSON.stringify(result, null, 2))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '版本差异读取失败')
    }
  }

  const cancelEdit = () => {
    if (!window.confirm('放弃本节尚未保存的修改？')) return
    setEditing(false)
    void refresh()
  }
  const selectTab = (tab: TabKey) => {
    if (tab === activeTab || saving) return
    if (editing) {
      if (!window.confirm('本节正在编辑。放弃尚未保存的修改并切换？')) return
      setEditing(false)
      void refresh()
    }
    setActiveTab(tab)
  }
  const openVersion = (id: string) => {
    if (id !== versionId) window.location.assign(versionPath(projectId, id))
  }
  const currentConcept = workspace?.concepts.find(c => c.concept.id === detail?.concept.id)
  const currentVariant = currentConcept?.variants.find(v => v.variant.id === detail?.variant.id)
  const createDraft = async (variantId: string) => {
    const change = window.prompt('新版本修改说明', '基于上一版本修订')
    if (change === null) return
    setSaving(true); setError('')
    try {
      const next = await createVersion(variantId, change)
      setSaving(false)
      window.location.assign(versionPath(projectId, next.id))
    } catch (e) { setError(e instanceof Error ? e.message : '新版本创建失败'); setSaving(false) }
  }
  if (!loading && !detail) return <div className="page-stack"><div role="alert" className="workspace-alert error">{error || '版本不存在'}</div><a href={'/projects/' + projectId + '/product-definition'}>返回产品矩阵</a></div>

  if (loading && !detail) {
    return <div className="page-stack"><div className="workspace-empty">正在读取产品定义…</div></div>
  }

  return (
    <div className="page-stack">
      <PageHeader
        step="产品定义"
        title={detail?.concept.name || '产品定义'}
        description={[detail?.variant.name, 'v' + detail?.version.version_number].filter(Boolean).join(' / ')}
        actions={
          <>
            <StatusBadge tone={detail?.version.status === 'draft' ? 'warning' : detail?.version.status === 'confirmed' ? 'success' : 'neutral'}>{detail ? statusLabel(detail.version.status) : '读取中'}</StatusBadge>
            {editing || saving ? <button className="secondary-button" disabled>导出 Excel</button> : <a className="secondary-button" href={'/api/versions/' + versionId + '/export'}>导出 Excel</a>}
            {locked && currentVariant && !currentVariant.versions.some(v => v.status === 'draft') && <button className="primary-button" disabled={saving} onClick={() => void createDraft(currentVariant.variant.id)}>创建修订版</button>}
            {detail?.version.based_on_version_id ? <button className="secondary-button" onClick={() => void handleDiff()}>查看版本差异</button> : null}
            {detail?.version.status === 'draft' ? <button className="primary-button" disabled={saving || editing} onClick={() => void handleConfirm()}>确认定义</button> : null}
          </>
        }
      />

      {error ? <div className="workspace-alert error" role="alert">{error}</div> : null}
      {notice ? <div className="workspace-alert success" role="status">{notice}</div> : null}
      {locked && <div className="read-only-notice">历史快照，只读。可切换到草稿或创建修订版。</div>}
      {detail && workspace && <div className="local-version-bar">
        <label>产品<select value={detail.concept.id} disabled={saving} onChange={e => {
          const selected = workspace.concepts.find(c => c.concept.id === e.target.value)
          const v = selected?.variants.map(x => currentVersion(x.versions)).find(Boolean)
          if (v) openVersion(v.id)
          else window.location.assign('/projects/' + projectId + '/product-definition')
        }}>{workspace.concepts.map(c => <option key={c.concept.id} value={c.concept.id}>{c.concept.name}</option>)}</select></label>
        <label>方案<select value={detail.variant.id} disabled={saving} onChange={e => {
          const v = currentVersion(currentConcept?.variants.find(x => x.variant.id === e.target.value)?.versions || [])
          if (v) openVersion(v.id)
          else window.location.assign('/projects/' + projectId + '/product-definition')
        }}>{currentConcept?.variants.map(v => <option key={v.variant.id} value={v.variant.id}>{v.variant.name}</option>)}</select></label>
        <label>版本<select value={versionId} disabled={saving} onChange={e => openVersion(e.target.value)}>{currentVariant?.versions.map(v => <option key={v.id} value={v.id}>v{v.version_number} · {statusLabel(v.status)}</option>)}</select></label>
        <a className="secondary-button" href={'/projects/' + projectId + '/product-definition'}>方案对比</a>
      </div>}
      {editing && <p className="local-edit-notice">正在编辑本节。保存或取消后可确认版本。</p>}
      {diff ? <section className="panel-card version-diff-panel"><div className="section-title"><h2>版本差异</h2><button className="text-button" onClick={() => setDiff(null)}>收起</button></div><pre>{diff}</pre></section> : null}

      <EditorMode.Provider value={{ editing, locked, reading: !editing && activeTab !== 'assets', begin: () => setEditing(true), cancel: cancelEdit }}>
      <div className="definition-workspace">
        <nav className="definition-tabs" aria-label="产品定义章节">
          {tabs.map((tab) => <button key={tab.key} className={activeTab === tab.key ? 'active' : ''} disabled={saving} onClick={() => selectTab(tab.key)}>{tab.label}</button>)}
        </nav>

        <div className="definition-editor-content">
          {activeTab === 'definition' ? (
            <EditorSection title="产品基本信息与商业定位" description="先确定产品是什么、面向谁、以什么价格进入市场。" onSave={() => void saveSection(() => saveDefinition(versionId, {...definition, planned_launch_date: definition.planned_launch_date || null}), '基本信息')} saving={saving} readOnly={readOnly}>
              <div className="definition-form-grid">
                <Field label="产品名称" value={definition.product_name} onChange={(value) => setDefinition({ ...definition, product_name: value })} placeholder="产品名称" />
                <Field label="SKU" value={definition.sku} onChange={(value) => setDefinition({ ...definition, sku: value })} placeholder="内部 SKU" />
                <Field label="产品品类" value={definition.category} onChange={(value) => setDefinition({ ...definition, category: value })} placeholder="例如：Slime & Putty Set" />
                <Field label="产品类型" value={definition.product_type} onChange={(value) => setDefinition({ ...definition, product_type: value })} placeholder="套装 / 单品 / DIY" />
                <SelectField label="开发优先级" value={definition.priority || 'P1'} options={[{ value: 'P0', label: 'P0 · 最高' }, { value: 'P1', label: 'P1 · 常规' }, { value: 'P2', label: 'P2 · 储备' }]} onChange={(value) => setDefinition({ ...definition, priority: value as ProductDefinition['priority'] })} />
                <Field label="计划上市日期" type="date" value={definition.planned_launch_date} onChange={(value) => setDefinition({ ...definition, planned_launch_date: value || null })} />
                <Field label="目标售价下限" type="number" value={definition.target_price_min} onChange={(value) => setDefinition({ ...definition, target_price_min: numberOrNull(value) })} placeholder="39.99" />
                <Field label="目标售价上限" type="number" value={definition.target_price_max} onChange={(value) => setDefinition({ ...definition, target_price_max: numberOrNull(value) })} placeholder="59.99" />
                <Field label="价格币种" value={definition.target_price_currency} onChange={(value) => setDefinition({ ...definition, target_price_currency: value.toUpperCase().slice(0, 3) })} placeholder="USD" />
                <Field label="目标贡献值" type="number" value={definition.target_contribution} onChange={(value) => setDefinition({ ...definition, target_contribution: numberOrNull(value) })} placeholder="可选" />
              </div>
              <Field label="产品规格摘要" multiline value={definition.specification_summary} onChange={(value) => setDefinition({ ...definition, specification_summary: value })} placeholder="核心配置、尺寸、材质、件数等。" />
              <Field label="产品定位" multiline value={definition.positioning} onChange={(value) => setDefinition({ ...definition, positioning: value })} placeholder="目标人群、核心价值与差异化定位。" />
              <Field label="市场切入策略" multiline value={definition.market_entry} onChange={(value) => setDefinition({ ...definition, market_entry: value })} placeholder="目标市场、竞争位置与切入方式。" />
              <Field label="定价策略" multiline value={definition.pricing_strategy} onChange={(value) => setDefinition({ ...definition, pricing_strategy: value })} placeholder="价格带选择与价格逻辑。" />
              <Field label="认证与合规要求" multiline value={definition.certification_requirements} onChange={(value) => setDefinition({ ...definition, certification_requirements: value })} placeholder="适用标准、测试与资料要求。" />
              <Field label="质保政策" multiline value={definition.warranty_policy} onChange={(value) => setDefinition({ ...definition, warranty_policy: value })} placeholder="售后与质保范围。" />
              <Field label="产品定义摘要" multiline value={definition.summary} onChange={(value) => setDefinition({ ...definition, summary: value })} placeholder="对当前版本产品定义做简要概括。" />
            </EditorSection>
          ) : null}

          {activeTab === 'personas' ? (
            <EditorSection title="用户画像" description="把功能性、情绪性和社会性需求分别记录，保留画像与具体使用场景的关系。" onSave={() => void saveSection(() => savePersonas(versionId, personas), '用户画像')} saving={saving} readOnly={readOnly}>
              {personas.map((persona, index) => (
                <article className="definition-record-card" key={index}>
                  <div className="definition-record-head"><strong>用户画像 {index + 1}</strong><button className="text-button danger-text" disabled={readOnly} onClick={() => setPersonas(personas.filter((_, i) => i !== index))}>移除</button></div>
                  <div className="definition-form-grid">
                    <Field label="画像名称" value={persona.name} onChange={(value) => setPersonas(patchList(personas, index, { name: value }))} />
                    <Field label="用户群体" value={persona.user_group} onChange={(value) => setPersonas(patchList(personas, index, { user_group: value }))} />
                    <Field label="年龄范围" value={persona.age_range} onChange={(value) => setPersonas(patchList(personas, index, { age_range: value }))} />
                    <Field label="购买决策因素" value={persona.purchase_decision_factors} onChange={(value) => setPersonas(patchList(personas, index, { purchase_decision_factors: value }))} />
                  </div>
                  <Field label="用户特征" multiline value={persona.characteristics} onChange={(value) => setPersonas(patchList(personas, index, { characteristics: value }))} />
                  <Field label="使用场景" multiline value={persona.usage_scenario} onChange={(value) => setPersonas(patchList(personas, index, { usage_scenario: value }))} />
                  <div className="definition-form-grid">
                    <Field label="功能性需求" multiline value={persona.functional_needs} onChange={(value) => setPersonas(patchList(personas, index, { functional_needs: value }))} />
                    <Field label="情绪性需求" multiline value={persona.emotional_needs} onChange={(value) => setPersonas(patchList(personas, index, { emotional_needs: value }))} />
                    <Field label="社会性需求" multiline value={persona.social_needs} onChange={(value) => setPersonas(patchList(personas, index, { social_needs: value }))} />
                    <Field label="用户痛点" multiline value={persona.pain_points} onChange={(value) => setPersonas(patchList(personas, index, { pain_points: value }))} />
                  </div>
                </article>
              ))}
              <button className="secondary-button" disabled={readOnly} onClick={() => setPersonas([...personas, { name: '新用户画像', user_group: '待定义', functional_needs: '', emotional_needs: '', social_needs: '', sort_order: personas.length }])}>＋ 添加用户画像</button>
            </EditorSection>
          ) : null}

          {activeTab === 'requirements' ? (
            <EditorSection title="产品需求与验收标准" description="每项需求都要有优先级、来源、验证方法和可执行的验收条件。" onSave={() => void saveSection(() => saveRequirements(versionId, requirements), '产品需求')} saving={saving} readOnly={readOnly}>
              {requirements.map((item, index) => (
                <article className="definition-record-card" key={index}>
                  <div className="definition-record-head"><strong>{item.code || '需求'} · {item.title || '未命名需求'}</strong><button className="text-button danger-text" disabled={readOnly} onClick={() => setRequirements(requirements.filter((_, i) => i !== index))}>移除</button></div>
                  <div className="definition-form-grid">
                    <Field label="需求编号" value={item.code} onChange={(value) => setRequirements(patchList(requirements, index, { code: value }))} placeholder="R-01" />
                    <Field label="需求类型" value={item.requirement_type} onChange={(value) => setRequirements(patchList(requirements, index, { requirement_type: value }))} placeholder="功能 / 性能 / 外观" />
                    <Field label="需求名称" value={item.title} onChange={(value) => setRequirements(patchList(requirements, index, { title: value }))} />
                    <SelectField label="优先级" value={item.priority} options={[{ value: 'P0', label: 'P0 · 必须满足' }, { value: 'P1', label: 'P1 · 重要' }, { value: 'P2', label: 'P2 · 可选' }]} onChange={(value) => setRequirements(patchList(requirements, index, { priority: value as ProductRequirement['priority'] }))} />
                    <Field label="目标值" value={item.target_value} onChange={(value) => setRequirements(patchList(requirements, index, { target_value: value }))} />
                    <Field label="单位" value={item.unit} onChange={(value) => setRequirements(patchList(requirements, index, { unit: value }))} />
                    <Field label="需求来源" value={item.source_nature} onChange={(value) => setRequirements(patchList(requirements, index, { source_nature: value }))} />
                    <Field label="来源引用" value={item.source_reference} onChange={(value) => setRequirements(patchList(requirements, index, { source_reference: value }))} />
                  </div>
                  <Field label="需求说明" multiline value={item.description} onChange={(value) => setRequirements(patchList(requirements, index, { description: value }))} />
                  <Field label="验证方法" multiline value={item.validation_method} onChange={(value) => setRequirements(patchList(requirements, index, { validation_method: value }))} />
                  <Field label="验收标准" multiline value={item.acceptance_criteria} onChange={(value) => setRequirements(patchList(requirements, index, { acceptance_criteria: value }))} />
                </article>
              ))}
              <button className="secondary-button" disabled={readOnly} onClick={() => setRequirements([...requirements, { code: 'R-' + String(requirements.length + 1).padStart(2, '0'), requirement_type: 'functional', title: '', priority: 'P1' }])}>＋ 添加需求</button>
            </EditorSection>
          ) : null}

          {activeTab === 'issues' ? (
            <EditorSection title="开发问题与处理结论" description="记录开发中暴露的问题、出现条件、处理动作和当前结论。" onSave={() => void saveSection(() => saveDevelopmentIssues(versionId, issues), '开发问题')} saving={saving} readOnly={readOnly}>
              {issues.map((item, index) => (
                <article className="definition-record-card" key={index}>
                  <div className="definition-record-head"><strong>{item.issue_code || '开发问题'} · {item.title}</strong><button className="text-button danger-text" disabled={readOnly} onClick={() => setIssues(issues.filter((_, i) => i !== index))}>移除</button></div>
                  <div className="definition-form-grid">
                    <Field label="问题编号" value={item.issue_code} onChange={(value) => setIssues(patchList(issues, index, { issue_code: value }))} />
                    <Field label="问题名称" value={item.title} onChange={(value) => setIssues(patchList(issues, index, { title: value }))} />
                    <Field label="证据性质" value={item.evidence_nature} onChange={(value) => setIssues(patchList(issues, index, { evidence_nature: value }))} />
                    <SelectField label="优先级" value={item.priority} options={[{ value: 'P0', label: 'P0' }, { value: 'P1', label: 'P1' }, { value: 'P2', label: 'P2' }]} onChange={(value) => setIssues(patchList(issues, index, { priority: value as DevelopmentIssue['priority'] }))} />
                    <SelectField label="状态" value={item.status || 'open'} options={[{ value: 'open', label: '待处理' }, { value: 'in_progress', label: '处理中' }, { value: 'resolved', label: '已解决' }, { value: 'deferred', label: '暂缓' }]} onChange={(value) => setIssues(patchList(issues, index, { status: value as DevelopmentIssue['status'] }))} />
                  </div>
                  <Field label="出现情境" multiline value={item.scenario} onChange={(value) => setIssues(patchList(issues, index, { scenario: value }))} />
                  <Field label="开发处理动作" multiline value={item.development_action} onChange={(value) => setIssues(patchList(issues, index, { development_action: value }))} />
                  <Field label="处理结论" multiline value={item.conclusion} onChange={(value) => setIssues(patchList(issues, index, { conclusion: value }))} />
                </article>
              ))}
              <button className="secondary-button" disabled={readOnly} onClick={() => setIssues([...issues, { title: '待记录问题', priority: 'P1', status: 'open' }])}>＋ 添加开发问题</button>
            </EditorSection>
          ) : null}

          {activeTab === 'experience' ? (
            <EditorSection title="体验流程与产品响应" description="按用户操作顺序描述产品响应、感官反馈，并关联对应 BOM 物料编码。" onSave={() => void saveSection(() => saveExperienceFlows(versionId, flows), '体验流程')} saving={saving} readOnly={readOnly}>
              {flows.map((flow, flowIndex) => (
                <article className="definition-record-card" key={flowIndex}>
                  <div className="definition-record-head"><strong>流程 {flowIndex + 1}</strong><button className="text-button danger-text" disabled={readOnly} onClick={() => setFlows(flows.filter((_, i) => i !== flowIndex))}>移除流程</button></div>
                  <Field label="流程名称" value={flow.name} onChange={(value) => setFlows(patchList(flows, flowIndex, { name: value }))} />
                  <Field label="流程目的" multiline value={flow.purpose} onChange={(value) => setFlows(patchList(flows, flowIndex, { purpose: value }))} />
                  <Field label="流程说明" multiline value={flow.description} onChange={(value) => setFlows(patchList(flows, flowIndex, { description: value }))} />
                  {flow.steps.map((step, stepIndex) => (
                    <div className="experience-step-card" key={stepIndex}>
                      <div className="definition-record-head"><strong>步骤 {step.sequence_no}</strong><button className="text-button danger-text" disabled={readOnly} onClick={() => setFlows(patchList(flows, flowIndex, { steps: flow.steps.filter((_, i) => i !== stepIndex) }))}>移除步骤</button></div>
                      <Field label="步骤名称" value={step.title} onChange={(value) => setFlows(patchList(flows, flowIndex, { steps: patchList(flow.steps, stepIndex, { title: value }) }))} />
                      <div className="definition-form-grid">
                        <Field label="用户操作" multiline value={step.user_action} onChange={(value) => setFlows(patchList(flows, flowIndex, { steps: patchList(flow.steps, stepIndex, { user_action: value }) }))} />
                        <Field label="产品响应" multiline value={step.product_response} onChange={(value) => setFlows(patchList(flows, flowIndex, { steps: patchList(flow.steps, stepIndex, { product_response: value }) }))} />
                        <Field label="感官反馈" multiline value={step.sensory_feedback} onChange={(value) => setFlows(patchList(flows, flowIndex, { steps: patchList(flow.steps, stepIndex, { sensory_feedback: value }) }))} />
                        <Field label="验收标准" multiline value={step.acceptance_criteria} onChange={(value) => setFlows(patchList(flows, flowIndex, { steps: patchList(flow.steps, stepIndex, { acceptance_criteria: value }) }))} />
                      </div>
                      <Field label="关联 BOM 编码（多个用英文逗号分隔）" value={step.bom_item_codes.join(', ')} onChange={(value) => setFlows(patchList(flows, flowIndex, { steps: patchList(flow.steps, stepIndex, { bom_item_codes: value.split(',').map((part) => part.trim()).filter(Boolean) }) }))} placeholder="例如：TANK, LID" />
                    </div>
                  ))}
                  <button className="text-button" disabled={readOnly} onClick={() => setFlows(patchList(flows, flowIndex, { steps: [...flow.steps, { sequence_no: flow.steps.length + 1, title: '新步骤', bom_item_codes: [] }] }))}>＋ 添加步骤</button>
                </article>
              ))}
              <button className="secondary-button" disabled={readOnly} onClick={() => setFlows([...flows, { name: '新体验流程', steps: [], sort_order: flows.length }])}>＋ 添加体验流程</button>
            </EditorSection>
          ) : null}

          {activeTab === 'bom' ? (
            <EditorSection title="BOM 与供应商报价" description="按物料层级记录规格、材质、工艺和成本估算；供应商报价单独保留来源与有效期。" onSave={() => void saveSection(() => saveBom(versionId, bom), 'BOM 与报价')} saving={saving} readOnly={readOnly}>
              {bom.map((item, index) => (
                <article className="definition-record-card" key={index}>
                  <div className="definition-record-head"><strong>{item.item_code || '物料'} · {item.name}</strong><button className="text-button danger-text" disabled={readOnly} onClick={() => setBom(bom.filter((_, i) => i !== index))}>移除</button></div>
                  <div className="definition-form-grid">
                    <Field label="物料编码" value={item.item_code} onChange={(value) => setBom(patchList(bom, index, { item_code: value }))} placeholder="ITEM-01" />
                    <Field label="上级物料编码" value={item.parent_item_code} onChange={(value) => setBom(patchList(bom, index, { parent_item_code: value || null }))} placeholder="留空表示顶层物料" />
                    <Field label="物料名称" value={item.name} onChange={(value) => setBom(patchList(bom, index, { name: value }))} />
                    <Field label="物料类别" value={item.category} onChange={(value) => setBom(patchList(bom, index, { category: value }))} />
                    <Field label="数量" type="number" value={item.quantity} onChange={(value) => setBom(patchList(bom, index, { quantity: numberOrNull(value) ?? 0 }))} />
                    <Field label="单位" value={item.unit} onChange={(value) => setBom(patchList(bom, index, { unit: value }))} />
                    <Field label="成本估算" type="number" value={item.unit_cost_estimate} onChange={(value) => setBom(patchList(bom, index, { unit_cost_estimate: numberOrNull(value) }))} />
                    <Field label="币种" value={item.estimate_currency} onChange={(value) => setBom(patchList(bom, index, { estimate_currency: value.toUpperCase().slice(0, 3) }))} />
                  </div>
                  <Field label="规格说明" multiline value={item.specification} onChange={(value) => setBom(patchList(bom, index, { specification: value }))} />
                  <div className="definition-form-grid">
                    <Field label="材质" multiline value={item.material} onChange={(value) => setBom(patchList(bom, index, { material: value }))} />
                    <Field label="工艺" multiline value={item.process} onChange={(value) => setBom(patchList(bom, index, { process: value }))} />
                  </div>
                  <Field label="供应商备注" multiline value={item.supplier_notes} onChange={(value) => setBom(patchList(bom, index, { supplier_notes: value }))} />
                  <div className="quote-editor">
                    <strong>供应商报价</strong>
                    {item.quotes.map((quote, quoteIndex) => (
                      <div className="definition-form-grid" key={quoteIndex}>
                        <Field label="供应商" value={quote.supplier_name} onChange={(value) => setBom(patchList(bom, index, { quotes: patchList(item.quotes, quoteIndex, { supplier_name: value }) }))} />
                        <Field label="报价单价" type="number" value={quote.quoted_unit_price} onChange={(value) => setBom(patchList(bom, index, { quotes: patchList(item.quotes, quoteIndex, { quoted_unit_price: numberOrNull(value) }) }))} />
                        <Field label="MOQ" type="number" value={quote.moq} onChange={(value) => setBom(patchList(bom, index, { quotes: patchList(item.quotes, quoteIndex, { moq: numberOrNull(value) }) }))} />
                        <Field label="交期（天）" type="number" value={quote.lead_time_days} onChange={(value) => setBom(patchList(bom, index, { quotes: patchList(item.quotes, quoteIndex, { lead_time_days: numberOrNull(value) }) }))} />
                        <Field label="报价币种" value={quote.currency} onChange={(value) => setBom(patchList(bom, index, { quotes: patchList(item.quotes, quoteIndex, { currency: value.toUpperCase().slice(0, 3) }) }))} />
                        <SelectField label="报价状态" value={quote.quote_status || 'candidate'} options={[{ value: 'candidate', label: '待评估' }, { value: 'selected', label: '已选用' }, { value: 'rejected', label: '已淘汰' }, { value: 'expired', label: '已过期' }]} onChange={(value) => setBom(patchList(bom, index, { quotes: patchList(item.quotes, quoteIndex, { quote_status: value as NonNullable<BomItem['quotes'][number]['quote_status']> }) }))} />
                      </div>
                    ))}
                    <button className="text-button" disabled={readOnly} onClick={() => setBom(patchList(bom, index, { quotes: [...item.quotes, { supplier_name: '待补充', currency: 'USD', quote_status: 'candidate' }] }))}>＋ 添加报价</button>
                  </div>
                </article>
              ))}
              <button className="secondary-button" disabled={readOnly} onClick={() => setBom([...bom, { item_code: 'ITEM-' + String(bom.length + 1).padStart(2, '0'), name: '新物料', quantity: 1, unit: 'pcs', estimate_currency: 'USD', quotes: [], sort_order: bom.length }])}>＋ 添加 BOM 物料</button>
            </EditorSection>
          ) : null}

          {activeTab === 'quality' ? (
            <EditorSection title="质量与合规标准" description="把标准、测试方法、验收条件与来源记录在对应版本中。" onSave={() => void saveSection(() => saveQualityStandards(versionId, quality), '质量与合规')} saving={saving} readOnly={readOnly}>
              {quality.map((item, index) => (
                <article className="definition-record-card" key={index}>
                  <div className="definition-record-head"><strong>标准 {index + 1} · {item.category}</strong><button className="text-button danger-text" disabled={readOnly} onClick={() => setQuality(quality.filter((_, i) => i !== index))}>移除</button></div>
                  <div className="definition-form-grid">
                    <Field label="标准类别" value={item.category} onChange={(value) => setQuality(patchList(quality, index, { category: value }))} />
                    <SelectField label="优先级" value={item.priority} options={[{ value: 'P0', label: 'P0' }, { value: 'P1', label: 'P1' }, { value: 'P2', label: 'P2' }]} onChange={(value) => setQuality(patchList(quality, index, { priority: value as QualityStandard['priority'] }))} />
                    <SelectField label="状态" value={item.status || 'proposed'} options={[{ value: 'proposed', label: '待确认' }, { value: 'confirmed', label: '已确认' }, { value: 'verified', label: '已验证' }, { value: 'blocked', label: '阻塞' }, { value: 'deferred', label: '暂缓' }]} onChange={(value) => setQuality(patchList(quality, index, { status: value as QualityStandard['status'] }))} />
                    <Field label="来源引用" value={item.source_reference} onChange={(value) => setQuality(patchList(quality, index, { source_reference: value }))} />
                  </div>
                  <Field label="标准要求" multiline value={item.requirement} onChange={(value) => setQuality(patchList(quality, index, { requirement: value }))} />
                  <Field label="测试方法" multiline value={item.test_method} onChange={(value) => setQuality(patchList(quality, index, { test_method: value }))} />
                  <Field label="验收条件" multiline value={item.acceptance_criteria} onChange={(value) => setQuality(patchList(quality, index, { acceptance_criteria: value }))} />
                </article>
              ))}
              <button className="secondary-button" disabled={readOnly} onClick={() => setQuality([...quality, { category: '待定义', requirement: '', priority: 'P1' }])}>＋ 添加标准</button>
            </EditorSection>
          ) : null}

          {activeTab === 'assets' ? (
            <section className="definition-editor-section">
              <div className="definition-editor-heading">
                <div><h2>产品资料与设计文件</h2><p>上传产品图片、结构图、包装图和供应商资料，并关联到当前版本。移除关联不会删除项目文件库中的原文件。</p></div>
              </div>
              <div className="asset-upload-panel">
                <label className="definition-field">资料类型
                  <select value={assetRole} disabled={readOnly} onChange={(event) => setAssetRole(event.target.value)}>
                    <option value="hero">产品整体效果图</option>
                    <option value="configuration">配置全览图</option>
                    <option value="detail">本体与细节图</option>
                    <option value="experience">玩法与体验示意图</option>
                    <option value="packaging">包装与内部结构图</option>
                    <option value="compliance">合规与测试资料</option>
                    <option value="supplier">供应商资料</option>
                    <option value="reference">参考资料</option>
                  </select>
                </label>
                <Field label="资料说明" value={assetCaption} onChange={setAssetCaption} placeholder="例如：方案 A 正面效果图" disabled={readOnly} />
                <label className="asset-file-picker">
                  <span>{saving ? '正在上传…' : '选择文件并上传'}</span>
                  <input type="file" disabled={saving || readOnly} onChange={(event) => {
                    const file = event.target.files?.[0]
                    void handleAssetUpload(file)
                    event.currentTarget.value = ''
                  }} />
                </label>
              </div>
              {assets.length === 0 ? (
                <div className="workspace-empty"><strong>当前版本还没有关联资料</strong><p>可上传效果图、配置图、结构图、包装图或验证文件。</p></div>
              ) : (
                <div className="product-asset-list">
                  {assets.map((asset) => {
                    const file = projectFiles.find((item) => item.id === asset.file_id)
                    return (
                      <article className="product-asset-row" key={asset.id}>
                        <span className="asset-file-icon">FILE</span>
                        <div className="product-asset-copy">
                          <strong>{file?.original_name || asset.file_id}</strong>
                          <small>{asset.asset_role} · {asset.caption || '无备注'}{file ? ' · ' + Math.ceil(file.size_bytes / 1024) + ' KB' : ''}</small>
                        </div>
                        <a className="text-button" href={'/api/files/' + asset.file_id + '/download'} target="_blank" rel="noreferrer">下载</a>
                        <button className="text-button danger-text" disabled={saving || readOnly} onClick={() => void handleAssetRemove(asset.id)}>移除</button>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          ) : null}

          {activeTab === 'risks' ? (
            <EditorSection title="产品风险" description="记录市场、供应、合规、产品和运营风险，并跟踪缓解动作。" onSave={() => void saveSection(() => saveRisks(versionId, risks), '风险记录')} saving={saving} readOnly={readOnly}>
              {risks.map((item, index) => (
                <article className="definition-record-card" key={index}>
                  <div className="definition-record-head"><strong>风险 {index + 1} · {item.title}</strong><button className="text-button danger-text" disabled={readOnly} onClick={() => setRisks(risks.filter((_, i) => i !== index))}>移除</button></div>
                  <div className="definition-form-grid">
                    <SelectField label="风险类型" value={item.risk_type} options={[{ value: 'market', label: '市场' }, { value: 'supply', label: '供应链' }, { value: 'compliance', label: '合规' }, { value: 'product', label: '产品' }, { value: 'operations', label: '运营' }, { value: 'other', label: '其他' }]} onChange={(value) => setRisks(patchList(risks, index, { risk_type: value as ProductRisk['risk_type'] }))} />
                    <SelectField label="发生概率" value={item.likelihood} options={[{ value: 'low', label: '低' }, { value: 'medium', label: '中' }, { value: 'high', label: '高' }]} onChange={(value) => setRisks(patchList(risks, index, { likelihood: value as ProductRisk['likelihood'] }))} />
                    <SelectField label="影响程度" value={item.impact} options={[{ value: 'low', label: '低' }, { value: 'medium', label: '中' }, { value: 'high', label: '高' }]} onChange={(value) => setRisks(patchList(risks, index, { impact: value as ProductRisk['impact'] }))} />
                    <SelectField label="状态" value={item.status || 'open'} options={[{ value: 'open', label: '待处理' }, { value: 'mitigating', label: '缓解中' }, { value: 'accepted', label: '接受风险' }, { value: 'closed', label: '已关闭' }]} onChange={(value) => setRisks(patchList(risks, index, { status: value as ProductRisk['status'] }))} />
                    <Field label="风险名称" value={item.title} onChange={(value) => setRisks(patchList(risks, index, { title: value }))} />
                    <Field label="责任人" value={item.owner} onChange={(value) => setRisks(patchList(risks, index, { owner: value }))} />
                  </div>
                  <Field label="风险描述" multiline value={item.description} onChange={(value) => setRisks(patchList(risks, index, { description: value }))} />
                  <Field label="缓解措施" multiline value={item.mitigation} onChange={(value) => setRisks(patchList(risks, index, { mitigation: value }))} />
                </article>
              ))}
              <button className="secondary-button" disabled={readOnly} onClick={() => setRisks([...risks, { risk_type: 'product', title: '待评估风险', likelihood: 'medium', impact: 'medium' }])}>＋ 添加风险</button>
            </EditorSection>
          ) : null}
        </div>
      </div>
      </EditorMode.Provider>
    </div>
  )
}