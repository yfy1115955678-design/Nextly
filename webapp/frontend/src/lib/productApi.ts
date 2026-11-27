export interface ProductConcept {
  id: string
  project_id: string
  code: string | null
  name: string
  category: string | null
  description: string
  status: 'draft' | 'active' | 'archived'
  created_at: string
  updated_at: string
}

export interface ProductVariant {
  id: string
  concept_id: string
  code: string | null
  name: string
  description: string
  sort_order: number
  status: 'active' | 'archived'
  created_at: string
  updated_at: string
}

export interface VariantVersion {
  id: string
  variant_id: string
  version_number: number
  based_on_version_id: string | null
  status: 'draft' | 'confirmed' | 'superseded'
  change_summary: string
  created_at: string
  updated_at: string
  confirmed_at: string | null
}

export interface ProductDefinition {
  product_name: string
  sku?: string | null
  specification_summary?: string
  category?: string | null
  product_type?: string | null
  priority?: 'P0' | 'P1' | 'P2'
  planned_launch_date?: string | null
  positioning?: string
  market_entry?: string
  target_price_min?: number | null
  target_price_max?: number | null
  target_price_currency?: string
  target_contribution?: number | null
  pricing_strategy?: string
  certification_requirements?: string
  warranty_policy?: string
  summary?: string
}

export interface ProductPersona {
  id?: string
  name: string
  user_group: string
  age_range?: string | null
  characteristics?: string
  usage_scenario?: string
  functional_needs?: string
  emotional_needs?: string
  social_needs?: string
  pain_points?: string
  purchase_decision_factors?: string
  sort_order?: number
}

export interface ProductRequirement {
  id?: string
  code: string
  requirement_type: string
  title: string
  description?: string
  target_value?: string
  unit?: string | null
  priority: 'P0' | 'P1' | 'P2'
  source_nature?: string | null
  source_reference?: string
  validation_method?: string
  acceptance_criteria?: string
  status?: 'proposed' | 'confirmed' | 'validated' | 'blocked' | 'deferred'
  sort_order?: number
}

export interface DevelopmentIssue {
  id?: string
  issue_code?: string | null
  title: string
  evidence_nature?: string | null
  scenario?: string
  development_action?: string
  conclusion?: string
  priority: 'P0' | 'P1' | 'P2'
  status?: 'open' | 'in_progress' | 'resolved' | 'deferred'
  sort_order?: number
}

export interface ExperienceStep {
  id?: string
  sequence_no: number
  title: string
  user_action?: string
  product_response?: string
  sensory_feedback?: string
  acceptance_criteria?: string
  notes?: string
  bom_item_codes: string[]
}

export interface ExperienceFlow {
  id?: string
  name: string
  purpose?: string
  description?: string
  sort_order?: number
  steps: ExperienceStep[]
}

export interface BomQuote {
  id?: string
  supplier_name: string
  supplier_part_no?: string | null
  quoted_unit_price?: number | null
  currency?: string
  moq?: number | null
  lead_time_days?: number | null
  valid_until?: string | null
  quote_status?: 'candidate' | 'selected' | 'rejected' | 'expired'
  source_file_id?: string | null
  note?: string
}

export interface BomItem {
  id?: string
  item_code: string
  parent_item_code?: string | null
  name: string
  category?: string | null
  specification?: string
  material?: string
  process?: string
  quantity: number
  unit: string
  unit_cost_estimate?: number | null
  estimate_currency?: string
  supplier_notes?: string
  is_optional?: boolean
  sort_order?: number
  quotes: BomQuote[]
}

export interface QualityStandard {
  id?: string
  category: string
  requirement: string
  test_method?: string
  acceptance_criteria?: string
  priority: 'P0' | 'P1' | 'P2'
  status?: 'proposed' | 'confirmed' | 'verified' | 'blocked' | 'deferred'
  source_reference?: string
  sort_order?: number
}

export interface ProductRisk {
  id?: string
  risk_type: 'market' | 'supply' | 'compliance' | 'operations' | 'product' | 'other'
  title: string
  description?: string
  likelihood: 'low' | 'medium' | 'high'
  impact: 'low' | 'medium' | 'high'
  mitigation?: string
  owner?: string | null
  status?: 'open' | 'mitigating' | 'accepted' | 'closed'
  sort_order?: number
}

export interface ProductVersionDetail {
  project: { id: string; name: string; category: string | null; target_market: string | null }
  concept: ProductConcept
  variant: ProductVariant
  version: VariantVersion
  definition: ProductDefinition | null
  personas: ProductPersona[]
  requirements: ProductRequirement[]
  development_issues: DevelopmentIssue[]
  experience_flows: Array<{ flow: ExperienceFlow; steps: Array<{ step: ExperienceStep; bom_item_codes: string[] }> }>
  bom_items: Array<{ item: BomItem; parent_item_code: string | null; quotes: BomQuote[] }>
  quality_standards: QualityStandard[]
  risks: ProductRisk[]
  assets: Array<{ id: string; file_id: string; asset_role: string; caption: string }>
  decisions: Array<{ id: string; decision_type: string; outcome: string; rationale: string; impact: string; conditions: string; decided_at: string }>
}

async function productRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch('/api' + path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!response.ok) {
    let message = 'Request failed (' + response.status + ')'
    try {
      const payload = await response.json()
      message = payload.detail ?? message
    } catch {
      // Keep the HTTP status message.
    }
    throw new Error(message)
  }
  return response.json() as Promise<T>
}

export function listConcepts(projectId: string) {
  return productRequest<ProductConcept[]>('/projects/' + projectId + '/concepts')
}

export function createConcept(projectId: string, input: Pick<ProductConcept, 'name'> & Partial<Pick<ProductConcept, 'code' | 'category' | 'description'>>) {
  return productRequest<ProductConcept>('/projects/' + projectId + '/concepts', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function getConcept(conceptId: string) {
  return productRequest<ProductConcept>('/concepts/' + conceptId)
}

export function updateConcept(conceptId: string, input: Partial<Pick<ProductConcept, 'name' | 'category' | 'description' | 'status'>>) {
  return productRequest<ProductConcept>('/concepts/' + conceptId, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function listVariants(conceptId: string) {
  return productRequest<ProductVariant[]>('/concepts/' + conceptId + '/variants')
}

export function createVariant(conceptId: string, input: Pick<ProductVariant, 'name'> & Partial<Pick<ProductVariant, 'code' | 'description' | 'sort_order'>>) {
  return productRequest<ProductVariant>('/concepts/' + conceptId + '/variants', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function getVariant(variantId: string) {
  return productRequest<{ variant: ProductVariant; versions: VariantVersion[] }>('/variants/' + variantId)
}

export function createVersion(variantId: string, changeSummary: string) {
  return productRequest<VariantVersion>('/variants/' + variantId + '/versions', {
    method: 'POST',
    body: JSON.stringify({ change_summary: changeSummary }),
  })
}

export function getVersion(versionId: string) {
  return productRequest<ProductVersionDetail>('/versions/' + versionId)
}

export function saveDefinition(versionId: string, input: ProductDefinition) {
  return productRequest<ProductDefinition>('/versions/' + versionId + '/definition', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function savePersonas(versionId: string, input: ProductPersona[]) {
  return productRequest<ProductPersona[]>('/versions/' + versionId + '/personas', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function saveRequirements(versionId: string, input: ProductRequirement[]) {
  return productRequest<ProductRequirement[]>('/versions/' + versionId + '/requirements', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function saveDevelopmentIssues(versionId: string, input: DevelopmentIssue[]) {
  return productRequest<DevelopmentIssue[]>('/versions/' + versionId + '/development-issues', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function saveExperienceFlows(versionId: string, input: ExperienceFlow[]) {
  return productRequest<ExperienceFlow[]>('/versions/' + versionId + '/experience-flows', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function saveBom(versionId: string, input: BomItem[]) {
  return productRequest<BomItem[]>('/versions/' + versionId + '/bom', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function saveQualityStandards(versionId: string, input: QualityStandard[]) {
  return productRequest<QualityStandard[]>('/versions/' + versionId + '/quality-standards', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function saveRisks(versionId: string, input: ProductRisk[]) {
  return productRequest<ProductRisk[]>('/versions/' + versionId + '/risks', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function confirmVersion(versionId: string, input: {
  decision_type: 'approve' | 'conditional' | 'hold' | 'reject' | 'continue'
  outcome: string
  rationale?: string
  impact?: string
  conditions?: string
}) {
  return productRequest<{ version: VariantVersion; decision: ProductVersionDetail['decisions'][number] }>(
    '/versions/' + versionId + '/confirm',
    { method: 'POST', body: JSON.stringify(input) },
  )
}

export function getVersionDiff(versionId: string) {
  return productRequest<Record<string, unknown>>('/versions/' + versionId + '/diff')
}