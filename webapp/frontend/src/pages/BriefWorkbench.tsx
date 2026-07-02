import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { safeFetch } from '../lib/api'
import {
  IconDocument,
  IconEdit,
  IconEye,
  IconRobot,
  IconSparkles,
  IconSave,
  IconFolder,
  IconHistory,
  IconAlert,
  IconCheckCircle,
  IconChat,
  IconRefresh,
  IconUpload,
  IconArrowRight,
  IconSearch,
  IconUser,
  IconTarget,
  IconDiff,
  IconDownload,
} from '../components/Icons'

const API = '/api/brief'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface QuestionOption {
  label: string
  description?: string
  recommended?: boolean
}

interface Question {
  axis: string
  header?: string
  question: string
  options: QuestionOption[]
}

interface ReviewEntry {
  version: number
  role: string
  action: string
  content: string | null
  issues_found: number | null
  created_at: string
}

interface DiffVersion {
  version: number
  content: string
  created_at: string
}

interface DiffData {
  older: DiffVersion
  newer: DiffVersion
}

interface ChatMsg { role: string; content: string }

type Phase0Status = 'idle' | 'loading' | 'ready' | 'locked'

/* ------------------------------------------------------------------ */
/*  Self-Check  (updated for Phase 0)                                 */
/* ------------------------------------------------------------------ */

const CHECKLIST = [
  { id: 'lock_line_ref',     label: 'Phase 0 锁定方向已在文档首行引用',     pattern: /锁定方向|产品方向|MVP范围/i },
  { id: 'painpoint_quotes',  label: 'Top 3 痛点全部有 ASIN + 星级引用',     pattern: /ASIN|B0/i },
  { id: 'musthave_evidence', label: '每个 Must-have 对应痛点+频次',          pattern: /Must-have/i },
  { id: 'mvp_size_match',    label: 'MVP 功能数匹配 Phase 0 范围',           pattern: /Must-have|MVP/i },
  { id: 'needs_verify',      label: '>= 3 处标注"需要进一步验证"',            pattern: /需要进一步验证|进一步验证|需确认/i },
  { id: 'diff_visible',      label: '首位差异点是物理可见的',                  pattern: /差异化|Differentiation/i },
  { id: 'bom_complete',      label: 'BOM 含装配/QC/认证',                     pattern: /BOM|组装|QC|认证/i },
  { id: 'excluded_users',    label: '有明确的"不做谁"章节',                    pattern: /排除|不面向|NOT targeting|不做谁/i },
  { id: 'price_band_match',  label: '价格带匹配 Phase 0 选择',               pattern: /价格带|价格|Price/i },
]

/* ------------------------------------------------------------------ */
/*  Markdown Preview                                                  */
/* ------------------------------------------------------------------ */

/** Sanitize URL: strip javascript:, data:, and other dangerous protocols */
function sanitizeUrl(url: string): string {
  const trimmed = url.trim()
  const dangerous = /^(javascript|data|vbscript):/i
  if (dangerous.test(trimmed)) return '#blocked'
  // Escape quotes and angle brackets in URL
  return trimmed.replace(/["'<>]/g, '')
}

function MarkdownPreview({ content }: { content: string }) {
  const renderMarkdown = (md: string) => {
    // Escape HTML in the raw content first, then selectively un-escape markdown patterns
    let html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

    // ── Table support (must run before inline patterns) ──
    html = renderTables(html)

    // Now safely apply markdown patterns on escaped content
    html = html
      .replace(/^### (.*)/gm, '<h3 class="text-base font-semibold text-ink mt-4 mb-2">$1</h3>')
      .replace(/^## (.*)/gm, '<h2 class="text-lg font-semibold text-ink mt-5 mb-3 border-b border-hairline pb-1">$1</h2>')
      .replace(/^# (.*)/gm, '<h1 class="text-xl font-bold text-ink mt-6 mb-4">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*)/gm, '<li class="ml-4 list-disc text-sm text-ink">$1</li>')
      .replace(/\[(.*?)\]\((.*?)\)/g, (_m: string, text: string, url: string) =>
        `<a href="${sanitizeUrl(url)}" class="text-rausch underline" target="_blank" rel="noopener noreferrer">${text}</a>`)
      .replace(/^---$/gm, '<hr class="my-4 border-hairline" />')
      .replace(/\n\n/g, '<br/><br/>')
    return html
  }

  return (
    <div
      className="prose prose-sm max-w-none text-sm"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  )
}

/** Convert markdown pipe tables to HTML tables */
function renderTables(text: string): string {
  const lines = text.split('\n')
  const result: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    // Detect a table: line has |, and next line is a separator (|:--|...)
    if (line.includes('|') && i + 1 < lines.length && /^\|?[\s\-:]+\|[\s\-\|:]+$/.test(lines[i + 1].trim())) {
      // Collect header
      const headerCells = line.split('|').filter(c => c.trim() !== '').map(c => c.trim())
      // Skip separator line
      i += 2
      // Collect body rows
      const bodyRows: string[][] = []
      while (i < lines.length && lines[i].includes('|')) {
        bodyRows.push(lines[i].split('|').filter(c => c.trim() !== '').map(c => c.trim()))
        i++
      }
      // Build HTML table
      let table = '<table class="w-full border-collapse text-sm my-3"><thead><tr>'
      for (const h of headerCells) {
        table += `<th class="border border-hairline px-3 py-2 text-left font-semibold" style="background:#f7f7f7; color:#222222;">${h}</th>`
      }
      table += '</tr></thead><tbody>'
      for (const row of bodyRows) {
        table += '<tr>'
        for (let ci = 0; ci < headerCells.length; ci++) {
          const cell = ci < row.length ? row[ci] : ''
          table += `<td class="border border-hairline px-3 py-2" style="color:#222222;">${cell}</td>`
        }
        table += '</tr>'
      }
      table += '</tbody></table>'
      result.push(table)
    } else {
      result.push(line)
      i++
    }
  }

  return result.join('\n')
}

/* ------------------------------------------------------------------ */
/*  Step Indicator  (kept but replaced by pill tabs in layout)         */
/* ------------------------------------------------------------------ */

function StepIndicator({ current, done }: { current: number; done: number[] }) {
  const phases = [
    { label: 'Phase 0', sub: '头脑风暴' },
    { label: 'Phase 1', sub: 'Agent A 生成' },
    { label: 'Phase 2', sub: 'Agent B 审查' },
    { label: 'Phase 3', sub: '迭代编辑' },
  ]

  return (
    <div className="flex items-center gap-0 mb-6">
      {phases.map((p, i) => {
        const isDone = done.includes(i)
        const isCurrent = i === current
        return (
          <div key={i} className="flex items-center gap-0">
            {/* dot + label */}
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full transition-colors ${
                  isDone || isCurrent ? 'bg-ink' : 'bg-hairline'
                }`}
              />
              <span
                className={`text-xs whitespace-nowrap ${
                  isDone || isCurrent ? 'text-ink font-medium' : 'text-muted'
                }`}
              >
                {p.label}
                <span className="hidden sm:inline text-muted-soft ml-0.5">{p.sub}</span>
              </span>
            </div>
            {/* connector line */}
            {i < phases.length - 1 && (
              <div
                className={`w-8 sm:w-12 h-px mx-2 transition-colors ${
                  isDone ? 'bg-ink' : 'bg-hairline'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Lock Banner                                                       */
/* ------------------------------------------------------------------ */

function LockBanner({ lockLine, lockDecisions }: { lockLine: string; lockDecisions: Record<string, string> }) {
  const entries = Object.entries(lockDecisions)
  if (entries.length === 0 && !lockLine) return null

  return (
    <div className="bg-surface-soft border border-hairline rounded-[14px] p-4 mb-4">
      <div className="flex items-start gap-2">
        <IconTarget size={18} className="mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-ink mb-1">锁定方向</p>
          {lockLine ? (
            <p className="text-sm text-ink">{lockLine}</p>
          ) : (
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {entries.map(([axis, choice]) => (
                <span key={axis} className="text-sm text-ink">
                  <span className="text-muted">{axis}: </span>
                  <span className="font-medium">{choice}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  ChatPanel (reusable)                                              */
/* ------------------------------------------------------------------ */

function ChatPanel({
  chatMessages,
  chatInput,
  setChatInput,
  sendChat,
  chatSending,
  loadChatHistory,
  chatEndRef,
  chatContainerRef,
  compact,
}: {
  chatMessages: ChatMsg[]
  chatInput: string
  setChatInput: (v: string) => void
  sendChat: () => void
  chatSending: boolean
  loadChatHistory: () => void
  chatEndRef: React.RefObject<HTMLDivElement | null>
  chatContainerRef: React.RefObject<HTMLDivElement | null>
  compact?: boolean
}) {
  const headerClasses = compact
    ? 'px-3 py-2 border-b border-hairline'
    : 'px-5 py-3 border-b border-hairline'
  const inputPad = compact ? 'p-3' : 'p-4'

  return (
    <div className="card !p-0 flex flex-col" style={{ maxHeight: chatMessages.length > 0 ? (compact ? '280px' : '380px') : 'auto' }}>
      <div className={`${headerClasses} flex items-center justify-between`}>
        <h3 className="text-sm font-semibold text-ink flex items-center gap-1.5">
          <IconChat size={16} />
          Brief 对话
        </h3>
        {chatMessages.length > 0 && (
          <button
            className="text-xs text-muted hover:text-ink"
            onClick={loadChatHistory}
            title="刷新"
          >
            <IconRefresh size={12} />
          </button>
        )}
      </div>
      {chatMessages.length > 0 && (
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: '120px' }}>
          {chatMessages.map((msg, i) => (
            <div
              key={i}
              className={`text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-surface-soft rounded-md p-2.5 ml-4'
                  : 'border border-hairline rounded-md p-2.5 mr-4'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {msg.role === 'user' ? (
                  <IconUser size={10} />
                ) : (
                  <IconRobot size={10} />
                )}
                <span className="font-medium text-ink">
                  {msg.role === 'user' ? '你' : 'AI 助手'}
                </span>
              </div>
              <div className="text-muted whitespace-pre-wrap">{msg.content}</div>
            </div>
          ))}
          <div ref={chatEndRef as React.RefObject<HTMLDivElement>} />
        </div>
      )}
      <div className={`${inputPad} border-t border-hairline flex gap-2`}>
        <input
          type="text"
          className="flex-1 text-sm border border-hairline rounded-sm px-3 py-2 bg-canvas text-ink placeholder:text-muted outline-none focus:border-ink"
          placeholder={chatSending ? '发送中...' : '输入问题...'}
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendChat()}
          disabled={chatSending}
        />
        <button
          className="btn-primary !px-3 text-sm flex-shrink-0"
          onClick={sendChat}
          disabled={chatSending || !chatInput.trim()}
        >
          <IconArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Phase 0 Questions Panel                                           */
/* ------------------------------------------------------------------ */

function Phase0QuestionsPanel({
  questions,
  decisions,
  setDecisions,
  customValues,
  setCustomValues,
  onLock,
  locking,
  chatExpanded,
  setChatExpanded,
  chatMessages,
  chatInput,
  setChatInput,
  sendChat,
  chatSending,
  loadChatHistory,
  chatEndRef,
}: {
  questions: Question[]
  decisions: Record<string, string>
  setDecisions: (d: Record<string, string>) => void
  customValues: Record<string, string>
  setCustomValues: (d: Record<string, string>) => void
  onLock: () => void
  locking: boolean
  chatExpanded: boolean
  setChatExpanded: (v: boolean) => void
  chatMessages: ChatMsg[]
  chatInput: string
  setChatInput: (v: string) => void
  sendChat: () => void
  chatSending: boolean
  loadChatHistory: () => void
  chatEndRef: React.RefObject<HTMLDivElement | null>
}) {
  const OTHER_KEY = '__other__'

  const handleSelect = (axis: string, choice: string) => {
    const next = { ...decisions }
    const current = next[axis] || ''
    const items = current ? current.split(',').filter(Boolean) : []
    const idx = items.indexOf(choice)
    if (idx >= 0) {
      items.splice(idx, 1)
    } else {
      items.push(choice)
    }
    next[axis] = items.join(',')
    setDecisions(next)
  }

  const handleCustomChange = (axis: string, value: string) => {
    setCustomValues({ ...customValues, [axis]: value })
  }

  const isOtherSelected = (axis: string) => {
    const val = decisions[axis]
    if (!val) return false
    const items = val.split(',').filter(Boolean)
    return items.includes(OTHER_KEY)
  }

  const allAnswered = questions.every((q) => {
    const v = decisions[q.axis]
    return v && v.trim().length > 0
  })

  return (
    <div className="card mb-6">
      <div className="flex items-center gap-2 mb-4">
        <IconSparkles size={20} />
        <h3 className="text-lg font-semibold text-ink">Phase 0 -- 决策方向</h3>
      </div>
      <p className="text-sm text-muted mb-6">
        请为以下每个维度选择一个方向，带星标的为推荐选项。
      </p>

      <div className="space-y-5">
        {questions.map((q) => {
          const otherSelected = isOtherSelected(q.axis)
          return (
            <div key={q.axis}>
              <p className="text-sm font-medium text-ink mb-3">{q.question}</p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const selected = (decisions[q.axis] || '').split(',').filter(Boolean).includes(opt.label)
                  return (
                    <label
                      key={oi}
                      className={`flex items-center gap-3 p-3 rounded-md border transition-colors cursor-pointer ${
                        selected
                          ? 'border-ink bg-surface-soft'
                          : 'border-hairline hover:bg-surface-soft'
                      }`}
                    >
                      <div className="relative flex-shrink-0">
                        <input
                          type="checkbox"
                          name={q.axis}
                          className="sr-only"
                          checked={selected}
                          onChange={() => handleSelect(q.axis, opt.label)}
                        />
                        <div
                          className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center transition-colors ${
                            selected ? 'border-ink bg-ink' : 'border-hairline'
                          }`}
                        >
                          {selected && (
                            <span className="text-white text-xs leading-none font-bold">&#x2713;</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <span className={`text-sm ${selected ? 'text-ink font-medium' : 'text-ink'}`}>
                          {opt.label}
                        </span>
                        {opt.description && (
                          <p className="text-xs text-muted mt-0.5">{opt.description}</p>
                        )}
                      </div>
                      {opt.recommended && (
                        <span className="text-xs text-muted flex items-center gap-0.5 flex-shrink-0">
                          <IconSparkles size={12} />
                          推荐
                        </span>
                      )}
                    </label>
                  )
                })}

                {/* -- Other (custom) option -- */}
                <label
                  className={`flex items-center gap-3 p-3 rounded-md border transition-colors cursor-pointer ${
                    otherSelected
                      ? 'border-ink bg-surface-soft'
                      : 'border-hairline hover:bg-surface-soft'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <input
                      type="checkbox"
                      name={q.axis}
                      className="sr-only"
                      checked={otherSelected}
                      onChange={() => handleSelect(q.axis, OTHER_KEY)}
                    />
                    <div
                      className={`w-5 h-5 rounded-sm border-2 flex items-center justify-center transition-colors ${
                        otherSelected ? 'border-ink bg-ink' : 'border-hairline'
                      }`}
                    >
                      {otherSelected && (
                        <span className="text-white text-xs leading-none font-bold">&#x2713;</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    {otherSelected ? (
                      <input
                        type="text"
                        className="w-full text-sm bg-transparent border-b border-hairline outline-none focus:border-ink py-1 text-ink placeholder:text-muted"
                        placeholder="请输入自定义方向..."
                        value={customValues[q.axis] || ''}
                        onChange={(e) => handleCustomChange(q.axis, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="text-sm text-muted">其他（自定义填写）</span>
                    )}
                  </div>
                </label>
              </div>
            </div>
          )
        })}
      </div>

      {/* ---- Collapsible Ask AI chat ---- */}
      <div className="mt-5 pt-4 border-t border-hairline">
        <button
          className="flex items-center gap-2 text-sm text-muted hover:text-ink transition-colors w-full"
          onClick={() => setChatExpanded(!chatExpanded)}
        >
          <IconChat size={16} />
          <span>{chatExpanded ? '收起 Ask AI' : 'Ask AI（询问方向建议）'}</span>
          <svg
            className={`w-4 h-4 ml-auto transition-transform ${chatExpanded ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {chatExpanded && (
          <div className="mt-3">
            <ChatPanel
              chatMessages={chatMessages}
              chatInput={chatInput}
              setChatInput={setChatInput}
              sendChat={sendChat}
              chatSending={chatSending}
              loadChatHistory={loadChatHistory}
              chatEndRef={chatEndRef}
              chatContainerRef={chatContainerRef}
              compact
            />
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-hairline flex justify-end">
        <button
          className="btn-primary flex items-center gap-2"
          disabled={!allAnswered || locking}
          onClick={onLock}
        >
          {locking ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              锁定中...
            </>
          ) : (
            <>
              <IconTarget size={16} />
              锁定方向
            </>
          )}
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Inline word-level diff (simple)                                   */
/* ------------------------------------------------------------------ */

interface DiffChunk {
  type: 'same' | 'added' | 'deleted'
  text: string
}

/** Max characters for diff computation to prevent browser freeze */
const DIFF_MAX_CHARS = 20000

function computeWordDiff(oldStr: string, newStr: string): { old: DiffChunk[]; new: DiffChunk[] } {
  // Truncate long content to prevent performance issues
  const oldTruncated = oldStr.length > DIFF_MAX_CHARS ? oldStr.slice(0, DIFF_MAX_CHARS) + '\n... (truncated)' : oldStr
  const newTruncated = newStr.length > DIFF_MAX_CHARS ? newStr.slice(0, DIFF_MAX_CHARS) + '\n... (truncated)' : newStr

  const oldWords = oldTruncated.split(/(\s+)/)
  const newWords = newTruncated.split(/(\s+)/)

  // LCS-based diff
  const m = oldWords.length
  const n = newWords.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to build diff
  const oldChunks: DiffChunk[] = []
  const newChunks: DiffChunk[] = []

  function backtrack(i: number, j: number) {
    if (i === 0 && j === 0) return
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      backtrack(i - 1, j - 1)
      oldChunks.push({ type: 'same', text: oldWords[i - 1] })
      newChunks.push({ type: 'same', text: newWords[j - 1] })
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      backtrack(i, j - 1)
      oldChunks.push({ type: 'deleted', text: '' })
      newChunks.push({ type: 'added', text: newWords[j - 1] })
    } else if (i > 0) {
      backtrack(i - 1, j)
      oldChunks.push({ type: 'deleted', text: oldWords[i - 1] })
      newChunks.push({ type: 'added', text: '' })
    }
  }

  backtrack(m, n)
  return { old: oldChunks, new: newChunks }
}

function DiffSideBySide({ older, newer }: { older: DiffVersion; newer: DiffVersion }) {
  const { old: oldChunks, new: newChunks } = computeWordDiff(older.content, newer.content)

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleString('zh-CN')
    } catch {
      return ts
    }
  }

  return (
    <div className="flex gap-0 border border-hairline rounded-sm overflow-hidden">
      {/* Older (left) */}
      <div className="flex-1 min-w-0 border-r border-hairline">
        <div className="bg-surface-soft px-3 py-2 border-b border-hairline flex items-center justify-between">
          <span className="text-xs font-medium text-muted">
            v{older.version} （旧版本）
          </span>
          <span className="text-xs text-muted-soft">
            {formatTime(older.created_at)}
          </span>
        </div>
        <div className="p-4 text-sm font-mono leading-relaxed overflow-auto max-h-[70vh] break-all whitespace-pre-wrap">
          {oldChunks.map((chunk, i) => (
            <span
              key={i}
              className={
                chunk.type === 'deleted'
                  ? 'bg-[#ffdce0] text-[#86181d]'
                  : chunk.type === 'added'
                  ? 'bg-transparent'
                  : ''
              }
            >
              {chunk.text}
            </span>
          ))}
        </div>
      </div>

      {/* Newer (right) */}
      <div className="flex-1 min-w-0">
        <div className="bg-surface-soft px-3 py-2 border-b border-hairline flex items-center justify-between">
          <span className="text-xs font-medium text-muted">
            v{newer.version} （新版本）
          </span>
          <span className="text-xs text-muted-soft">
            {formatTime(newer.created_at)}
          </span>
        </div>
        <div className="p-4 text-sm font-mono leading-relaxed overflow-auto max-h-[70vh] break-all whitespace-pre-wrap">
          {newChunks.map((chunk, i) => (
            <span
              key={i}
              className={
                chunk.type === 'added'
                  ? 'bg-[#dcffe4] text-[#176f2c]'
                  : chunk.type === 'deleted'
                  ? 'bg-transparent'
                  : ''
              }
            >
              {chunk.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  iPhone bottom safe area fix                                       */
/* ------------------------------------------------------------------ */

const IPHONE_FIX = { paddingBottom: 'env(safe-area-inset-bottom, 20px)' }

/* ================================================================== */
/*  Main Component                                                    */
/* ================================================================== */

const PHASES = [
  { key: 0, label: 'Phase 0', sub: '头脑风暴' },
  { key: 1, label: 'Phase 1', sub: '生成' },
  { key: 2, label: 'Phase 2', sub: '审查' },
  { key: 3, label: 'Phase 3', sub: '迭代' },
]

export default function BriefWorkbench() {
  const [searchParams, setSearchParams] = useSearchParams()
  const projectId = searchParams.get('project') || ''

  /* ---- Phase 0 ---- */
  const [phase0Status, setPhase0Status] = useState<Phase0Status>('idle')
  const [questions, setQuestions] = useState<Question[]>([])
  const [decisions, setDecisions] = useState<Record<string, string>>({})
  const [lockLine, setLockLine] = useState('')
  const [lockDecisions, setLockDecisions] = useState<Record<string, string>>({})
  const [lockingPhase0, setLockingPhase0] = useState(false)
  const [customValues, setCustomValues] = useState<Record<string, string>>({})

  /* ---- Standalone upload ---- */
  const [category, setCategory] = useState('')
  const [researchFile, setResearchFile] = useState<File | null>(null)
  const [researchText, setResearchText] = useState('')
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file')
  const [uploadLoading, setUploadLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ---- Active phase tab ---- */
  const [activePhase, setActivePhase] = useState<number>(0)

  /* ---- Brief state ---- */
  const [briefContent, setBriefContent] = useState('')
  const [generating, setGenerating] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [autoRevising, setAutoRevising] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reviewResult, setReviewResult] = useState('')
  const [reviewIssues, setReviewIssues] = useState({ high: 0, medium: 0 })
  const [versionHistory, setVersionHistory] = useState<ReviewEntry[]>([])
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'review' | 'diff'>('edit')
  const [phase1Tab, setPhase1Tab] = useState<'edit' | 'preview'>('edit')
  const [p2Tab, setP2Tab] = useState<'review' | 'edit'>('review')  // Phase 2 sub-tab
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  /* ---- Version Diff ---- */
  const [diffData, setDiffData] = useState<DiffData | null>(null)
  const [loadingDiff, setLoadingDiff] = useState(false)

  /* ---- Chat state ---- */
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [chatExpanded, setChatExpanded] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  /* ================================================================ */
  /*  Phase completion checks                                          */
  /* ================================================================ */

  const phase0Complete = phase0Status === 'locked'
  const phase1Complete = !!briefContent
  const phase2Complete = !!reviewResult
  const phase3Complete = versionHistory.length > 1 && versionHistory.some((v) => v.role === 'agent_b')

  const phaseCompleted = (phase: number): boolean => {
    if (phase === 0) return phase0Complete
    if (phase === 1) return phase1Complete
    if (phase === 2) return phase2Complete
    if (phase === 3) return phase3Complete
    return false
  }

  /* ---- Prerequisite check for phase click ---- */
  const handlePhaseClick = (phase: number) => {
    if (phase >= 1 && !phase0Complete) {
      setError('请先完成 Phase 0（头脑风暴）阶段')
      return
    }
    if (phase >= 2 && !phase1Complete) {
      setError('请先完成 Phase 1（生成 Brief）阶段')
      return
    }
    if (phase >= 3 && !phase2Complete) {
      setError('请先完成 Phase 2（审查）阶段')
      return
    }
    setActivePhase(phase)
    setError('')
  }

  /* ================================================================ */
  /*  Load latest (pipeline mode)                                      */
  /* ================================================================ */

  const loadLatest = useCallback(async () => {
    if (!projectId) return
    try {
      const data = await safeFetch(`${API}/latest/${projectId}`)

      if (data.brief && !briefContent) setBriefContent(data.brief)
      if (data.version_history) setVersionHistory(data.version_history)

      /* Phase 0 recovery */
      if (data.lock_line) {
        setLockLine(data.lock_line)
        setLockDecisions(data.lock_decisions || {})
        setPhase0Status('locked')
      } else if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions)
        setPhase0Status('ready')
      }
      /* else stays idle — this is expected for fresh projects */
    } catch {
      setError('无法加载项目数据，请刷新重试')
    }
  }, [projectId])

  useEffect(() => {
    loadLatest()
  }, [loadLatest])

  /* ---- Chat: load history ---- */
  const loadChatHistory = useCallback(async () => {
    if (!projectId) return
    try {
      const data = await safeFetch(`${API}/chat/${projectId}`)
      if (data.conversations) setChatMessages(data.conversations)
    } catch { /* silent */ }
  }, [projectId])

  useEffect(() => {
    loadChatHistory()
    const interval = setInterval(loadChatHistory, 8000)
    return () => clearInterval(interval)
  }, [loadChatHistory])

  // 自动滚动聊天（仅在自己容器内，不干扰页面）
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

  /* ---- Chat: send message ---- */
  const sendChat = async () => {
    if (!chatInput.trim() || !projectId || chatSending) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', content: msg }])
    setChatSending(true)
    try {
      const data = await safeFetch(`${API}/chat/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msg }),
      })
      setChatMessages(prev => [...prev, { role: 'ai', content: data.content || '（无回复）' }])
    } catch (e: any) {
      setChatMessages(prev => [...prev, { role: 'ai', content: `错误: ${e.message}` }])
    } finally {
      setChatSending(false)
    }
  }

  /* ================================================================ */
  /*  Standalone upload: start brainstorming, redirect to pipeline      */
  /* ================================================================ */

  const startStandaloneBrainstorm = async () => {
    if (!category.trim()) {
      setError('请输入品类')
      return
    }
    if (uploadMode === 'text' && !researchText.trim()) {
      setError('请粘贴调研报告内容')
      return
    }
    if (uploadMode === 'file' && !researchFile) {
      setError('请上传调研报告文件')
      return
    }

    setUploadLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('category', category.trim())
      if (uploadMode === 'file' && researchFile) {
        formData.append('research_file', researchFile)
      } else {
        formData.append('research_text', researchText)
      }

      const data = await safeFetch(`${API}/phase0/standalone-questions`, {
        method: 'POST',
        body: formData,
      })

      if (data && (data.ok || data.project_id)) {
        /* Redirect to pipeline view via setSearchParams */
        if (data.project_id) {
          setSearchParams({ project: data.project_id })
        } else {
          setError('服务器未返回项目 ID，请重试')
          setUploadLoading(false)
        }
      } else {
        setError(data?.detail || data?.error || '获取头脑风暴问题失败')
        setUploadLoading(false)
      }
    } catch (e: any) {
      setError(e.message)
      setUploadLoading(false)
    }
  }

  /* ================================================================ */
  /*  Phase 0: Start brainstorming (pipeline)                          */
  /* ================================================================ */

  const startBrainstorm = async () => {
    if (!projectId) {
      setError('缺少项目ID，请从数据上传页重新进入')
      return
    }
    setPhase0Status('loading')
    setError('')
    try {
      const data = await safeFetch(`${API}/phase0/questions/${projectId}`, { method: 'POST' })
      if (data && data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions)
        setDecisions({})
        setCustomValues({})
        setPhase0Status('ready')
      } else {
        setError(data?.detail || data?.error || 'LLM未能返回有效决策问题，请重试')
        setPhase0Status('idle')
      }
    } catch (e: any) {
      setError(e.message || '头脑风暴请求失败')
      setPhase0Status('idle')
    }
  }

  /* ================================================================ */
  /*  Phase 0: Lock decisions                                          */
  /* ================================================================ */

  const confirmDecisions = async () => {
    if (!projectId) return
    setLockingPhase0(true)
    setError('')
    try {
      const data = await safeFetch(`${API}/phase0/confirm/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisions }),
      })
      if (data.ok || data.lock_line) {
        setLockLine(data.lock_line || '')
        setLockDecisions(data.lock_decisions || decisions)
        setPhase0Status('locked')
        setMessage('Phase 0 方向已锁定')
        // 自动跳转到 Phase 1
        setActivePhase(1)
        setError('')
      } else {
        setError(data.detail || '锁定失败')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLockingPhase0(false)
    }
  }

  /* ================================================================ */
  /*  Phase 1: Generate Brief (always pipeline API)                    */
  /* ================================================================ */

  const generateBrief = async () => {
    if (!projectId) return
    setGenerating(true)
    setError('')
    try {
      const data = await safeFetch(`${API}/generate/${projectId}`, { method: 'POST' })
      if (data.ok) {
        setBriefContent(data.brief)
        setMessage('Agent A 已生成初版 Brief')
        setReviewResult('')
        setActiveTab('edit')
        await loadLatest()
      } else {
        setError(data.detail || '生成失败')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  /* ================================================================ */
  /*  Phase 2: Agent B review                                          */
  /* ================================================================ */

  const reviewBrief = async () => {
    if (!briefContent.trim() || !projectId) return
    setReviewing(true)
    setError('')
    try {
      const data = await safeFetch(`${API}/review/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief_content: briefContent }),
      })
      if (data.ok) {
        setReviewResult(data.review)
        setReviewIssues(data.issues || { high: 0, medium: 0 })
        setActiveTab('review')
        setMessage(`Agent B 审查完成：${data.issues.high} 高 / ${data.issues.medium} 中`)
        await loadLatest()
      } else {
        setError(data.detail || '审查失败')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setReviewing(false)
    }
  }

  /* ================================================================ */
  /*  Auto-revise (根据审查意见自动修改)                                */
  /* ================================================================ */

  const autoRevise = async () => {
    if (!briefContent.trim() || !reviewResult.trim() || !projectId) return
    setAutoRevising(true)
    setError('')
    try {
      const data = await safeFetch(`${API}/auto-revise/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief_content: briefContent, review_content: reviewResult }),
      })
      setBriefContent(data.revised_brief)
      setReviewResult('')
      setReviewIssues({ high: 0, medium: 0 })
      setActivePhase(1)  // 自动跳回 Phase 1 查看修改结果
      setPhase1Tab('preview')  // 默认预览模式
      setMessage('已根据审查意见自动修改 Brief，已跳回 Phase 1')
      await loadLatest()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setAutoRevising(false)
    }
  }

  /* ================================================================ */
  /*  Version Diff                                                     */
  /* ================================================================ */

  const fetchDiff = async () => {
    if (!projectId) return
    setLoadingDiff(true)
    setError('')
    setDiffData(null)
    try {
      const data = await safeFetch(`${API}/diff/${projectId}`)
      setDiffData(data)
      setActiveTab('diff')
    } catch (e: any) {
      setError(e.message || '无法加载版本对比')
    } finally {
      setLoadingDiff(false)
    }
  }

  /* ================================================================ */
  /*  Manual save                                                      */
  /* ================================================================ */

  const saveEdit = async () => {
    if (!projectId) return
    setSaving(true)
    try {
      const data = await safeFetch(`${API}/save/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief_content: briefContent, comment: '人工编辑保存' }),
      })
      setMessage(`已保存 v${data.version}`)
      await loadLatest()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  /* ================================================================ */
  /*  Tab key indentation                                              */
  /* ================================================================ */

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = textareaRef.current
      if (!ta) return
      const start = ta.selectionStart
      const end = ta.selectionEnd
      setBriefContent(briefContent.substring(0, start) + '  ' + briefContent.substring(end))
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = start + 2
      }, 0)
    }
  }

  /* ================================================================ */
  /*  Self-Check                                                       */
  /* ================================================================ */

  const checkResults = CHECKLIST.map((item) => ({
    ...item,
    passed: item.pattern.test(briefContent),
  }))
  const checkPassed = checkResults.filter((c) => c.passed).length
  const checkTotal = checkResults.length

  /* ================================================================ */
  /*  Render: Standalone mode (no projectId)                           */
  /* ================================================================ */

  if (!projectId) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <IconDocument size={60} />
          </div>
          <h2 className="text-2xl font-semibold text-ink mb-2">Brief 工作台</h2>
          <p className="text-muted">上传已有的调研报告，AI 引导决策方向并自动生成 Product Brief</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 border border-hairline rounded-sm bg-canvas text-sm text-error">
            {error}
            <button className="ml-2 underline text-muted hover:text-ink" onClick={() => setError('')}>
              x
            </button>
          </div>
        )}

        {/* Category input */}
        <div className="card mb-4">
          <label className="block text-sm font-medium text-ink mb-2">品类</label>
          <input
            type="text"
            className="input-field"
            placeholder="例如：宠物用品"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>

        {/* Upload mode toggle */}
        <div className="card mb-4">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setUploadMode('file')}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                uploadMode === 'file'
                  ? 'bg-ink text-canvas'
                  : 'bg-surface-soft text-muted hover:bg-hairline-soft'
              }`}
            >
              <IconFolder size={16} />
              上传文件
            </button>
            <button
              onClick={() => setUploadMode('text')}
              className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                uploadMode === 'text'
                  ? 'bg-ink text-canvas'
                  : 'bg-surface-soft text-muted hover:bg-hairline-soft'
              }`}
            >
              <IconEdit size={16} />
              粘贴文本
            </button>
          </div>

          {uploadMode === 'file' ? (
            <div
              className={`border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-colors ${
                researchFile ? 'border-ink bg-surface-soft' : 'border-hairline hover:border-ink'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.txt,.xlsx"
                className="hidden"
                onChange={(e) => setResearchFile(e.target.files?.[0] || null)}
              />
              {researchFile ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="tag tag-blue">
                    <IconDocument size={14} className="inline mr-1" />
                    {researchFile.name}
                  </span>
                  <span className="text-xs text-muted">(点击更换)</span>
                </div>
              ) : (
                <div>
                  <div className="flex justify-center mb-2">
                    <IconUpload size={36} />
                  </div>
                  <p className="text-sm text-muted">拖拽或点击上传调研报告</p>
                  <p className="text-xs text-muted-soft mt-1">支持 .md / .txt / .xlsx</p>
                </div>
              )}
            </div>
          ) : (
            <textarea
              className="w-full h-48 p-4 border border-hairline rounded-sm text-sm font-mono resize-none bg-canvas text-ink placeholder:text-muted outline-none focus:border-ink"
              placeholder="粘贴你的调研报告内容...（竞品洞察、痛点分析、市场结构等）"
              value={researchText}
              onChange={(e) => setResearchText(e.target.value)}
            />
          )}
        </div>

        {/* Start brainstorm button */}
        <div className="flex justify-center">
          <button
            className="btn-primary text-lg flex items-center gap-2"
            disabled={uploadLoading}
            onClick={startStandaloneBrainstorm}
          >
            {uploadLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                头脑风暴中...
              </>
            ) : (
              <>
                <IconSparkles size={18} />
                开始头脑风暴
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  /* ================================================================ */
  /*  Render: Pipeline mode (has projectId)                            */
  /* ================================================================ */

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 80px)', maxWidth: '1280px', margin: '0 auto', padding: '0 24px', width: '100%' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold text-ink mb-1 flex items-center gap-2">
            <IconDocument size={24} />
            Brief 工作台
          </h2>
          <p className="text-sm text-muted">
            Phase 0 头脑风暴 - Agent A 生成 - Agent B 审查 - 迭代通过
          </p>
        </div>
        <div className="flex items-center gap-3">
          {versionHistory.length > 0 && (
            <span className="text-xs text-muted">共 {versionHistory.length} 个版本</span>
          )}
          {/* Export button */}
          {briefContent && (
            <button
              className="btn-outline flex items-center gap-1 no-underline"
              onClick={async () => {
                try {
                  const res = await fetch(`${API}/export/${projectId}`)
                  const blob = await res.blob()
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'Brief_宠物饮水机_demo.md'
                  a.click()
                  URL.revokeObjectURL(url)
                } catch { /* ignore */ }
              }}
            >
              <IconDownload size={16} />
              导出 .md
            </button>
          )}
          {briefContent && (
            <button
              className="btn-outline flex items-center gap-1"
              onClick={saveEdit}
              disabled={saving}
            >
              {saving ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <IconSave size={16} />
              )}
              保存
            </button>
          )}
        </div>
      </div>

      {/* Pill-shaped phase tabs (replaces StepIndicator) */}
      <div
        className="rounded-[14px] border p-3 mb-4"
        style={{ backgroundColor: '#ffffff', borderColor: '#dddddd' }}
      >
        <div className="flex gap-1">
          {PHASES.map((p) => {
            const isActive = activePhase === p.key
            const isCompleted = phaseCompleted(p.key)
            return (
              <button
                key={p.key}
                onClick={() => handlePhaseClick(p.key)}
                className="flex-1 py-2 rounded-full text-sm font-medium flex flex-col items-center transition-colors"
                style={{
                  backgroundColor: isActive ? '#222222' : 'transparent',
                  color: isActive ? '#ffffff' : isCompleted ? '#222222' : '#6a6a6a',
                  border: '1px solid ' + (!isActive && isCompleted ? '#dddddd' : 'transparent'),
                }}
              >
                <span className="text-xs">{p.label}</span>
                <span className="text-[11px]" style={{ color: isActive ? '#ffffff' : '#6a6a6a' }}>{p.sub}</span>
                {isCompleted && (
                  <span className="mt-0.5"><IconCheckCircle size={10} /></span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* LockBanner -- always visible when Phase 0 is locked */}
      {phase0Complete && (lockLine || Object.keys(lockDecisions).length > 0) && (
        <LockBanner lockLine={lockLine} lockDecisions={lockDecisions} />
      )}
      {phase0Complete && !lockLine && Object.keys(lockDecisions).length === 0 && (
        <div className="bg-surface-soft border border-hairline rounded-[14px] p-4 mb-4">
          <p className="text-sm text-muted">方向已锁定，正在加载...</p>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 border border-hairline rounded-sm bg-canvas text-sm text-error">
          {error}
          <button className="ml-2 underline text-muted hover:text-ink" onClick={() => setError('')}>
            x
          </button>
        </div>
      )}
      {message && (
        <div className="mb-4 p-4 border border-hairline rounded-sm bg-canvas text-sm text-ink">
          {message}
          <button className="ml-2 underline text-muted hover:text-ink" onClick={() => setMessage('')}>
            x
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/*  Main content area: flex [content + right sidebar]            */}
      {/* ============================================================ */}
      <div className="flex gap-6 flex-1" style={{ minHeight: 0 }}>
        {/* Left: main content by phase */}
        <div className="flex-1 flex flex-col overflow-y-auto" style={{ minHeight: 0 }}>
          {/* ----- Phase 0 content ----- */}
          {activePhase === 0 && (
            <>
              {phase0Status === 'idle' && (
                <div className="card mb-6 text-center py-10">
                  <div className="flex justify-center mb-3">
                    <IconSparkles size={40} />
                  </div>
                  <p className="text-sm text-ink font-medium mb-1">Phase 0 -- 头脑风暴</p>
                  <p className="text-xs text-muted mb-5">
                    AI 将根据报告提出关键的决策问题，帮助你确定产品方向
                  </p>
                  <button className="btn-primary flex items-center gap-2 mx-auto" onClick={startBrainstorm}>
                    <IconSparkles size={16} />
                    开始头脑风暴
                  </button>
                </div>
              )}

              {phase0Status === 'loading' && (
                <div className="card mb-6 text-center py-8">
                  <div className="flex justify-center mb-3">
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="#222222"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="#222222"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-muted">正在生成决策问题...</p>
                </div>
              )}

              {phase0Status === 'ready' && questions.length > 0 && (
                <Phase0QuestionsPanel
                  questions={questions}
                  decisions={decisions}
                  setDecisions={setDecisions}
                  customValues={customValues}
                  setCustomValues={setCustomValues}
                  onLock={confirmDecisions}
                  locking={lockingPhase0}
                  chatExpanded={chatExpanded}
                  setChatExpanded={setChatExpanded}
                  chatMessages={chatMessages}
                  chatInput={chatInput}
                  setChatInput={setChatInput}
                  sendChat={sendChat}
                  chatSending={chatSending}
                  loadChatHistory={loadChatHistory}
                  chatEndRef={chatEndRef}
                />
              )}

              {/* Phase 0 locked but still on Phase 0 tab: show summary */}
              {phase0Status === 'locked' && (
                <div className="card mb-6 text-center py-10">
                  <div className="flex justify-center mb-3">
                    <IconCheckCircle size={40} />
                  </div>
                  <p className="text-sm text-ink font-medium mb-1">Phase 0 已完成</p>
                  <p className="text-xs text-muted mb-3">
                    方向已锁定，切换到 Phase 1 生成 Brief
                  </p>
                  <button
                    className="btn-primary flex items-center gap-2 mx-auto"
                    onClick={() => { setActivePhase(1); setError('') }}
                  >
                    <IconArrowRight size={16} />
                    进入 Phase 1
                  </button>
                </div>
              )}
            </>
          )}

          {/* ----- Phase 1 content: Generate button + editor/preview ----- */}
          {activePhase === 1 && (
            <>
              {/* No brief yet: show generate button */}
              {!briefContent && (
                <div className="text-center">
                  <div className="card text-center py-14 mb-4">
                    <div className="flex justify-center mb-3">
                      <IconRobot size={40} />
                    </div>
                    <p className="text-sm text-ink font-medium mb-1">Phase 1 -- Agent A 生成 Brief</p>
                    <p className="text-xs text-muted mb-5">
                      点击下方按钮，Agent A 将根据锁定方向生成产品 Brief。
                    </p>
                    <button
                      className="btn-primary text-lg flex items-center gap-2 mx-auto"
                      disabled={generating}
                      onClick={generateBrief}
                    >
                      {generating ? (
                        <>
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Agent A 生成中...
                        </>
                      ) : (
                        <>
                          <IconRobot size={18} />
                          生成 Brief
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Brief exists: edit + preview sub-tabs */}
              {briefContent && (
                <div className="flex flex-col flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
                  {/* Phase 1 sub-tabs */}
                  <div className="flex border-b border-hairline">
                    <button
                      onClick={() => setPhase1Tab('edit')}
                      className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                        phase1Tab === 'edit'
                          ? 'text-ink border-ink'
                          : 'text-muted border-transparent hover:text-ink'
                      }`}
                    >
                      <IconEdit size={16} />
                      编辑
                    </button>
                    <button
                      onClick={() => setPhase1Tab('preview')}
                      className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                        phase1Tab === 'preview'
                          ? 'text-ink border-ink'
                          : 'text-muted border-transparent hover:text-ink'
                      }`}
                    >
                      <IconEye size={16} />
                      预览
                    </button>
                  </div>

                  {/* Phase 1 tab content */}
                  <div className="flex-1 flex flex-col bg-canvas border-x border-b border-hairline rounded-b-sm overflow-hidden">
                    {phase1Tab === 'edit' && (
                      <textarea
                        ref={textareaRef}
                        className="w-full flex-1 min-h-0 p-6 font-mono text-sm resize-none bg-surface-soft text-ink placeholder:text-muted outline-none border-0 focus:outline-none"
                        placeholder="编辑 Brief 内容..."
                        value={briefContent}
                        onChange={(e) => setBriefContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                      />
                    )}
                    {phase1Tab === 'preview' && (
                      <div className="p-6 overflow-y-auto flex-1 min-h-0">
                        {briefContent ? (
                          <MarkdownPreview content={briefContent} />
                        ) : (
                          <div className="text-center py-16 text-muted">暂无内容</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Phase 1 bottom bar */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3">
                      <button
                        className="btn-outline flex items-center gap-1"
                        onClick={saveEdit}
                        disabled={saving}
                      >
                        {saving ? (
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <IconSave size={16} />
                        )}
                        保存
                      </button>
                      <button
                        className={`btn-outline flex items-center gap-1 ${generating ? 'opacity-50 pointer-events-none' : ''}`}
                        disabled={generating}
                        onClick={generateBrief}
                        title="AI 根据锁定方向重新生成 Brief，会覆盖当前编辑内容"
                      >
                        {generating ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            生成中...
                          </>
                        ) : (
                          <>
                            <IconRobot size={16} />
                            AI 重新生成
                          </>
                        )}
                      </button>
                      <span className="text-xs text-muted">
                        {briefContent ? `${briefContent.length} 字符` : ''}
                      </span>
                    </div>
                    <span className="text-xs text-muted">Phase 1 · Agent A 生成</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ----- Phase 2 content: Agent B review + Brief 编辑 ----- */}
          {activePhase === 2 && (
            <>
              {!briefContent ? (
                <div className="card text-center py-14 mb-4">
                  <div className="flex justify-center mb-3">
                    <IconAlert size={40} />
                  </div>
                  <p className="text-sm text-ink font-medium mb-1">请先生成 Brief</p>
                  <p className="text-xs text-muted mb-4">
                    请先切换到 Phase 1 生成 Brief，然后回到 Phase 2 进行审查。
                  </p>
                  <button
                    className="btn-primary flex items-center gap-2 mx-auto"
                    onClick={() => { setActivePhase(1); setError('') }}
                  >
                    <IconArrowRight size={16} />
                    进入 Phase 1
                  </button>
                </div>
              ) : reviewing ? (
                <div className="card text-center py-14 mb-4">
                  <div className="flex justify-center mb-3">
                    <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#222222" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="#222222" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted">Agent B 正在审查 Brief...</p>
                </div>
              ) : (
                <div className="flex flex-col flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
                  {reviewResult && (
                    <>
                      {/* Phase 2 sub-tabs: 审查结果 / 编辑 Brief */}
                      <div className="flex border-b border-hairline flex-shrink-0">
                        <button
                          onClick={() => setP2Tab('review')}
                          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                            p2Tab === 'review' ? 'text-ink border-ink' : 'text-muted border-transparent hover:text-ink'
                          }`}
                        >
                          <IconSearch size={16} />
                          审查结果
                          <span className="text-xs px-2 py-0.5 rounded-full border border-hairline text-muted ml-1">
                            {reviewIssues.high}高/{reviewIssues.medium}中
                          </span>
                        </button>
                        <button
                          onClick={() => setP2Tab('edit')}
                          className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                            p2Tab === 'edit' ? 'text-ink border-ink' : 'text-muted border-transparent hover:text-ink'
                          }`}
                        >
                          <IconEdit size={16} />
                          编辑 Brief
                        </button>
                      </div>

                      {/* Phase 2 sub-tab content */}
                      <div className="flex-1 flex flex-col bg-canvas border-x border-b border-hairline rounded-b-sm overflow-hidden">
                        {p2Tab === 'review' ? (
                          <div className="p-6 overflow-y-auto flex-1 min-h-0">
                            <MarkdownPreview content={reviewResult} />
                          </div>
                        ) : (
                          <textarea
                            className="w-full flex-1 min-h-0 p-6 font-mono text-sm resize-none bg-surface-soft text-ink placeholder:text-muted outline-none border-0 focus:outline-none"
                            placeholder="编辑 Brief 内容..."
                            value={briefContent}
                            onChange={(e) => setBriefContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                          />
                        )}
                      </div>

                      {/* Phase 2 bottom bar */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3">
                          <button
                            className={`btn-primary flex items-center gap-1 ${reviewing ? 'opacity-50 pointer-events-none' : ''}`}
                            disabled={reviewing}
                            onClick={reviewBrief}
                          >
                            {reviewing ? (<>审查中...</>) : (<><IconSearch size={16} /> 重新审查</>)}
                          </button>
                          <button
                            className={`btn-outline flex items-center gap-1 ${autoRevising ? 'opacity-50 pointer-events-none' : ''}`}
                            disabled={autoRevising}
                            onClick={autoRevise}
                          >
                            {autoRevising ? (<>自动修改中...</>) : (<><IconRobot size={16} /> 根据审查意见自动修改</>)}
                          </button>
                        </div>
                        <span className="text-xs text-muted">Phase 2 审查</span>
                      </div>
                    </>
                  )}

                  {/* No review yet: show review button */}
                  {!reviewResult && (
                    <div className="flex justify-center">
                      <button
                        className="btn-primary text-lg flex items-center gap-2"
                        disabled={reviewing || !briefContent.trim()}
                        onClick={reviewBrief}
                      >
                        {reviewing ? (
                          <><svg className="animate-spin h-5 w-5" /* spinner */ /><span>审查中...</span></>
                        ) : (
                          <><IconSearch size={18} /> Agent B 审查</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ----- Phase 3 content: edit + preview + diff ----- */}
          {activePhase === 3 && (
            <>
              {!briefContent ? (
                <div className="card text-center py-14 mb-4">
                  <div className="flex justify-center mb-3">
                    <IconAlert size={40} />
                  </div>
                  <p className="text-sm text-ink font-medium mb-1">请先生成 Brief</p>
                  <p className="text-xs text-muted mb-4">
                    请先切换到 Phase 1 生成 Brief，再回到 Phase 3 进行迭代。
                  </p>
                  <button
                    className="btn-primary flex items-center gap-2 mx-auto"
                    onClick={() => { setActivePhase(1); setError('') }}
                  >
                    <IconArrowRight size={16} />
                    进入 Phase 1
                  </button>
                </div>
              ) : (
                <div className="flex flex-col flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
                  {/* Phase 3 sub-tabs */}
                  <div className="flex border-b border-hairline flex-shrink-0">
                    <button
                      onClick={() => setActiveTab('edit')}
                      className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                        activeTab === 'edit'
                          ? 'text-ink border-ink'
                          : 'text-muted border-transparent hover:text-ink'
                      }`}
                    >
                      <IconEdit size={16} />
                      编辑
                    </button>
                    <button
                      onClick={() => setActiveTab('preview')}
                      className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                        activeTab === 'preview'
                          ? 'text-ink border-ink'
                          : 'text-muted border-transparent hover:text-ink'
                      }`}
                    >
                      <IconEye size={16} />
                      预览
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('diff')
                        if (!diffData) fetchDiff()
                      }}
                      className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
                        activeTab === 'diff'
                          ? 'text-ink border-ink'
                          : 'text-muted border-transparent hover:text-ink'
                      }`}
                    >
                      <IconDiff size={16} />
                      版本对比
                    </button>
                  </div>

                  {/* Phase 3 tab content */}
                  <div className="flex-1 flex flex-col bg-canvas border-x border-b border-hairline rounded-b-sm overflow-hidden">
                    {activeTab === 'edit' && (
                      <textarea
                        ref={textareaRef}
                        className="w-full flex-1 min-h-0 p-6 font-mono text-sm resize-none bg-surface-soft text-ink placeholder:text-muted outline-none border-0 focus:outline-none"
                        placeholder="编辑 Brief 内容..."
                        value={briefContent}
                        onChange={(e) => setBriefContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                      />
                    )}
                    {activeTab === 'preview' && (
                      <div className="p-6 overflow-y-auto flex-1 min-h-0">
                        {briefContent ? (
                          <MarkdownPreview content={briefContent} />
                        ) : (
                          <div className="text-center py-16 text-muted">暂无内容</div>
                        )}
                      </div>
                    )}
                    {activeTab === 'diff' && (
                      <div className="p-6 overflow-y-auto h-full">
                        {loadingDiff ? (
                          <div className="text-center py-16 text-muted">
                            <svg className="animate-spin h-6 w-6 mb-3 mx-auto" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            加载版本对比中...
                          </div>
                        ) : diffData ? (
                          <DiffSideBySide older={diffData.older} newer={diffData.newer} />
                        ) : (
                          <div className="text-center py-16 text-muted space-y-3">
                            <div className="flex justify-center">
                              <IconDiff size={40} />
                            </div>
                            <p>暂无版本对比数据</p>
                            <button
                              className="btn-outline text-sm"
                              onClick={fetchDiff}
                            >
                              重新加载
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Phase 3 bottom bar */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3">
                      <button
                        className="btn-outline flex items-center gap-1"
                        onClick={saveEdit}
                        disabled={saving}
                      >
                        {saving ? (
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <IconSave size={16} />
                        )}
                        保存
                      </button>
                      <button
                        className="btn-outline flex items-center gap-1 no-underline"
                        onClick={async () => {
                          try {
                            const res = await fetch(`${API}/export/${projectId}`)
                            const blob = await res.blob()
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = 'Brief_宠物饮水机_demo.md'
                            a.click()
                            URL.revokeObjectURL(url)
                          } catch { /* ignore */ }
                        }}
                      >
                        <IconDownload size={16} />
                        导出 .md
                      </button>
                      <span className="text-xs text-muted">
                        {briefContent ? `${briefContent.length} 字符` : ''}
                      </span>
                    </div>
                    <span className="text-xs text-muted">Phase 3 迭代</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right sidebar: always visible */}
        <div className="w-80 space-y-4 flex-shrink-0 overflow-y-auto" style={{ height: '100%' }}>
          {/* Chat panel */}
          <ChatPanel
            chatMessages={chatMessages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            sendChat={sendChat}
            chatSending={chatSending}
            loadChatHistory={loadChatHistory}
            chatEndRef={chatEndRef}
            chatContainerRef={chatContainerRef}
          />

          {/* Self-Check */}
          <div className="card !p-5">
            <h3 className="text-sm font-semibold text-ink mb-4">
              Self-Check ({checkPassed}/{checkTotal})
            </h3>
            <div className="space-y-3">
              {checkResults.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  {item.passed ? (
                    <IconCheckCircle size={14} className="mt-0.5 flex-shrink-0" />
                  ) : (
                    <svg
                      width={14}
                      height={14}
                      viewBox="0 0 24 24"
                      className="mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="#cccccc"
                      strokeWidth={1}
                    >
                      <circle cx={12} cy={12} r={11} />
                    </svg>
                  )}
                  <span
                    className={`text-xs leading-relaxed ${item.passed ? 'text-ink' : 'text-muted'}`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Version history */}
          <div className="card !p-5">
            <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-1.5">
              <IconHistory size={16} />
              版本历史
            </h3>
            {versionHistory.length === 0 ? (
              <p className="text-xs text-muted">暂无版本记录</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {versionHistory.map((v, i) => (
                  <div key={i} className="text-xs border-l-2 border-hairline pl-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-ink">v{v.version}</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] border border-hairline text-muted flex items-center gap-0.5">
                        {v.role === 'agent_a' && <IconRobot size={10} />}
                        {v.role === 'agent_b' && <IconRobot size={10} />}
                        {v.role === 'user' && <IconUser size={10} />}
                        {v.role === 'agent_a'
                          ? 'Agent A'
                          : v.role === 'agent_b'
                          ? 'Agent B'
                          : v.role === 'user'
                          ? '人工'
                          : v.role}
                      </span>
                      <span className="text-muted ml-auto">{v.action}</span>
                    </div>
                    {v.issues_found != null && (
                      <div className="text-muted mt-0.5">发现问题：{v.issues_found} 个</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {versionHistory.length > 0 && versionHistory.some((v) => v.role === 'agent_b') && (
            <div className="bg-surface-soft border border-hairline rounded-sm p-4">
              <p className="text-xs text-ink font-medium mb-2">迭代建议流程</p>
              <ol className="text-xs text-muted space-y-1 list-decimal list-inside">
                <li>阅读 Agent B 审查结果</li>
                <li>在编辑器中修改 Brief</li>
                <li>保存 - 再次 Agent B 审查</li>
                <li>直到高优先问题清零</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}