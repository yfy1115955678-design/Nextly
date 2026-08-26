import { useRef, useState, type DragEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useProject, type UploadedArtifact } from '../lib/projectState'
import Symbol from './Symbol'

interface AssistantPanelProps {
  onClose: () => void
}

function getAssistantContext(pathname: string, mode: string) {
  if (mode === 'approved') {
    return {
      eyebrow: '评审已完成',
      title: '有条件进入打样',
      body: '清洁边界已修订，寿命报告与正式报价已转为打样前置条件。',
      action: '查看决定',
      to: '/review',
    }
  }

  if (mode === 'revised') {
    return {
      eyebrow: '等待人工确认',
      title: '阻塞冲突已解决',
      body: '产品定义已更新为 v2。剩余两项属于推进条件，可以进入阶段评审。',
      action: '进入评审',
      to: '/review',
    }
  }

  if (mode === 'paused') {
    return {
      eyebrow: '项目已暂停',
      title: '保留当前证据与版本',
      body: '所有判断和决定仍可追溯，重置演示后可重新体验完整闭环。',
      action: '查看决定',
      to: '/review',
    }
  }

  const routeContext: Record<string, { eyebrow: string; title: string; body: string; action: string; to: string }> = {
    '/opportunity': {
      eyebrow: '机会 Gate 已确认',
      title: 'O-001 已进入深度研究',
      body: '三个候选方向中，O-001 对高频痛点的覆盖最完整。',
      action: '查看研究',
      to: '/research',
    },
    '/research': {
      eyebrow: '研究 Gate 已确认',
      title: '证据支持继续推进',
      body: '市场、用户与竞品证据一致，但清洁边界需要在落地阶段验证。',
      action: '查看产品定义',
      to: '/product',
    },
    '/product': {
      eyebrow: '发现下游冲突',
      title: 'R-04 超出可制造边界',
      body: '落地验证表明泵体与 PCB 无法进入洗碗机，需要你确认修改范围。',
      action: '处理冲突',
      to: '/feasibility',
    },
    '/feasibility': {
      eyebrow: '等待人工确认',
      title: '清洁结构需要修订',
      body: '我已生成新旧差异和影响范围，确认后会同步更新定义、验证与评审。',
      action: '查看冲突',
      to: '/feasibility',
    },
    '/review': {
      eyebrow: '评审暂未开放',
      title: '先处理清洁边界',
      body: '产品定义与可制造边界仍有一个阻塞冲突，解决后会自动刷新评审建议。',
      action: '处理冲突',
      to: '/feasibility',
    },
    '/trace': {
      eyebrow: '运行记录',
      title: '当前有 1 个待确认 Gate',
      body: 'AI 已完成影响分析，最终修改仍由人工确认。',
      action: '处理冲突',
      to: '/feasibility',
    },
  }

  return routeContext[pathname] ?? {
    eyebrow: '当前主任务',
    title: '确认清洁边界修订',
    body: '落地验证发现一个阻塞冲突，确认后将同步更新三个下游状态。',
    action: '处理冲突',
    to: '/feasibility',
  }
}

export default function AssistantPanel({ onClose }: AssistantPanelProps) {
  const { state, addArtifact } = useProject()
  const location = useLocation()
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [artifact, setArtifact] = useState<UploadedArtifact | null>(state.artifacts[0] ?? null)
  const [task, setTask] = useState('')
  const [taskReply, setTaskReply] = useState('')
  const [fileError, setFileError] = useState('')
  const context = getAssistantContext(location.pathname, state.mode)

  const processFile = (file?: File) => {
    if (!file) return
    if (file.size > 20 * 1024 * 1024) {
      setFileError('文件超过 20 MB，请换一个较小的文件。')
      return
    }
    setFileError('')
    setArtifact(addArtifact(file.name))
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    processFile(event.dataTransfer.files[0])
  }

  const handleTask = () => {
    const trimmed = task.trim()
    if (!trimmed) return
    setTaskReply(`已结合当前项目状态记录“${trimmed}”。本次演示会先定位受影响模块，再由你确认是否更新。`)
    setTask('')
  }

  return (
    <aside className="assistant-panel" aria-label="Nextly AI 助手">
      <header className="assistant-header">
        <div className="assistant-brand">
          <span className="assistant-mark"><Symbol name="sparkle" /></span>
          <div>
            <strong>Nextly 助手</strong>
            <span>读取共享项目状态</span>
          </div>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="收起 AI 助手">
          <Symbol name="close" />
        </button>
      </header>

      <div className="assistant-body">
        <section className="assistant-context">
          <span className="assistant-eyebrow">{context.eyebrow}</span>
          <h2>{context.title}</h2>
          <p>{context.body}</p>
          <button
            className="assistant-action"
            onClick={() => {
              navigate(context.to)
              if (context.to !== location.pathname) onClose()
            }}
          >
            {context.action}<Symbol name="arrow" />
          </button>
        </section>

        {artifact ? (
          <section className="artifact-card" aria-live="polite">
            <div className="artifact-title">
              <Symbol name="file" />
              <div>
                <strong>{artifact.name}</strong>
                <span>{artifact.kind}</span>
              </div>
            </div>
            <p>{artifact.summary}</p>
            <div className="impact-list">
              {artifact.affectedModules.map((module) => <span key={module}>{module}</span>)}
            </div>
          </section>
        ) : null}

        {taskReply ? <p className="assistant-reply" aria-live="polite">{taskReply}</p> : null}
      </div>

      <div
        className={`assistant-composer ${dragging ? 'is-dragging' : ''}`}
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <textarea
          value={task}
          onChange={(event) => setTask(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              handleTask()
            }
          }}
          placeholder="告诉我想处理什么…"
          aria-label="向 Nextly 助手输入任务"
        />
        <div className="composer-actions">
          <button className="upload-button" onClick={() => inputRef.current?.click()}>
            <Symbol name="upload" />上传
          </button>
          <span>可拖拽 · ≤20 MB</span>
          <button className="send-button" onClick={handleTask} disabled={!task.trim()} aria-label="发送任务">
            <Symbol name="arrow" />
          </button>
        </div>
        {fileError ? <p className="file-error">{fileError}</p> : null}
        <input
          ref={inputRef}
          type="file"
          hidden
          accept=".xlsx,.xls,.csv,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
          onChange={(event) => {
            processFile(event.target.files?.[0])
            event.currentTarget.value = ''
          }}
        />
      </div>
    </aside>
  )
}
