import { useState, useRef, useEffect } from 'react'
import { Routes, Route, NavLink, useSearchParams, useNavigate } from 'react-router-dom'
import DataUpload from './pages/DataUpload'
import OpportunityInsight from './pages/OpportunityInsight'
import BriefWorkbench from './pages/BriefWorkbench'
import ReviewMemory from './pages/ReviewMemory'
import CompareProjects from './pages/CompareProjects'
import RunTrace from './pages/RunTrace'
import Evaluation from './pages/Evaluation'
import PromptSchema from './pages/PromptSchema'

/* -- Airbnb color tokens -- */
const TOKEN = {
  ink: '#222222',
  muted: '#6a6a6a',
  hairline: '#dddddd',
  canvas: '#ffffff',
  rausch: '#ff385c',
  surface: '#f7f7f7',
} as const

const NAV_ITEMS = [
  { to: '/', label: '数据上传', end: true },
  { to: '/insight', label: '机会洞察' },
  { to: '/brief', label: 'Brief 工作台' },
  { to: '/review', label: 'Review & Memory' },
]

export default function App() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const projectId = searchParams.get('project') || ''

  const [showcaseOpen, setShowcaseOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭下拉
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowcaseOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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
          </nav>

          <div style={{ flex: 1 }} />

          {/* Showcase 下拉菜单 */}
          <div ref={dropdownRef} style={{ marginRight: '12px' }}>
            <button
              onClick={() => setShowcaseOpen(v => !v)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                border: `1px solid ${TOKEN.hairline}`,
                borderRadius: '8px',
                padding: '5px 12px',
                fontSize: '12px',
                color: TOKEN.muted,
                backgroundColor: showcaseOpen ? TOKEN.surface : '#ffffff',
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              Showcase
              <span style={{ fontSize: '10px', transition: 'transform 0.2s', transform: showcaseOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
            </button>
            {showcaseOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '64px',
                  right: '24px',
                  backgroundColor: '#ffffff',
                  border: `1px solid ${TOKEN.hairline}`,
                  borderRadius: '10px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  padding: '6px',
                  zIndex: 60,
                  minWidth: '160px',
                }}
              >
                {[
                  ...(projectId ? [{ to: `/compare?projects=${projectId}`, label: '品类对比' }] : []),
                  { to: '/trace', label: 'Run Trace' },
                  { to: '/evaluation', label: 'Evaluation' },
                  { to: '/schema', label: 'Prompt & Schema' },
                ].map((item) => (
                  <button
                    key={item.to}
                    onClick={() => { navigate(item.to); setShowcaseOpen(false) }}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 12px',
                      fontSize: '13px',
                      color: TOKEN.ink,
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = TOKEN.surface)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div
            title="Portfolio demo: all API calls are intercepted by mockFetch.ts and use preloaded data."
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              border: `1px solid ${TOKEN.hairline}`,
              borderRadius: '999px',
              padding: '6px 10px',
              fontSize: '12px',
              color: TOKEN.muted,
              background: '#ffffff',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '999px',
                background: TOKEN.rausch,
                display: 'inline-block',
              }}
            />
            Portfolio Demo · Mock data
          </div>
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
          <Route path="/trace" element={<RunTrace />} />
          <Route path="/evaluation" element={<Evaluation />} />
          <Route path="/schema" element={<PromptSchema />} />
        </Routes>
      </main>
    </div>
  )
}
