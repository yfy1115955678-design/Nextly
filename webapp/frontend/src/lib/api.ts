const API_BASE = '/api'

export interface ApiResponse<T> {
  ok: boolean
  data?: T
  error?: string
}

/* ------------------------------------------------------------------ */
/*  Shared helpers — single source of truth                           */
/* ------------------------------------------------------------------ */

/** Safe JSON parse — returns null on any failure, never throws */
export function safeJSON(text: string): any {
  try { return JSON.parse(text) } catch { return null }
}

/** Safe fetch — always returns parsed JSON, throws on error */
export async function safeFetch(url: string, opts?: RequestInit): Promise<any> {
  const r = await fetch(url, opts)
  const t = await r.text()
  const d = safeJSON(t)
  if (!r.ok) throw new Error(d?.error || d?.detail || `HTTP ${r.status}`)
  return d
}

/* ------------------------------------------------------------------ */
/*  Typed request helper                                              */
/* ------------------------------------------------------------------ */

async function request<T>(
  url: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options,
    })
    const text = await res.text()
    if (!res.ok) {
      const parsed = safeJSON(text)
      return {
        ok: false,
        error: parsed?.error || parsed?.detail || `HTTP ${res.status}`,
      }
    }
    const data = safeJSON(text)
    return { ok: true, data }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

// 上传文件（FormData）
export async function uploadFiles(
  formData: FormData,
): Promise<ApiResponse<{ project_id: string; phase0: any }>> {
  try {
    const res = await fetch(`${API_BASE}/upload/files`, {
      method: 'POST',
      body: formData,
    })
    const text = await res.text()
    if (!res.ok) {
      const parsed = safeJSON(text)
      return { ok: false, error: parsed?.error || parsed?.detail || 'Upload failed' }
    }
    const data = safeJSON(text)
    return { ok: true, data }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

// 获取分析进度
export async function getProgress(projectId: string) {
  return request<any>(`/analysis/progress/${projectId}`)
}

// 分析对话
export async function sendChatMessage(projectId: string, phase: string, content: string) {
  return request<any>('/analysis/chat', {
    method: 'POST',
    body: JSON.stringify({ project_id: projectId, phase, content }),
  })
}

// 获取记忆
export async function getMemory(projectId: string) {
  return request<any>(`/analysis/memory/${projectId}`)
}
