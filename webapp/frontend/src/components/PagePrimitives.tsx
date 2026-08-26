import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProject } from '../lib/projectState'
import Symbol from './Symbol'

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

export function StatusBadge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`status-badge ${tone}`}>{children}</span>
}

export function PageHeader({
  step,
  title,
  description,
  actions,
}: {
  step: string
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <header className="page-header">
      <div>
        <span className="page-step">{step}</span>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  )
}

const workflow = [
  { number: '01', label: '机会发现', question: '有什么值得做？', to: '/opportunity' },
  { number: '02', label: '市场研究', question: '这个机会成立吗？', to: '/research' },
  { number: '03', label: '产品定义', question: '具体做什么？', to: '/product' },
  { number: '04', label: '落地验证', question: '做得出来吗？', to: '/feasibility' },
  { number: '05', label: '评审与决策', question: '值得继续吗？', to: '/review' },
]

function getWorkflowTone(index: number, mode: string) {
  if (mode === 'approved') return 'done'
  if (mode === 'paused') return index < 4 ? 'done' : 'paused'
  if (mode === 'revised') return index < 4 ? 'done' : 'current'
  if (index < 2) return 'done'
  if (index === 2) return 'current'
  if (index === 3) return 'blocked'
  return 'locked'
}

export function WorkflowStrip() {
  const { state } = useProject()
  const navigate = useNavigate()

  return (
    <section className="workflow-card" aria-label="产品开发流程">
      <div className="workflow-card-head">
        <span>开发流程</span>
        <strong>
          {state.mode === 'conflict' ? '当前：处理定义与落地冲突' : null}
          {state.mode === 'revised' ? '当前：阶段评审' : null}
          {state.mode === 'approved' ? '本轮评审已完成' : null}
          {state.mode === 'paused' ? '项目已暂停' : null}
        </strong>
      </div>
      <div className="workflow-steps">
        {workflow.map((step, index) => {
          const tone = getWorkflowTone(index, state.mode)
          return (
            <button key={step.to} className={`workflow-step ${tone}`} onClick={() => navigate(step.to)}>
              <span>{step.number}</span>
              <div><strong>{step.label}</strong><small>{step.question}</small></div>
              {tone === 'done' ? <Symbol name="check" /> : null}
            </button>
          )
        })}
      </div>
    </section>
  )
}

export function SectionTitle({ title, meta }: { title: string; meta?: ReactNode }) {
  return <div className="section-title"><h2>{title}</h2>{meta}</div>
}

export function ArrowButton({ children, onClick, className = '' }: { children: ReactNode; onClick: () => void; className?: string }) {
  return <button className={`text-arrow-button ${className}`} onClick={onClick}>{children}<Symbol name="arrow" /></button>
}

export function openAssistant() {
  window.dispatchEvent(new CustomEvent('open-nextly-assistant'))
}
