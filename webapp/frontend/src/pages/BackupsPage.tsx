import { useCallback, useEffect, useState } from 'react'
import { PageHeader, StatusBadge } from '../components/PagePrimitives'
import { createBackup, listBackups, prepareBackupRestore, type BackupRecord, type RestorePreparation } from '../lib/api'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [restore, setRestore] = useState<RestorePreparation | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setBackups(await listBackups())
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '备份列表读取失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const handleCreate = async () => {
    setBusy(true)
    setError('')
    setNotice('')
    setRestore(null)
    try {
      const backup = await createBackup()
      setNotice('备份已创建：' + backup.file_name)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '备份创建失败')
    } finally {
      setBusy(false)
    }
  }

  const handlePrepareRestore = async (backup: BackupRecord) => {
    if (!window.confirm('准备恢复到 ' + formatDate(backup.created_at) + ' 的数据？此步骤只会生成恢复任务，不会立即覆盖当前数据。')) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      setRestore(await prepareBackupRestore(backup.id))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '恢复准备失败')
    } finally {
      setBusy(false)
    }
  }

  const copyCommand = async () => {
    if (!restore) return
    try {
      await navigator.clipboard.writeText(restore.command)
      setNotice('恢复命令已复制。请先关闭 Nextly 本地 API，再执行命令。')
    } catch {
      setNotice('请手动复制下方恢复命令。执行前需要先关闭 Nextly 本地 API。')
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        step="NEXTLY 3.0 · DATA SAFETY"
        title="数据与备份"
        description="备份包含 SQLite 数据库和项目文件。恢复前会先校验文件完整性，并自动生成当前数据的安全备份。"
        actions={<button className="primary-button" disabled={busy} onClick={() => void handleCreate()}>{busy ? '处理中…' : '立即备份'}</button>}
      />

      {error ? <div className="workspace-alert error" role="alert">{error}</div> : null}
      {notice ? <div className="workspace-alert success" role="status">{notice}</div> : null}

      <section className="backup-method panel-card">
        <div className="backup-method-item"><span className="backup-method-icon">DB</span><div><strong>数据库快照</strong><p>使用 SQLite 在线备份接口生成一致性快照，包含项目、版本和业务记录。</p></div></div>
        <div className="backup-method-item"><span className="backup-method-icon">FILE</span><div><strong>项目文件</strong><p>同步打包本地文件目录，并记录每个文件的 SHA-256 校验值。</p></div></div>
        <div className="backup-method-item"><span className="backup-method-icon">SAFE</span><div><strong>恢复保护</strong><p>恢复前验证 ZIP 路径、文件清单、校验值和 SQLite 完整性。</p></div></div>
      </section>

      <section className="panel-card">
        <div className="section-title"><h2>备份记录</h2><StatusBadge>{backups.length} 个可用备份</StatusBadge></div>
        {loading ? <p className="workspace-empty">正在读取备份…</p> : null}
        {!loading && backups.length === 0 ? (
          <div className="workspace-empty"><strong>尚无备份</strong><p>建议在导入重要资料或进行版本升级前创建备份。</p></div>
        ) : null}
        <div className="backup-list">
          {backups.map((backup) => (
            <article className="backup-row" key={backup.id}>
              <div className="backup-file-icon">ZIP</div>
              <div className="backup-info">
                <strong>{backup.file_name}</strong>
                <span>{formatDate(backup.created_at)} · {formatSize(backup.size_bytes)} · {backup.storage_file_count} 个文件</span>
                <small>数据库 SHA-256：{backup.database_sha256.slice(0, 20)}…</small>
              </div>
              <div className="backup-actions">
                <a className="secondary-button" href={'/api/backups/' + backup.id + '/download'}>下载</a>
                <button className="text-button" disabled={busy} onClick={() => void handlePrepareRestore(backup)}>准备恢复</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {restore ? (
        <section className="restore-instructions panel-card">
          <div className="section-title"><h2>恢复任务已准备</h2><StatusBadge tone="warning">等待本地执行</StatusBadge></div>
          <p>{restore.message}</p>
          <ol>
            <li>停止运行 Nextly 的后端终端（按 Ctrl + C）。</li>
            <li>在项目根目录执行下面的命令。</li>
            <li>恢复完成后，重新启动后端和前端。</li>
          </ol>
          <code>{restore.command}</code>
          <button className="secondary-button" onClick={() => void copyCommand()}>复制恢复命令</button>
        </section>
      ) : null}
    </div>
  )
}