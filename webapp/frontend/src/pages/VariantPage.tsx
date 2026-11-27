import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader, StatusBadge } from '../components/PagePrimitives'
import { createVersion, getVariant, type ProductVariant, type VariantVersion } from '../lib/productApi'

function versionLabel(status: VariantVersion['status']) {
  if (status === 'draft') return '编辑中'
  if (status === 'confirmed') return '已确认'
  return '已被新版本替代'
}

function versionTone(status: VariantVersion['status']) {
  if (status === 'draft') return 'warning'
  if (status === 'confirmed') return 'success'
  return 'neutral'
}

export default function VariantPage() {
  const { variantId = '' } = useParams()
  const navigate = useNavigate()
  const [variant, setVariant] = useState<ProductVariant | null>(null)
  const [versions, setVersions] = useState<VariantVersion[]>([])
  const [changeSummary, setChangeSummary] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getVariant(variantId)
      setVariant(result.variant)
      setVersions(result.versions)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '方案版本读取失败')
    } finally {
      setLoading(false)
    }
  }, [variantId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const version = await createVersion(variantId, changeSummary.trim())
      navigate('/versions/' + version.id)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '新版本创建失败')
    } finally {
      setSaving(false)
    }
  }

  const draft = versions.find((version) => version.status === 'draft')

  return (
    <div className="page-stack">
      <PageHeader
        step="PRODUCT VARIANT"
        title={variant?.name ?? '产品方案'}
        description={variant?.description || '维护方案版本。已确认版本会保留为历史快照。'}
        actions={<><StatusBadge>{variant?.code || 'VARIANT'}</StatusBadge><button className="secondary-button" onClick={() => variant && navigate('/concepts/' + variant.concept_id)}>返回概念</button></>}
      />

      {error ? <div className="workspace-alert error" role="alert">{error}</div> : null}
      {notice ? <div className="workspace-alert success" role="status">{notice}</div> : null}

      <section className="panel-card">
        <div className="section-title"><h2>版本历史</h2><StatusBadge>{versions.length} 个版本</StatusBadge></div>
        {loading ? <div className="workspace-empty">正在读取版本…</div> : null}
        {!loading && versions.length === 0 ? (
          <div className="workspace-empty">
            <strong>还没有产品定义版本</strong>
            <p>创建 v1 后，开始填写产品定位、用户画像、需求和开发方案。</p>
          </div>
        ) : null}
        <div className="version-list">
          {versions.map((version) => (
            <button className="version-row" key={version.id} onClick={() => navigate('/versions/' + version.id)}>
              <span className="version-number">v{version.version_number}</span>
              <span className="version-row-copy">
                <strong>{version.change_summary || '产品定义版本'}</strong>
                <small>{new Date(version.created_at).toLocaleString('zh-CN')}</small>
              </span>
              <StatusBadge tone={versionTone(version.status)}>{versionLabel(version.status)}</StatusBadge>
              <span className="version-row-arrow">→</span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel-card create-version-card">
        <div className="section-title"><h2>{draft ? '继续编辑草稿' : '创建新版本'}</h2><StatusBadge tone={draft ? 'warning' : 'info'}>{draft ? 'Draft' : 'New version'}</StatusBadge></div>
        {draft ? (
          <div className="draft-resume">
            <div><strong>v{draft.version_number} 正在编辑</strong><p>{draft.change_summary || '当前草稿尚未填写修改说明。'}</p></div>
            <button className="primary-button" onClick={() => navigate('/versions/' + draft.id)}>继续编辑 <span>→</span></button>
          </div>
        ) : (
          <form className="variant-create-form" onSubmit={(event) => void submit(event)}>
            <label>本次修改说明<input value={changeSummary} maxLength={5000} placeholder={versions.length ? '例如：根据打样反馈调整结构与成本' : '例如：初版产品定义'} onChange={(event) => setChangeSummary(event.target.value)} /></label>
            <p className="form-footnote">{versions.length ? '新草稿会从最近一个版本复制全部内容，历史版本保持不变。' : '这将创建 v1 Draft，之后可保存、评审和确认。'}</p>
            <button className="primary-button" type="submit" disabled={saving}>{saving ? '创建中…' : versions.length ? '基于上一版本创建 Draft' : '创建 v1 Draft'}</button>
          </form>
        )}
      </section>
    </div>
  )
}