import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { listProjectFiles, uploadProjectFile, type ProjectFileRecord } from '../lib/api'
import { getProjectWorkspace, versionPath, type ProjectWorkspaceState } from '../lib/productApi'

export function ProjectFilesPage() {
  const { projectId = '' } = useParams()
  const [files, setFiles] = useState<ProjectFileRecord[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(true)
  const refresh = useCallback(async () => {
    setBusy(true); setError('')
    try { setFiles(await listProjectFiles(projectId)) }
    catch (e) { setError(e instanceof Error ? e.message : '读取失败') }
    finally { setBusy(false) }
  }, [projectId])
  useEffect(() => { void refresh() }, [refresh])
  async function upload(file: File) {
    setBusy(true); setError('')
    try { await uploadProjectFile(projectId, file); await refresh() }
    catch (e) { setError(e instanceof Error ? e.message : '上传失败'); setBusy(false) }
  }
  return <div className="page-stack"><header className="local-page-title"><div><h1>项目资料</h1><p>原始资料保存在当前项目，可在产品定义中关联具体版本。</p></div><label className="asset-file-picker primary-button">{busy ? '处理中…' : '上传资料'}<input type="file" disabled={busy} onChange={e => { const f = e.target.files?.[0]; if (f) void upload(f); e.currentTarget.value = '' }}/></label></header>{error && <div className="workspace-alert error">{error}</div>}<section className="panel-card">{!busy && !files.length && <p>暂无资料</p>}{files.map(f => <div className="product-asset-row" key={f.id}><span className="asset-file-icon">FILE</span><div className="product-asset-copy"><strong>{f.original_name}</strong><small>{Math.ceil(f.size_bytes / 1024)} KB</small></div><a className="text-button" href={'/api/files/' + f.id + '/download'}>下载</a></div>)}</section></div>
}

export function ProjectDecisionsPage() {
  const { projectId = '' } = useParams()
  const [state, setState] = useState<ProjectWorkspaceState | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { let alive = true; getProjectWorkspace(projectId).then(s => { if (alive) setState(s) }).catch(e => { if (alive) setError(String(e)) }); return () => { alive = false } }, [projectId])
  return <div className="page-stack"><header className="local-page-title"><div><h1>评审记录</h1><p>展示当前项目实际保存的最近评审记录。</p></div></header>{error && <div className="workspace-alert error">{error}</div>}{state && <section className="panel-card">{!state.recent_decisions.length && <p>暂无评审记录。确认产品定义版本后会在此保留决策。</p>}{state.recent_decisions.map(d => <article key={d.id} className="decision-record-local"><small>{new Date(d.decided_at).toLocaleString('zh-CN')} · {d.decision_type}</small><h3>{d.outcome}</h3>{d.rationale && <p>{d.rationale}</p>}{d.conditions && <p>条件：{d.conditions}</p>}{d.impact && <p>影响：{d.impact}</p>}</article>)}</section>}{state && <section className="panel-card"><h2>已确认版本</h2>{state.concepts.flatMap(c => c.variants.flatMap(v => v.versions.filter(x => x.status !== 'draft').map(x => <p key={x.id}><a href={versionPath(projectId, x.id)}>{c.concept.name} / {v.variant.name} / v{x.version_number}</a></p>)))}</section>}</div>
}
