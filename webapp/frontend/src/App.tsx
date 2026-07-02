import { Routes, Route, NavLink, useSearchParams } from 'react-router-dom'
import DataUpload from './pages/DataUpload'
import OpportunityInsight from './pages/OpportunityInsight'
import BriefWorkbench from './pages/BriefWorkbench'
import ReviewMemory from './pages/ReviewMemory'
import CompareProjects from './pages/CompareProjects'

/* -- Airbnb color tokens -- */
const TOKEN = {
  ink: '#222222',
  muted: '#6a6a6a',
  hairline: '#dddddd',
  canvas: '#ffffff',
  rausch: '#ff385c',
} as const

const NAV_ITEMS = [
  { to: '/', label: '数据上传', end: true },
  { to: '/insight', label: '机会洞察' },
  { to: '/brief', label: 'Brief 工作台' },
  { to: '/review', label: 'Review & Memory' },
]

export default function App() {
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('project') || ''

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: TOKEN.canvas }}>

      {/* -- Top Navigation: 80px, white canvas, hairline bottom border -- */}
      <header
        style={{
          height: '80px',
          background: TOKEN.canvas,
          borderBottom: `1px solid ${TOKEN.hairline}`,
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 24px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          {/* -- Logo "Nexly": 22px, weight 500, ink #222222 -- */}
          <NavLink
            to="/"
            style={{
              fontSize: '22px',
              fontWeight: 500,
              color: TOKEN.ink,
              textDecoration: 'none',
              lineHeight: 1.18,
              letterSpacing: '-0.44px',
              flexShrink: 0,
            }}
          >
            Nexly
          </NavLink>

          {/* -- Nav links centered: active = ink + underline, inactive = muted -- */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            {NAV_ITEMS.map((item) => {
              const target = projectId
                ? `${item.to}?project=${projectId}`
                : item.to
              return (
                <NavLink
                  key={item.to}
                  to={target}
                  end={item.end}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`
                  }
                >
                  {item.label}
                </NavLink>
              )
            })}
            {/* 品类对比入口 — 仅在有 projectId 时显示 */}
            {projectId && (
              <NavLink
                to={`/compare?projects=${projectId}`}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`
                }
              >
                品类对比
              </NavLink>
            )}
          </nav>

          {/* right-side spacer for visual balance */}
          <div style={{ flex: 1 }} />
        </div>
      </header>

      {/* -- Page content -- */}
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<DataUpload />} />
          <Route path="/insight" element={<OpportunityInsight />} />
          <Route path="/brief" element={<BriefWorkbench />} />
          <Route path="/review" element={<ReviewMemory />} />
          <Route path="/compare" element={<CompareProjects />} />
        </Routes>
      </main>
    </div>
  )
}
