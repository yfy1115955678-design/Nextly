import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader, StatusBadge } from '../components/PagePrimitives'
import { createVariant, getConcept, listVariants, type ProductConcept, type ProductVariant } from '../lib/productApi'

export default function ConceptPage() {
  const { conceptId = '' } = useParams()
  const navigate = useNavigate()
  const [concept, setConcept] = useState<ProductConcept | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [current, items] = await Promise.all([getConcept(conceptId), listVariants(conceptId)])
      setConcept(current)
      setVariants(items)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '概念与方案读取失败')
    } finally {
      setLoading(false)
    }
  }, [conceptId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      await createVariant(conceptId, {
        name: name.trim(),
        code: code.trim() || undefined,
        description: description.trim(),
        sort_order: variants.length,
      })
      setName('')
      setCode('')
      setDescription('')
      setNotice('方案已创建。')
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '方案创建失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        step="PRODUCT CONCEPT"
        title={concept?.name ?? '产品概念'}
        description={concept?.description || '在这个产品概念下创建并比较不同方案。'}
        actions={<><StatusBadge>{concept?.category || '未设置品类'}</StatusBadge><button className="secondary-button" onClick={() => concept && navigate('/projects/' + concept.project_id + '/product-definition')}>返回项目</button></>}
      />

      {error ? <div className="workspace-alert error" role="alert">{error}</div> : null}
      {notice ? <div className="workspace-alert success" role="status">{notice}</div> : null}

      <section className="panel-card">
        <div className="section-title"><h2>方案对比</h2><StatusBadge>{variants.length} 个方案</StatusBadge></div>
        {loading ? <div className="workspace-empty">正在读取方案…</div> : null}
        {!loading && variants.length === 0 ? (
          <div className="workspace-empty">
            <strong>还没有方案</strong>
            <p>先创建方案 A。需要比较时，可以继续创建方案 B、C 等备选方案。</p>
          </div>
        ) : null}
        <div className="variant-grid">
          {variants.map((variant) => (
            <article className="variant-card" key={variant.id}>
              <div className="variant-card-head">
                <span className="variant-code">{variant.code || 'VARIANT'}</span>
                <StatusBadge tone="success">可编辑</StatusBadge>
              </div>
              <h3>{variant.name}</h3>
              <p>{variant.description || '尚未填写方案说明。'}</p>
              <button className="secondary-button" onClick={() => navigate('/variants/' + variant.id)}>查看版本与定义 <span>→</span></button>
            </article>
          ))}
        </div>
      </section>

      <section className="panel-card create-variant-card">
        <div className="section-title"><h2>新增方案</h2><StatusBadge tone="info">Variant</StatusBadge></div>
        <form className="variant-create-form" onSubmit={(event) => void submit(event)}>
          <label>方案名称 <span>必填</span><input value={name} maxLength={160} placeholder={variants.length ? '例如：方案 B · 高配置版' : '例如：方案 A · 基础版'} onChange={(event) => setName(event.target.value)} required /></label>
          <label>方案编码<input value={code} maxLength={80} placeholder={variants.length ? '例如：B' : '例如：A'} onChange={(event) => setCode(event.target.value)} /></label>
          <label>方案说明<textarea rows={3} maxLength={10000} value={description} placeholder="说明与其他方案的配置差异。" onChange={(event) => setDescription(event.target.value)} /></label>
          <button className="primary-button" type="submit" disabled={saving || !name.trim()}>{saving ? '创建中…' : '创建方案'}</button>
        </form>
      </section>
    </div>
  )
}