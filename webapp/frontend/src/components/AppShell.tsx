import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useProject } from '../lib/projectState'
import AssistantPanel from './AssistantPanel'
import Symbol, { type SymbolName } from './Symbol'

const navItems: Array<{ to: string; label: string; icon: SymbolName; question: string }> = [
  { to: '/opportunity', label: '机会发现', icon: 'target', question: '哪个方向值得研究？' },
  { to: '/research', label: '市场研究', icon: 'search', question: '这个机会成立吗？' },
  { to: '/product', label: '产品定义', icon: 'cube', question: '具体做什么？' },
  { to: '/feasibility', label: '落地验证', icon: 'shield', question: '做得出来吗？' },
  { to: '/review', label: '评审与决策', icon: 'check', question: '值得继续吗？' },
]

const pageLabels: Record<string, string> = {
  '/': '项目总览',
  '/opportunity': '机会发现',
  '/research': '市场研究',
  '/product': '产品定义',
  '/feasibility': '落地验证',
  '/review': '评审与决策',
  '/trace': '项目记录',
}

function getStageTone(path: string, mode: string) {
  if (mode === 'approved') return 'done'
  if (mode === 'paused') return path === '/review' ? 'muted' : 'done'
  if (mode === 'revised') {
    if (path === '/review') return 'waiting'
    return 'done'
  }
  if (path === '/opportunity' || path === '/research') return 'done'
  if (path === '/product') return 'waiting'
  if (path === '/feasibility') return 'blocked'
  return 'muted'
}

function stageAriaLabel(tone: string) {
  if (tone === 'done') return '已完成'
  if (tone === 'waiting') return '等待确认'
  if (tone === 'blocked') return '存在阻塞项'
  return '尚未开始'
}

export default function AppShell() {
  const { state, resetDemo } = useProject()
  const location = useLocation()
  const navigate = useNavigate()
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  useEffect(() => {
    const openAssistant = () => setAssistantOpen(true)
    window.addEventListener('open-nextly-assistant', openAssistant)
    return () => window.removeEventListener('open-nextly-assistant', openAssistant)
  }, [])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" className="brand" aria-label="返回 Nextly 项目总览">
          <span className="brand-mark">N</span>
          <span><strong>Nextly</strong><small>产品开发工作台</small></span>
        </NavLink>

        <div className="project-switcher" aria-label="当前项目 AquaPure S1">
          <span className="project-avatar">AP</span>
          <span className="project-meta"><strong>AquaPure S1</strong><small>US · 宠物饮水机</small></span>
          <Symbol name="chevron" />
        </div>

        <nav className="sidebar-nav" aria-label="项目导航">
          <span className="nav-group-label">项目</span>
          <NavLink to="/" end className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
            <Symbol name="overview" /><span>项目总览</span>
          </NavLink>

          <span className="nav-group-label">开发流程</span>
          {navItems.map((item) => {
            const tone = getStageTone(item.to, state.mode)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}
                title={item.question}
              >
                <Symbol name={item.icon} />
                <span>{item.label}</span>
                <i className={`stage-dot ${tone}`} aria-label={stageAriaLabel(tone)} />
              </NavLink>
            )
          })}

          <button className="more-toggle" onClick={() => setMoreOpen((value) => !value)} aria-expanded={moreOpen}>
            <span>更多</span><Symbol name="chevron" className={moreOpen ? 'rotate' : ''} />
          </button>
          {moreOpen ? (
            <NavLink to="/trace" className={({ isActive }) => `side-link sub-link ${isActive ? 'active' : ''}`}>
              <Symbol name="history" /><span>项目记录</span>
            </NavLink>
          ) : null}
        </nav>

        <div className="sidebar-footer">
          <button
            className="reset-button"
            onClick={() => {
              resetDemo()
              navigate('/')
              setMoreOpen(false)
            }}
          >
            <Symbol name="reset" />重置演示
          </button>
          <span>Portfolio Demo · Mock data</span>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb"><span>AquaPure S1</span><b>→</b><strong>{pageLabels[location.pathname] ?? '项目'}</strong></div>
          <div className="topbar-actions">
            <span className="demo-pill"><i />AI 协作 Workflow Demo</span>
            <span className="avatar-button" aria-hidden="true">FY</span>
          </div>
        </header>

        <main className="page-frame">
          <Outlet />
        </main>
      </div>

      {!assistantOpen ? (
        <button className="assistant-trigger" onClick={() => setAssistantOpen(true)} aria-label="打开 Nextly AI 助手">
          <Symbol name="sparkle" /><span>AI 助手</span>
          {state.mode === 'conflict' ? <i aria-label="有一项等待确认" /> : null}
        </button>
      ) : null}

      {assistantOpen ? (
        <>
          <button className="assistant-backdrop" onClick={() => setAssistantOpen(false)} aria-label="关闭 AI 助手" />
          <AssistantPanel onClose={() => setAssistantOpen(false)} />
        </>
      ) : null}
    </div>
  )
}
