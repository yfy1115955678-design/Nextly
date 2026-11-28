import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, StatusBadge } from '../components/PagePrimitives'
import { archiveProject, createProject, listProjects, updateProject, type ProjectInput, type ProjectRecord } from '../lib/api'

const emptyForm: ProjectInput = {
  name: '',
  category: '',
  target_market: '',
  description: '',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [form, setForm] = useState<ProjectInput>(emptyForm)
  const [editForm, setEditForm] = useState<ProjectInput>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [includeArchived, setIncludeArchived] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setProjects(await listProjects(includeArchived))
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '项目读取失败')
    } finally {
      setLoading(false)
    }
  }, [includeArchived])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const submitNewProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const project = await createProject({
        name: form.name.trim(),
        category: form.category?.trim() || undefined,
        target_market: form.target_market?.trim() || undefined,
        description: form.description?.trim() || '',
      })
      setForm(emptyForm)
      navigate('/projects/' + project.id + '/product-definition')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '项目创建失败')
    } finally {
      setSaving(false)
    }
  }

  const beginEdit = (project: ProjectRecord) => {
    setEditingId(project.id)
    setEditForm({
      name: project.name,
      category: project.category ?? '',
      target_market: project.target_market ?? '',
      description: project.description,
    })
    setNotice('')
  }

  const saveEdit = async (projectId: string) => {
    if (!editForm.name?.trim()) return
    setSaving(true)
    setError('')
    try {
      await updateProject(projectId, {
        name: editForm.name.trim(),
        category: editForm.category?.trim() || '',
        target_market: editForm.target_market?.trim() || '',
        description: editForm.description ?? '',
      })
      setEditingId(null)
      setNotice('项目资料已更新。')
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '项目更新失败')
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (project: ProjectRecord) => {
    setSaving(true)
    setError('')
    try {
      await updateProject(project.id, {
        status: project.status === 'paused' ? 'active' : 'paused',
      })
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '项目状态更新失败')
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async (project: ProjectRecord) => {
    if (!window.confirm('归档「' + project.name + '」？归档后项目不会出现在默认列表中。')) return
    setSaving(true)
    setError('')
    try {
      await archiveProject(project.id)
      setNotice('项目已归档，原始数据仍保留在数据库中。')
      setEditingId(null)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '项目归档失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        step=""
        title="项目库"
        actions={<button className="primary-button" onClick={() => setCreating(true)}>＋ 新建项目</button>}
      />

      {error ? <div className="workspace-alert error" role="alert">{error}</div> : null}
      {notice ? <div className="workspace-alert success" role="status">{notice}</div> : null}

      <div className={creating ? "workspace-grid" : "local-project-list"}>
        <section className="panel-card">
          <div className="section-title">
            <h2>项目列表</h2>
            <label className="inline-check">
              <input
                type="checkbox"
                checked={includeArchived}
                onChange={(event) => setIncludeArchived(event.target.checked)}
              />
              显示已归档
            </label>
          </div>

          {loading ? <p className="workspace-empty">正在读取项目…</p> : null}
          {!loading && projects.length === 0 ? (
            <div className="workspace-empty">
              <strong>还没有项目记录</strong>
              <p>点击「新建项目」开始。</p>
            </div>
          ) : null}

          <div className="project-record-list">
            {projects.map((project) => (
              <article className="project-record" key={project.id}>
                {editingId === project.id ? (
                  <div className="project-edit-form">
                    <label>项目名称<input value={editForm.name ?? ''} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} /></label>
                    <div className="project-edit-fields">
                      <label>品类<input value={editForm.category ?? ''} onChange={(event) => setEditForm({ ...editForm, category: event.target.value })} /></label>
                      <label>目标市场<input value={editForm.target_market ?? ''} onChange={(event) => setEditForm({ ...editForm, target_market: event.target.value })} /></label>
                    </div>
                    <label>项目描述<textarea rows={2} value={editForm.description ?? ''} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} /></label>
                    <div className="project-actions">
                      <button className="primary-button" disabled={saving || !editForm.name?.trim()} onClick={() => void saveEdit(project.id)}>保存修改</button>
                      <button className="secondary-button" disabled={saving} onClick={() => setEditingId(null)}>取消</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="project-record-head">
                      <div className="project-record-title">
                        <span className="project-avatar">{project.name.slice(0, 2).toUpperCase()}</span>
                        <div><strong>{project.name}</strong><small>{[project.category, project.target_market].filter(Boolean).join(' · ') || '尚未填写品类与市场'}</small></div>
                      </div>
                      <StatusBadge tone={project.status === 'active' ? 'success' : project.status === 'paused' ? 'warning' : 'neutral'}>
                        {project.status === 'active' ? '进行中' : project.status === 'paused' ? '已暂停' : '已归档'}
                      </StatusBadge>
                    </div>
                    {project.description ? <p className="project-description">{project.description}</p> : null}
                    <div className="project-record-foot">
                      <span>更新于 {formatDate(project.updated_at)}</span>
                      <div className="project-actions">
                        {project.status !== 'archived' ? (
                          <>
                            <button className="text-button" onClick={() => navigate('/projects/' + project.id + '/product-definition')}>打开项目 →</button>
                            <button className="text-button" disabled={saving} onClick={() => beginEdit(project)}>编辑</button>
                            <button className="text-button" disabled={saving} onClick={() => void toggleStatus(project)}>{project.status === 'paused' ? '恢复' : '暂停'}</button>
                            <button className="text-button danger-text" disabled={saving} onClick={() => void handleArchive(project)}>归档</button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        </section>

        {creating && <section className="panel-card create-project-card">
          <div className="section-title"><h2>新建项目</h2><button className="text-button" onClick={() => setCreating(false)}>取消</button></div>
          <form className="project-create-form" onSubmit={(event) => void submitNewProject(event)}>
            <label>项目名称 <span>必填</span><input autoFocus value={form.name} maxLength={160} placeholder="例如：2027 新品开发" onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
            <label>产品品类<input value={form.category} maxLength={120} placeholder="产品所属品类" onChange={(event) => setForm({ ...form, category: event.target.value })} /></label>
            <label>目标市场<input value={form.target_market} maxLength={120} placeholder="例如：US Amazon" onChange={(event) => setForm({ ...form, target_market: event.target.value })} /></label>
            <label>项目描述<textarea rows={4} maxLength={10000} value={form.description} placeholder="记录项目目标、背景或当前阶段。" onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
            <button className="primary-button" type="submit" disabled={saving || !form.name.trim()}>{saving ? '保存中…' : '创建项目'}</button>
          </form>
          <p className="form-footnote">创建后可继续编辑、暂停或归档。归档不会删除项目数据。</p>
        </section>}
      </div>
    </div>
  )
}