/**
 * 演示模式 — 拦截所有 API 请求，返回预烘焙数据，无需后端。
 * 在 main.tsx 最开头 import 即可激活。
 */
import {
  DEMO_PROJECT_ID,
  phase0Upload,
  demoAnalysisState,
  demoDecisions,
  demoBrief,
  demoBriefChat,
  demoChatReply,
} from './demoData'

/** 判断 URL 是否是浏览器扩展的内部请求 */
function isExtensionRequest(url: string): boolean {
  return url.startsWith('chrome-extension://') || url.includes('extension/')
}

const originalFetch = window.fetch.bind(window)

window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString()

  // 放过浏览器扩展的请求
  if (isExtensionRequest(url)) {
    return originalFetch(input, init)
  }

  // 提取 API 路径
  const apiPath = url.replace(/^https?:\/\/[^/]+/, '')

  // ── 上传相关 ──
  if (apiPath === '/api/upload/sample' || apiPath.startsWith('/api/upload/sample')) {
    return jsonResponse({
      ...phase0Upload,
      project_id: DEMO_PROJECT_ID,
      category: '宠物饮水机',
    })
  }

  if (apiPath === '/api/upload/files' || apiPath.startsWith('/api/upload/files')) {
    return jsonResponse({
      ...phase0Upload,
      project_id: DEMO_PROJECT_ID,
    })
  }

  if (apiPath === `/api/upload/state/${DEMO_PROJECT_ID}` || apiPath.match(/\/api\/upload\/state\/demo/)) {
    return jsonResponse({
      ...phase0Upload,
      project_id: DEMO_PROJECT_ID,
    })
  }

  // ── 分析状态 ──
  if (apiPath === `/api/analysis/state/${DEMO_PROJECT_ID}` || apiPath.match(/\/api\/analysis\/state\/demo/)) {
    return jsonResponse(demoAnalysisState(DEMO_PROJECT_ID))
  }

  // ── 执行分析 ──
  if (apiPath.match(/\/api\/analysis\/execute\/.*\?phase=/)) {
    return jsonResponse({ ok: true, result: { demo: true } })
  }

  // ── 审核对话 ──
  if (apiPath === '/api/analysis/chat' || apiPath.startsWith('/api/analysis/chat')) {
    const reply = demoChatReply()
    return jsonResponse({ content: reply, edit_applied: false })
  }

  // ── 决策轴 ──
  if (apiPath.match(/\/api\/analysis\/get-decisions\//)) {
    return jsonResponse(demoDecisions)
  }

  // ── 卡点确认 ──
  if (apiPath === '/api/analysis/checkpoint/approve' || apiPath.startsWith('/api/analysis/checkpoint/approve')) {
    return jsonResponse({ ok: true })
  }

  // ── 保存决策 ──
  if (apiPath.match(/\/api\/analysis\/save-decisions\//)) {
    return jsonResponse({ ok: true })
  }

  // ── Brief 相关 ──
  if (apiPath === `/api/brief/latest/${DEMO_PROJECT_ID}` || apiPath.match(/\/api\/brief\/latest\/demo/)) {
    return jsonResponse(demoBrief)
  }

  if (apiPath === `/api/brief/chat/${DEMO_PROJECT_ID}` || apiPath.match(/\/api\/brief\/chat\/demo/)) {
    if (init?.method === 'POST') {
      return jsonResponse({ content: demoChatReply() })
    }
    return jsonResponse(demoBriefChat)
  }

  if (apiPath.match(/\/api\/brief\/phase0\//)) {
    return jsonResponse({ ok: true, questions: demoDecisions.questions.map(q => ({ ...q, question: q.label })) })
  }

  if (apiPath.match(/\/api\/brief\/generate\//)) {
    return jsonResponse({ ok: true, brief: demoBrief.brief })
  }

  if (apiPath.match(/\/api\/brief\/review\//)) {
    return jsonResponse({
      ok: true,
      review: 'Agent B 审查结果：\n\n## 高优先级\n- 成本估算完整，物流费用已补充 ✅\n- 目标用户画像已包含多宠家庭细分 ✅\n\n## 中优先级\n- 建议在包装差异化部分增加「开箱即用」体验设计\n\n## 结论\n审查通过，建议采纳中优先级建议后直接发布。',
      issues: { high: 0, medium: 1 },
    })
  }

  if (apiPath.match(/\/api\/brief\/auto-revise\//)) {
    return jsonResponse({ ok: true, brief: demoBrief.brief })
  }

  if (apiPath.match(/\/api\/brief\/save\//)) {
    return jsonResponse({ ok: true, version: 5 })
  }

  if (apiPath.match(/\/api\/brief\/diff\//)) {
    return jsonResponse({ diff: 'Brief 版本 3 → 4 没有差异（审查通过后未修改）' })
  }

  // ── Memory ──
  if (apiPath.match(/\/api\/analysis\/memory\//)) {
    return jsonResponse({
      project_id: DEMO_PROJECT_ID,
      conversations: demoAnalysisState(DEMO_PROJECT_ID).conversations,
      decisions: [],
      reviews: [],
    })
  }

  // ── Export (GET, 返回 markdown 文本) ──
  if (apiPath.match(/\/api\/brief\/export\//)) {
    const headers = new Headers()
    headers.set('Content-Type', 'text/markdown; charset=utf-8')
    headers.set('Content-Disposition', 'attachment; filename="Brief_宠物饮水机_demo.md"')
    return Promise.resolve(new Response(demoBrief.brief, { status: 200, headers }))
  }

  // ── 进度查询 ──
  if (apiPath.match(/\/api\/analysis\/progress\//)) {
    return jsonResponse({ status: 'completed' })
  }

  // 其他请求放行
  return originalFetch(input, init)
}

function jsonResponse(data: any): Promise<Response> {
  const body = JSON.stringify(data)
  const headers = new Headers()
  headers.set('Content-Type', 'application/json')
  return Promise.resolve(new Response(body, { status: 200, headers }))
}

export function initDemoMode() {
  console.log('[Nexly Demo] 演示模式已激活 — 宠物饮水机品类全流程数据已预加载')
}
