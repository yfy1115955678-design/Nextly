import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader, StatusBadge } from '../components/PagePrimitives'
import { listProjects, type ProjectRecord } from '../lib/api'
import { createConcept, listConcepts, type ProductConcept } from '../lib/productApi'

const emptyForm = { name: '', code: '', category: '', description: '' }

export default function ProjectProductPage() {
  const { projectId = '' } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState<ProjectRecord | null>(null)
  const [concepts, setConcepts] = useState<ProductConcept[]>([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const [projects, items] = await Promise.all([listProjects(true), listConcepts(projectId)])
      const currentProject = projects.find((item) => item.id === projectId)
      if (!currentProject || currentProject.status === 'archived') {
        throw new Error('项目不存在或已归档。')
      }
      setProject(currentProject)
      setConcepts(items)
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '项目内容读取失败')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await createConcept(projectId, {
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        category: form.category.trim() || undefined,
        description: form.description.trim(),
      })
      setForm(emptyForm)
      setNotice('产品概念已创建。')
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '产品概念创建失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        step="NEXTLY 3.0 · PRODUCT WORKSPACE"
        title={project?.name ?? '产品定义'}
        description="在同一个项目下管理多个产品概念，并为每个概念建立独立的方案与版本。"
        actions={<><StatusBadge tone="success">持久化数据</StatusBadge><button className="secondary-button" onClick={() => navigate('/projects')}>返回项目管理</button></>}
      />

      {error ? <div className="workspace-alert error" role="alert">{error}</div> : null}
      {notice ? <div className="workspace-alert success" role="status">{notice}</div> : null}

      <div className="product-studio-layout">
        <section className="panel-card">
          <div className="section-title"><h2>产品概念</h2><StatusBadge>{concepts.length} 个概念</StatusBadge></div>
          {loading ? <div className="workspace-empty">正在读取产品概念…</div> : null}
          {!loading && concepts.length === 0 ? (
            <div className="workspace-empty">
              <strong>这个项目还没有产品概念</strong>
              <p>先建立一个产品概念，再在概念下拆分 A/B 方案。</p>
            </div>
          ) : null}
          <div className="concept-list">
            {concepts.map((concept) => (
              <button className="concept-card" key={concept.id} onClick={() => navigate('/concepts/' + concept.id)}>
                <span className="concept-card-mark">{concept.name.slice(0, 1)}</span>
                <span className="concept-card-copy">
                  <strong>{concept.name}</strong>
                  <small>{[concept.code, concept.category].filter(Boolean).join(' · ') || '未设置编码与品类'}</small>
                  {concept.description ? <span>{concept.description}</span> : null}
                </span>
                <span className="concept-card-action">打开 <b>→</b></span>
              </button>
            ))}
          </div>
        </section>

        <section className="panel-card create-project-card">
          <div className="section-title"><h2>新建产品概念</h2><StatusBadge tone="info">Concept</StatusBadge></div>
          <form className="project-create-form" onSubmit={(event) => void submit(event)}>
            <label>概念名称 <span>必填</span><input value={form.name} maxLength={200} placeholder="例如：露营奇妙夜" onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
            <label>概念编码<input value={form.code} maxLength={80} placeholder="例如：CAMP-01" onChange={(event) => setForm({ ...form, code: event.target.value })} /></label>
            <label>产品品类<input value={form.category} maxLength={120} placeholder="例如：Slime & Putty Set" onChange={(event) => setForm({ ...form, category: event.target.value })} /></label>
            <label>概念说明<textarea rows={4} maxLength={10000} value={form.description} placeholder="记录概念方向、核心玩法或开发目标。" onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <button className="primary-button" type="submit" disabled={saving || !form.name.trim()}>{saving ? '创建中…' : '创建概念'}</button>
          </form>
        </section>
      </div>
    </div>
  )
}