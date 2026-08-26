import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'

export type DemoMode = 'conflict' | 'revised' | 'approved' | 'paused'
export type ArtifactKind = '市场数据' | '供应商报价' | '验证报告' | '产品图片' | '项目资料'

export interface DecisionRecord {
  id: string
  stage: string
  date: string
  decision: string
  rationale: string
  impact: string
}

export interface UploadedArtifact {
  id: string
  name: string
  kind: ArtifactKind
  receivedAt: string
  affectedModules: string[]
  summary: string
}

export interface ProjectState {
  schemaVersion: 1
  mode: DemoMode
  definitionVersion: 1 | 2
  cleaningRequirement: string
  decisions: DecisionRecord[]
  artifacts: UploadedArtifact[]
}

type ProjectAction =
  | { type: 'ACCEPT_REVISION'; requirement?: string }
  | { type: 'APPROVE_CONDITIONALLY' }
  | { type: 'PAUSE_PROJECT' }
  | { type: 'ADD_ARTIFACT'; artifact: UploadedArtifact }
  | { type: 'RESET_DEMO' }

interface ProjectContextValue {
  state: ProjectState
  acceptRevision: (requirement?: string) => void
  approveConditionally: () => void
  pauseProject: () => void
  addArtifact: (fileName: string) => UploadedArtifact
  resetDemo: () => void
}

const STORAGE_KEY = 'nextly-demo-project-state-v1'
const REVISED_REQUIREMENT = '水箱、上盖与出水组件可拆洗；泵体与 PCB 单独防水清洁。'

const baseDecisions: DecisionRecord[] = [
  {
    id: 'D-O-001',
    stage: '机会发现',
    date: '2026-07-03',
    decision: '选择 O-001 进入深度研究',
    rationale: '覆盖卫生、噪音与清洁三类高频痛点，价格带与支付意愿匹配。',
    impact: '启动市场、用户与竞品证据核验。',
  },
  {
    id: 'D-R-001',
    stage: '市场研究',
    date: '2026-07-05',
    decision: '确认进入产品定义',
    rationale: '50 个商品与 729 条评论相互印证，机会方向成立。',
    impact: '锁定中端不锈钢、静音与易清洁方向。',
  },
]

export const initialProjectState: ProjectState = {
  schemaVersion: 1,
  mode: 'conflict',
  definitionVersion: 1,
  cleaningRequirement: '整机洗碗机安全，所有接触水部件均可直接机洗。',
  decisions: baseDecisions,
  artifacts: [],
}

function classifyArtifact(fileName: string): Omit<UploadedArtifact, 'id' | 'name' | 'receivedAt'> {
  const normalized = fileName.toLowerCase()

  if (normalized.includes('bsr') || normalized.includes('review') || normalized.includes('评论')) {
    return {
      kind: '市场数据',
      affectedModules: ['市场研究', '产品定义'],
      summary: '将局部刷新市场规模、价格带与用户痛点结论。',
    }
  }

  if (normalized.includes('quote') || normalized.includes('cost') || normalized.includes('报价') || normalized.includes('bom')) {
    return {
      kind: '供应商报价',
      affectedModules: ['落地验证', '评审与决策'],
      summary: '将替换 BOM 估算值，并重新判断成本条件是否满足。',
    }
  }

  if (normalized.includes('mtbf') || normalized.includes('寿命') || normalized.includes('test') || normalized.includes('报告')) {
    return {
      kind: '验证报告',
      affectedModules: ['落地验证', '评审与决策'],
      summary: '将核对泵体寿命目标，并更新推进条件。',
    }
  }

  if (/\.(png|jpe?g|webp)$/i.test(normalized)) {
    return {
      kind: '产品图片',
      affectedModules: ['产品定义', '落地验证'],
      summary: '将用于识别结构、CMF 与潜在可制造风险。',
    }
  }

  return {
    kind: '项目资料',
    affectedModules: ['项目总览'],
    summary: '已加入项目证据，等待选择需要更新的模块。',
  }
}

function buildArtifact(fileName: string): UploadedArtifact {
  return {
    id: `A-${Date.now()}`,
    name: fileName,
    receivedAt: new Date().toISOString(),
    ...classifyArtifact(fileName),
  }
}

function reducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'ACCEPT_REVISION': {
      if (state.mode !== 'conflict') return state
      const requirement = action.requirement?.trim() || REVISED_REQUIREMENT
      return {
        ...state,
        mode: 'revised',
        definitionVersion: 2,
        cleaningRequirement: requirement,
        decisions: [
          ...state.decisions,
          {
            id: 'D-F-001',
            stage: '落地验证',
            date: '2026-07-08',
            decision: '接受清洁边界修订并生成产品定义 v2',
            rationale: '泵体与 PCB 不可进入洗碗机，原要求超出可制造边界。',
            impact: '同步更新 R-04、清洁验收标准与阶段评审建议。',
          },
        ],
      }
    }
    case 'APPROVE_CONDITIONALLY': {
      if (state.mode !== 'revised') return state
      return {
        ...state,
        mode: 'approved',
        decisions: [
          ...state.decisions,
          {
            id: 'D-G-001',
            stage: '评审与决策',
            date: '2026-07-09',
            decision: '有条件进入打样',
            rationale: '市场机会成立，阻塞冲突已解决，剩余问题可作为打样前置条件。',
            impact: '进入样品与供应商验证；寿命报告和正式报价必须在样品评审前补齐。',
          },
        ],
      }
    }
    case 'PAUSE_PROJECT':
      if (state.mode !== 'revised') return state
      return {
        ...state,
        mode: 'paused',
        decisions: [
          ...state.decisions,
          {
            id: 'D-G-PAUSE',
            stage: '评审与决策',
            date: '2026-07-09',
            decision: '暂停项目',
            rationale: '暂不进入打样，保留当前证据、产品定义 v2 与推进条件。',
            impact: '停止进入下一阶段，项目状态与版本继续保留。',
          },
        ],
      }
    case 'ADD_ARTIFACT':
      return { ...state, artifacts: [action.artifact, ...state.artifacts].slice(0, 5) }
    case 'RESET_DEMO':
      return initialProjectState
    default:
      return state
  }
}

function loadInitialState(): ProjectState {
  if (typeof window === 'undefined') return initialProjectState

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return initialProjectState
    const parsed = JSON.parse(stored) as ProjectState
    return parsed.schemaVersion === 1 ? parsed : initialProjectState
  } catch {
    return initialProjectState
  }
}

const ProjectContext = createContext<ProjectContextValue | null>(null)

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitialState)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const value = useMemo<ProjectContextValue>(() => ({
    state,
    acceptRevision: (requirement) => dispatch({ type: 'ACCEPT_REVISION', requirement }),
    approveConditionally: () => dispatch({ type: 'APPROVE_CONDITIONALLY' }),
    pauseProject: () => dispatch({ type: 'PAUSE_PROJECT' }),
    addArtifact: (fileName) => {
      const artifact = buildArtifact(fileName)
      dispatch({ type: 'ADD_ARTIFACT', artifact })
      return artifact
    },
    resetDemo: () => dispatch({ type: 'RESET_DEMO' }),
  }), [state])

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (!context) throw new Error('useProject must be used within ProjectProvider')
  return context
}

export const revisedRequirement = REVISED_REQUIREMENT
