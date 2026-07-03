import { useState, useRef, type DragEvent, type ChangeEvent, type ReactNode, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { uploadFiles, safeFetch } from '../lib/api'
import { DEMO_PROJECT_ID } from '../lib/demoData'
import { ArchitectureDiagram } from '../components/ArchitectureDiagram'
import {
  IconChart,
  IconDocument,
  IconPackage,
  IconStar,
  IconCheckCircle,
  IconAlert,
  IconClipboard,
  IconArrowRight,
  IconSparkles,
  IconRefresh,
  IconUpload,
} from '../components/Icons'

interface Phase0File {
  filename: string
  detected_type: string
  row_count: number
  columns: string[]
  quality: string
}

interface Phase0Result {
  files: Phase0File[]
  review_summaries: { asin: string; total: number; star_1: number; star_2: number; star_3: number; star_4: number; star_5: number; judgment: string }[]
  bsr_summaries: { type_name: string; count: number; price_range: string; sales_range: string }[]
  warnings: string[]
}

const TYPE_LABELS: Record<string, ReactNode> = {
  review: <span className="inline-flex items-center gap-1.5"><IconDocument size={20} />评论数据</span>,
  bsr_listing: <span className="inline-flex items-center gap-1.5"><IconChart size={20} />BSR/Listing 数据</span>,
  unknown: <span>未识别</span>,
}

export default function DataUpload() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const existingProjectId = searchParams.get('project') || ''
  const [category, setCategory] = useState('宠物饮水机')
  const [bsrFiles, setBsrFiles] = useState<File[]>([])
  const [reviewFiles, setReviewFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [sampleDataLoading, setSampleDataLoading] = useState(false)
  const [phase0, setPhase0] = useState<Phase0Result | null>({
    files: [
      { filename: 'Cat_Fountains_BSR50_汇总.xlsx', detected_type: 'bsr_listing', row_count: 50, columns: ['ASIN', 'Brand', 'Price', 'Rating', 'Reviews', 'Sales', 'Category'], quality: '良好' },
      { filename: 'B0FJMF2T4J-Reviews.xlsx', detected_type: 'review', row_count: 203, columns: ['Rating', 'Title', 'Body', 'Date', 'Verified'], quality: '良好' },
      { filename: 'B0FPFZ7XFJ-Reviews.xlsx', detected_type: 'review', row_count: 178, columns: ['Rating', 'Title', 'Body', 'Date', 'Verified'], quality: '良好' },
      { filename: 'B08NCDBT7Q-Reviews.xlsx', detected_type: 'review', row_count: 156, columns: ['Rating', 'Title', 'Body', 'Date', 'Verified'], quality: '良好' },
      { filename: 'B0FBS5L5BY-Reviews.xlsx', detected_type: 'review', row_count: 192, columns: ['Rating', 'Title', 'Body', 'Date', 'Verified'], quality: '良好' },
    ],
    review_summaries: [
      { asin: 'B0FJMF2T4J', total: 203, star_1: 15, star_2: 22, star_3: 38, star_4: 56, star_5: 72, judgment: '✅ 评论充足 · 推荐用于聚类' },
      { asin: 'B0FPFZ7XFJ', total: 178, star_1: 8, star_2: 18, star_3: 35, star_4: 52, star_5: 65, judgment: '✅ 评论充足 · 推荐用于聚类' },
      { asin: 'B08NCDBT7Q', total: 156, star_1: 12, star_2: 24, star_3: 40, star_4: 45, star_5: 35, judgment: '✅ 评论充足 · 推荐用于聚类' },
      { asin: 'B0FBS5L5BY', total: 192, star_1: 6, star_2: 15, star_3: 28, star_4: 58, star_5: 85, judgment: '✅ 评论充足 · 推荐用于聚类' },
    ],
    bsr_summaries: [
      { type_name: '塑料材质饮水机', count: 8, price_range: '$19.99 - $27.99', sales_range: '2900-8000/月' },
      { type_name: '不锈钢材质饮水机', count: 7, price_range: '$29.99 - $45.99', sales_range: '1100-3800/月' },
      { type_name: '智能/旗舰饮水机', count: 5, price_range: '$39.99 - $69.99', sales_range: '600-2600/月' },
    ],
    warnings: ['检测到 2 个 ASIN 评论数不足 50 条，聚类精度可能受影响'],
  })
  const [projectId, setProjectId] = useState(DEMO_PROJECT_ID)

  // 演示模式：在 URL 中写入 projectId
  useEffect(() => {
    if (!existingProjectId) {
      navigate(`/?project=${DEMO_PROJECT_ID}`, { replace: true })
    }
  }, [])

  const bsrInputRef = useRef<HTMLInputElement>(null)
  const reviewInputRef = useRef<HTMLInputElement>(null)

  // 重置上传状态（保持 projectId）
  const handleResetUpload = () => {
    setBsrFiles([])
    setReviewFiles([])
    setPhase0(null)
    setError('')
    setCategory('')
  }

  // 填充示例数据
  const handleSampleData = async () => {
    setError('')
    try {
      const res = await fetch('/api/upload/sample', { method: 'POST' })
      const text = await res.text()
      let data: any
      try { data = JSON.parse(text) } catch { data = null }
      if (!res.ok || !data) {
        setError(data?.detail || data?.error || '示例数据加载失败')
        return
      }
      setCategory(data.category || '宠物用品')
      setPhase0(data.phase0)
      setProjectId(data.project_id)
      navigate(`/?project=${data.project_id || DEMO_PROJECT_ID}`, { replace: true })
    } catch (e: any) {
      setError(e.message || '示例数据加载失败')
    }
  }

  const handleFileDrop = (
    e: DragEvent,
    target: 'bsr' | 'review'
  ) => {
    e.preventDefault()
    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) {
      if (target === 'bsr') setBsrFiles(prev => [...prev, ...droppedFiles])
      else setReviewFiles(prev => [...prev, ...droppedFiles])
    }
  }

  const handleFileSelect = (
    e: ChangeEvent<HTMLInputElement>,
    target: 'bsr' | 'review'
  ) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length > 0) {
      if (target === 'bsr') setBsrFiles(prev => [...prev, ...selectedFiles])
      else setReviewFiles(prev => [...prev, ...selectedFiles])
    }
  }

  const removeFile = (target: 'bsr' | 'review', idx: number) => {
    if (target === 'bsr') setBsrFiles(prev => prev.filter((_, i) => i !== idx))
    else setReviewFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const handleUpload = async () => {
    if (!category.trim()) {
      setError('请输入品类')
      return
    }
    if (bsrFiles.length === 0 && reviewFiles.length === 0) {
      setError('至少上传一个文件')
      return
    }

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('category', category.trim())
    bsrFiles.forEach(f => formData.append('bsr_files', f))
    reviewFiles.forEach(f => formData.append('review_files', f))

    const result = await uploadFiles(formData)
    setUploading(false)

    if (!result.ok) {
      setError(result.error || '上传失败')
      return
    }

    setPhase0(result.data!.phase0)
    setProjectId(result.data!.project_id)
  }

  const renderFileList = (files: File[], target: 'bsr' | 'review') => {
    if (files.length === 0) return null
    return (
      <div className="space-y-1 mt-3">
        {files.map((f, i) => (
          <div
            key={i}
            className="inline-flex items-center gap-2 bg-green-50 text-green-800 rounded-full pl-3 pr-2 py-1 text-badge mx-1"
          >
            <IconCheckCircle size={14} />
            <span className="max-w-[140px] truncate">{f.name}</span>
            <button
              className="ml-1 p-0.5 rounded-full hover:bg-green-100 transition-colors"
              onClick={(e) => { e.stopPropagation(); removeFile(target, i) }}
              title="移除"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        ))}
      </div>
    )
  }

  const hasBsr = bsrFiles.length > 0
  const hasReview = reviewFiles.length > 0

  return (
    <div className="max-w-3xl mx-auto">
      {/* Title */}
      <div className="mt-16 mb-8">
        <h2 className="text-display-lg mb-2">数据上传</h2>
        <p className="text-body-sm text-muted">
          上传 Amazon BSR 榜单数据和竞品评论数据，开始品类机会分析
        </p>
      </div>

      {/* Category Input */}
      <div className="card mb-6">
        <label className="block text-title-sm text-ink mb-2">
          品类
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="例如：宠物用品"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <p className="mt-1 text-caption-sm text-muted">
          输入你要分析的品类名称，用于生成项目标题和分析上下文
        </p>
      </div>

      {/* 示例数据引导按钮 */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleSampleData}
          disabled={sampleDataLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            fontSize: '13px',
            fontWeight: 500,
            borderRadius: '8px',
            border: '1px solid #dddddd',
            backgroundColor: '#ffffff',
            color: '#6a6a6a',
            cursor: sampleDataLoading ? 'not-allowed' : 'pointer',
            opacity: sampleDataLoading ? 0.6 : 1,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            if (!sampleDataLoading) {
              (e.target as HTMLElement).style.borderColor = '#222222'
              ;(e.target as HTMLElement).style.color = '#222222'
            }
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.borderColor = '#dddddd'
            ;(e.target as HTMLElement).style.color = '#6a6a6a'
          }}
        >
          {sampleDataLoading ? (
            <>
              <svg className="animate-spin" style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              加载中...
            </>
          ) : (
            <>
              <IconUpload size={14} /> 使用示例数据
            </>
          )}
        </button>
      </div>

      {/* File Upload Zones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* BSR Upload */}
        <div
          className={`card border-2 border-dashed transition-colors cursor-pointer ${
            hasBsr
              ? 'bg-green-50 border-green-300'
              : 'border-hairline hover:border-ink'
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleFileDrop(e, 'bsr')}
          onClick={() => bsrInputRef.current?.click()}
        >
          <input
            ref={bsrInputRef}
            type="file"
            accept=".xlsx,.xls"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'bsr')}
          />
          <div className="text-center py-6">
            <div className="mb-3 flex justify-center">
              <IconChart size={48} />
            </div>
            <h3 className="font-medium text-ink mb-1">BSR 榜单数据</h3>
            <p className="text-body-sm text-muted mb-3">
              包含排名、售价、销量、卖点等字段
            </p>
            {hasBsr ? (
              <>
                <p className="text-xs text-green-700 mb-2">已选择 {bsrFiles.length} 个文件</p>
                {renderFileList(bsrFiles, 'bsr')}
              </>
            ) : (
              <span className="text-body-sm text-muted">
                拖拽文件到此处或点击选择 (.xlsx)
              </span>
            )}
          </div>
        </div>

        {/* Review Upload */}
        <div
          className={`card border-2 border-dashed transition-colors cursor-pointer ${
            hasReview
              ? 'bg-green-50 border-green-300'
              : 'border-hairline hover:border-ink'
          }`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleFileDrop(e, 'review')}
          onClick={() => reviewInputRef.current?.click()}
        >
          <input
            ref={reviewInputRef}
            type="file"
            accept=".xlsx,.xls"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'review')}
          />
          <div className="text-center py-6">
            <div className="mb-3 flex justify-center">
              <IconDocument size={48} />
            </div>
            <h3 className="font-medium text-ink mb-1">竞品评论数据</h3>
            <p className="text-body-sm text-muted mb-3">
              包含星级、标题、评论内容、ASIN 等字段
            </p>
            {hasReview ? (
              <>
                <p className="text-xs text-green-700 mb-2">已选择 {reviewFiles.length} 个文件</p>
                {renderFileList(reviewFiles, 'review')}
              </>
            ) : (
              <span className="text-body-sm text-muted">
                拖拽文件到此处或点击选择 (.xlsx)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-4 p-4 bg-surface-soft border border-hairline rounded-md text-error text-body-sm">
          {error}
        </div>
      )}

      {/* Upload Button */}
      <div className="flex justify-center mb-8">
        <button
          className="btn-primary"
          disabled={uploading}
          onClick={handleUpload}
        >
          {uploading ? (
            <span className="flex items-center gap-2">
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
              正在分析...
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <IconSparkles size={20} />开始分析
            </span>
          )}
        </button>
      </div>

      {/* Phase 0 Results */}
      {phase0 && (
        <div className="space-y-6">
          {/* File Detection Results */}
          <div className="card">
            <h3 className="text-display-lg mb-4 inline-flex items-center gap-2">
              <IconClipboard size={24} />数据识别结果
            </h3>
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-hairline">
                  <th className="text-left py-2 text-caption text-muted">文件名</th>
                  <th className="text-left py-2 text-caption text-muted">类型</th>
                  <th className="text-right py-2 text-caption text-muted">行数</th>
                  <th className="text-center py-2 text-caption text-muted">质量</th>
                </tr>
              </thead>
              <tbody>
                {phase0.files.map((f, i) => (
                  <tr key={i} className="border-b border-hairline-soft last:border-0">
                    <td className="py-2 text-ink">{f.filename}</td>
                    <td className="py-2 text-body-sm">
                      {TYPE_LABELS[f.detected_type] || f.detected_type}
                    </td>
                    <td className="py-2 text-right text-ink">{f.row_count}</td>
                    <td className="py-2 text-center text-muted">{f.quality}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Review Star Distribution */}
          {phase0.review_summaries.length > 0 && (
            <div className="card">
              <h3 className="text-display-lg mb-4 inline-flex items-center gap-2">
                <IconStar size={22} />评论星级分布
              </h3>
              <table className="w-full text-body-sm">
                <thead>
                  <tr className="border-b border-hairline">
                    <th className="text-left py-2 text-caption text-muted">ASIN</th>
                    <th className="text-center py-2 text-caption text-muted">
                      <span className="inline-flex items-center gap-0.5">1<IconStar size={10} /></span>
                    </th>
                    <th className="text-center py-2 text-caption text-muted">
                      <span className="inline-flex items-center gap-0.5">2<IconStar size={10} /></span>
                    </th>
                    <th className="text-center py-2 text-caption text-muted">
                      <span className="inline-flex items-center gap-0.5">3<IconStar size={10} /></span>
                    </th>
                    <th className="text-center py-2 text-caption text-muted">
                      <span className="inline-flex items-center gap-0.5">4<IconStar size={10} /></span>
                    </th>
                    <th className="text-center py-2 text-caption text-muted">
                      <span className="inline-flex items-center gap-0.5">5<IconStar size={10} /></span>
                    </th>
                    <th className="text-right py-2 text-caption text-muted">总计</th>
                    <th className="text-center py-2 text-caption text-muted">判定</th>
                  </tr>
                </thead>
                <tbody>
                  {phase0.review_summaries.map((s, i) => (
                    <tr key={i} className="border-b border-hairline-soft last:border-0">
                      <td className="py-2 text-ink font-mono text-xs">{s.asin}</td>
                      <td className="py-2 text-center">{s.star_1}</td>
                      <td className="py-2 text-center">{s.star_2}</td>
                      <td className="py-2 text-center">{s.star_3}</td>
                      <td className="py-2 text-center">{s.star_4}</td>
                      <td className="py-2 text-center">{s.star_5}</td>
                      <td className="py-2 text-right font-medium text-ink">{s.total}</td>
                      <td className="py-2 text-center">
                        <span className={s.judgment.includes('\u2705') ? 'tag tag-green' : 'tag tag-yellow'}>
                          {s.judgment}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* BSR Category Overview */}
          {phase0.bsr_summaries.length > 0 && (
            <div className="card">
              <h3 className="text-display-lg mb-4 inline-flex items-center gap-2">
                <IconPackage size={24} />BSR 分类概览
              </h3>
              <table className="w-full text-body-sm">
                <thead>
                  <tr className="border-b border-hairline">
                    <th className="text-left py-2 text-caption text-muted">类型</th>
                    <th className="text-right py-2 text-caption text-muted">数量</th>
                    <th className="text-left py-2 text-caption text-muted">价格范围</th>
                    <th className="text-left py-2 text-caption text-muted">销量范围</th>
                  </tr>
                </thead>
                <tbody>
                  {phase0.bsr_summaries.map((s, i) => (
                    <tr key={i} className="border-b border-hairline-soft last:border-0">
                      <td className="py-2 font-medium text-ink">{s.type_name}</td>
                      <td className="py-2 text-right text-ink">{s.count}</td>
                      <td className="py-2 text-muted">{s.price_range || '-'}</td>
                      <td className="py-2 text-muted">{s.sales_range || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Warnings (subtle) */}
          {phase0.warnings.length > 0 && (
            <div className="card bg-surface-soft border-hairline">
              <h3 className="text-display-lg mb-3 text-ink inline-flex items-center gap-2">
                <IconAlert size={22} />需要关注
              </h3>
              <ul className="list-disc list-inside space-y-1">
                {phase0.warnings.map((w, i) => (
                  <li key={i} className="text-body-sm text-muted">{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Confirm & Proceed */}
          {projectId && (
            <div className="card border-hairline bg-surface-soft text-center">
              <p className="text-body-sm text-muted mb-4">
                以上数据识别和分类是否准确？是否确认进入 Phase 1 标签化分析？
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  className="btn-primary inline-flex items-center gap-2"
                  onClick={() => navigate(`/insight?project=${projectId}`)}
                >
                  确认，进入机会洞察 <IconArrowRight size={20} />
                </button>
                <button
                  onClick={handleResetUpload}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '13px 23px',
                    fontSize: '16px',
                    fontWeight: 500,
                    lineHeight: 1.25,
                    borderRadius: '8px',
                    border: '1px solid #222222',
                    backgroundColor: '#ffffff',
                    color: '#222222',
                    cursor: 'pointer',
                    height: '48px',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = '#f7f7f7'
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = '#ffffff'
                  }}
                >
                  <IconRefresh size={18} /> 重新上传
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mock vs Real Architecture */}
      <ArchitectureDiagram />
    </div>
  )
}
