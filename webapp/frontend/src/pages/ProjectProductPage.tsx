import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { StatusBadge } from '../components/PagePrimitives'
import { createConcept, createVariant, createVersion, currentVersion, getProjectWorkspace, getVersion, versionPath, type ProjectWorkspaceState, type ProductVersionDetail, type VariantVersion } from '../lib/productApi'

type Creation = { conceptId: string | null; name: string; description: string }
const emptyCreation = (conceptId: string | null = null): Creation => ({ conceptId, name: '', description: '' })

function versionStatus(v?: VariantVersion) {
  return !v ? '未建立定义' : v.status === 'draft' ? '草稿' : v.status === 'confirmed' ? '已确认' : '历史版本'
}
function price(d?: ProductVersionDetail) {
  const p = d?.definition
  if (!p || (p.target_price_min == null && p.target_price_max == null)) return '待核价'
  const low = p.target_price_min ?? p.target_price_max
  const high = p.target_price_max ?? low
  return p.target_price_currency + ' ' + (low === high ? low : low + '–' + high)
}

export default function ProjectProductPage() {
  const { projectId = '' } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState<ProjectWorkspaceState | null>(null)
  const [details, setDetails] = useState<Record<string, ProductVersionDetail>>({})
  const [creation, setCreation] = useState<Creation | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const next = await getProjectWorkspace(projectId)
      setState(next)
      const ids = next.concepts.flatMap(c => c.variants.map(v => currentVersion(v.versions)?.id).filter((id): id is string => !!id))
      const result = await Promise.allSettled(ids.map(id => getVersion(id)))
      setDetails(Object.fromEntries(result.flatMap(r => r.status === 'fulfilled' ? [[r.value.version.id, r.value] as const] : [])))
      if (result.some(r => r.status === 'rejected')) setError('部分方案详情读取失败，可打开对应方案重试。')
    } catch (e) { setState(null); setError(e instanceof Error ? e.message : '项目读取失败') }
    finally { setLoading(false) }
  }, [projectId])
  useEffect(() => { void refresh() }, [refresh])
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!creation?.name.trim()) return
    setSaving(true); setError('')
    try {
      if (creation.conceptId) await createVariant(creation.conceptId, { name: creation.name.trim(), description: creation.description.trim() })
      else await createConcept(projectId, { name: creation.name.trim(), description: creation.description.trim(), category: state?.project.category || undefined })
      setCreation(null)
      await refresh()
    } catch (e) { setError(e instanceof Error ? e.message : '创建失败') }
    finally { setSaving(false) }
  }
  const open = async (variantId: string, version?: VariantVersion) => {
    if (version) { navigate(versionPath(projectId, version.id)); return }
    setSaving(true); setError('')
    try { const draft = await createVersion(variantId, '初版产品定义'); navigate(versionPath(projectId, draft.id)) }
    catch (e) { setError(e instanceof Error ? e.message : '创建初稿失败') }
    finally { setSaving(false) }
  }
  const allVariants = state?.concepts.flatMap(c => c.variants) ?? []
  const drafts = allVariants.filter(v => v.versions.some(x => x.status === 'draft')).length
  const confirmed = allVariants.filter(v => v.versions.some(x => x.status === 'confirmed')).length
  return <div className="page-stack matrix-page">
    <header className="local-page-title"><div><h1>{state?.project.name ?? '产品矩阵'}</h1><p>{[state?.project.category, state?.project.target_market].filter(Boolean).join(' · ')}</p>{state?.project.description && <p>{state.project.description}</p>}</div><button className="primary-button" disabled={loading || !state || saving} onClick={() => setCreation(emptyCreation())}>＋ 新建产品</button></header>
    {error && <div className="workspace-alert error" role="alert">{error}</div>}
    {state && <div className="matrix-summary"><div><small>产品概念</small><strong>{state.concepts.length}</strong></div><div><small>开发方案</small><strong>{allVariants.length}</strong></div><div><small>有草稿的方案</small><strong>{drafts}</strong></div><div><small>已有确认版本的方案</small><strong>{confirmed}</strong></div></div>}
    {creation && <section className="panel-card local-create"><form className="variant-create-form" onSubmit={submit}><h2>{creation.conceptId ? '新增备选方案' : '新建产品概念'}</h2><label>名称<input autoFocus value={creation.name} maxLength={160} required onChange={e => setCreation({...creation, name: e.target.value})}/></label><label>说明<textarea rows={2} value={creation.description} onChange={e => setCreation({...creation, description: e.target.value})}/></label><div className="project-actions"><button type="submit" className="primary-button" disabled={saving}>创建</button><button type="button" className="secondary-button" disabled={saving} onClick={() => setCreation(null)}>取消</button></div></form></section>}
    {loading && <p role="status">正在读取项目数据…</p>}
    {!loading && state?.concepts.length === 0 && <section className="panel-card workspace-empty">还没有产品。点击「新建产品」开始。</section>}
    {state?.concepts.map(({concept, variants}) => <section className="panel-card matrix-group" key={concept.id}>
      <div className="matrix-group-head"><div><h2>{concept.name}</h2>{concept.description && <p>{concept.description}</p>}</div><button className="secondary-button" disabled={saving} onClick={() => setCreation(emptyCreation(concept.id))}>＋ 新增方案</button></div>
      {variants.length === 0 ? <p className="matrix-empty">还没有方案。</p> : <div className="matrix-table-wrap"><table className="matrix-table"><thead><tr><th>方案</th><th>产品配置</th><th>目标售价</th><th>待处理问题 / 风险</th><th>当前版本</th><th>操作</th></tr></thead><tbody>
        {variants.map(({variant, versions}) => {
          const v = currentVersion(versions)
          const d = v && details[v.id]
          const issueCount = d?.development_issues.filter(i => i.status !== 'resolved' && i.status !== 'deferred').length
          const riskCount = d?.risks.filter(i => i.status !== 'closed').length
          return <tr key={variant.id}><td><strong>{variant.name}</strong>{variant.description && <small>{variant.description}</small>}</td><td>{d?.definition?.specification_summary || '待定义'}</td><td>{price(d)}</td><td>{d ? (issueCount + ' / ' + riskCount) : '—'}</td><td>{v && <strong>v{v.version_number} </strong>}<StatusBadge tone={v?.status === 'confirmed' ? 'success' : 'neutral'}>{versionStatus(v)}</StatusBadge></td><td><button className="text-button" disabled={saving} onClick={() => void open(variant.id, v)}>{v ? '打开定义 →' : '创建初稿'}</button></td></tr>
        })}
      </tbody></table></div>}
    </section>)}
  </div>
}
