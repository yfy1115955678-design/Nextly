import { useEffect, useState } from 'react'
import { Outlet, useLocation, useParams } from 'react-router-dom'
import { listProjects, type ProjectRecord } from '../lib/api'
import Symbol, { type SymbolName } from './Symbol'

export default function LocalShell() {
  const { projectId } = useParams()
  const location = useLocation()
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  useEffect(() => {
    let active = true
    listProjects().then(items => { if (active) setProjects(items) }).catch(() => { if (active) setProjects([]) })
    return () => { active = false }
  }, [projectId, location.pathname])
  const project = projects.find(item => item.id === projectId)
  const base = projectId ? '/projects/' + projectId : ''
  const matrix = base + '/product-definition'
  const links: Array<{ to: string; label: string; icon: SymbolName; active: boolean }> = projectId ? [
    { to: matrix, label: '产品矩阵', icon: 'cube', active: location.pathname === matrix },
    { to: base + '/files', label: '项目资料', icon: 'file', active: location.pathname === base + '/files' },
    { to: base + '/decisions', label: '评审记录', icon: 'history', active: location.pathname === base + '/decisions' },
  ] : [
    { to: '/projects', label: '项目库', icon: 'overview', active: location.pathname === '/projects' },
    { to: '/settings/backups', label: '数据与备份', icon: 'history', active: location.pathname === '/settings/backups' },
  ]
  const label = projectId ? location.pathname.startsWith(matrix + '/') ? '产品定义' : links.find(l => l.active)?.label : links.find(l => l.active)?.label
  return <div className="app-shell local-shell">
    <aside className="sidebar">
      <a href="/projects" className="brand"><span className="brand-mark">N</span><span><strong>Nextly</strong><small>产品开发工作台</small></span></a>
      {projectId ? <>
        <a href="/projects" className="side-link local-back">← 全部项目</a>
        <label className="local-project-picker"><span>当前项目</span><select aria-label="切换项目" value={projectId} onChange={e => window.location.assign('/projects/' + e.target.value + '/product-definition')}>
          {!project && <option value={projectId}>当前项目</option>}
          {projects.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}
        </select></label>
      </> : null}
      <nav className="sidebar-nav" aria-label="工作区导航">
        {links.map(l => <a key={l.to} href={l.to} className={'side-link ' + (l.active ? 'active' : '')}><Symbol name={l.icon}/><span>{l.label}</span></a>)}
        {projectId && location.pathname.startsWith(matrix + '/') && <span className="side-link active local-current"><Symbol name="file"/><span>产品定义</span></span>}
      </nav>
      <div className="sidebar-footer">{projectId ? <a href="/settings/backups" className="side-link"><Symbol name="history"/>数据与备份</a> : <a href="/demo" className="side-link"><Symbol name="overview"/>独立演示</a>}<span>Nextly 3.0 · 本地工作区</span></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><div className="breadcrumb"><a href="/projects">项目库</a>{projectId && <><b>/</b><a href={matrix}>{project?.name || '当前项目'}</a></>}<b>/</b><strong>{label || '工作区'}</strong></div><span className="local-storage-label">本地数据</span></header>
      <main className="page-frame"><Outlet/></main>
    </div>
  </div>
}
