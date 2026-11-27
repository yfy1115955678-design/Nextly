export interface ProjectRecord {
  id: string
  name: string
  category: string | null
  target_market: string | null
  description: string
  status: 'active' | 'paused' | 'archived'
  created_at: string
  updated_at: string
  archived_at: string | null
}

export interface ProjectInput {
  name: string
  category?: string
  target_market?: string
  description?: string
}

export interface ProjectFileRecord {
  id: string
  project_id: string | null
  original_name: string
  mime_type: string | null
  extension: string | null
  size_bytes: number
  sha256: string | null
  file_kind: string
  created_at: string
}

export interface BackupRecord {
  id: string
  file_name: string
  created_at: string
  size_bytes: number
  database_sha256: string
  storage_file_count: number
}

export interface RestorePreparation {
  staged_id: string
  backup_id: string
  command: string
  message: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path.startsWith('/api') ? path : '/api' + path, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    let message = 'Request failed (' + response.status + ')'
    try {
      const payload = await response.json()
      message = payload.detail ?? message
    } catch {
      // Keep the HTTP status message when the response is not JSON.
    }
    throw new Error(message)
  }

  return response.json() as Promise<T>
}

export function listProjects(includeArchived = false) {
  return request<ProjectRecord[]>('/projects?include_archived=' + includeArchived)
}

export function createProject(input: ProjectInput) {
  return request<ProjectRecord>('/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateProject(projectId: string, input: Partial<ProjectInput> & { status?: 'active' | 'paused' }) {
  return request<ProjectRecord>('/projects/' + projectId, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function archiveProject(projectId: string) {
  return request<ProjectRecord>('/projects/' + projectId, { method: 'DELETE' })
}

export function listProjectFiles(projectId: string) {
  return request<ProjectFileRecord[]>('/files?project_id=' + encodeURIComponent(projectId))
}

export function uploadProjectFile(projectId: string, file: File) {
  const body = new FormData()
  body.append('project_id', projectId)
  body.append('file', file)
  return request<ProjectFileRecord>('/files/upload', { method: 'POST', body })
}

export function listBackups() {
  return request<BackupRecord[]>('/backups')
}

export function createBackup() {
  return request<BackupRecord>('/backups', { method: 'POST' })
}

export function prepareBackupRestore(backupId: string) {
  return request<RestorePreparation>('/backups/' + backupId + '/restore/prepare', {
    method: 'POST',
  })
}