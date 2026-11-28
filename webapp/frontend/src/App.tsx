import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import AppShell from './components/AppShell'
import LocalShell from './components/LocalShell'
import { ProjectProvider } from './lib/projectState'
import { getConcept, getVariant, getVersion, currentVersion, versionPath } from './lib/productApi'
import BackupsPage from './pages/BackupsPage'
import FeasibilityPage from './pages/FeasibilityPage'
import OpportunityPage from './pages/OpportunityPage'
import OverviewPage from './pages/OverviewPage'
import ProductPage from './pages/ProductPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectProductPage from './pages/ProjectProductPage'
import ProductVersionEditorPage from './pages/ProductVersionEditorPage'
import { ProjectFilesPage, ProjectDecisionsPage } from './pages/ProjectRecordsPages'
import ResearchPage from './pages/ResearchPage'
import ReviewPage from './pages/ReviewPage'
import TracePage from './pages/TracePage'

function VersionRoute() {
  const { versionId } = useParams()
  return <ProductVersionEditorPage key={versionId}/>
}

function LegacyProjectLink() {
  const { conceptId, variantId, versionId } = useParams()
  const [target, setTarget] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    async function resolve() {
      if (versionId) {
        const d = await getVersion(versionId)
        return versionPath(d.project.id, versionId)
      }
      if (variantId) {
        const v = await getVariant(variantId)
        const c = await getConcept(v.variant.concept_id)
        const current = currentVersion(v.versions)
        return current ? versionPath(c.project_id, current.id) : '/projects/' + c.project_id + '/product-definition'
      }
      if (conceptId) {
        const c = await getConcept(conceptId)
        return '/projects/' + c.project_id + '/product-definition'
      }
      return '/projects'
    }
    resolve().then(path => { if (active) setTarget(path) }).catch(e => { if (active) setError(String(e)) })
    return () => { active = false }
  }, [conceptId, variantId, versionId])
  if (target) return <Navigate to={target} replace/>
  return <div className="page-stack"><p>{error || '正在定位项目…'}</p><a href="/projects">返回项目库</a></div>
}

export default function App() {
  return <Routes>
    <Route element={<LocalShell/>}>
      <Route index element={<Navigate to="/projects" replace/>}/>
      <Route path="projects" element={<ProjectsPage/>}/>
      <Route path="projects/:projectId" element={<Navigate to="product-definition" replace/>}/>
      <Route path="projects/:projectId/product-definition" element={<ProjectProductPage/>}/>
      <Route path="projects/:projectId/product-definition/:versionId" element={<VersionRoute/>}/>
      <Route path="projects/:projectId/files" element={<ProjectFilesPage/>}/>
      <Route path="projects/:projectId/decisions" element={<ProjectDecisionsPage/>}/>
      <Route path="settings/backups" element={<BackupsPage/>}/>
      <Route path="concepts/:conceptId" element={<LegacyProjectLink/>}/>
      <Route path="variants/:variantId" element={<LegacyProjectLink/>}/>
      <Route path="versions/:versionId" element={<LegacyProjectLink/>}/>
    </Route>
    <Route element={<ProjectProvider><AppShell/></ProjectProvider>}>
      <Route path="demo" element={<OverviewPage/>}/>
      <Route path="opportunity" element={<OpportunityPage/>}/>
      <Route path="research" element={<ResearchPage/>}/>
      <Route path="product" element={<ProductPage/>}/>
      <Route path="feasibility" element={<FeasibilityPage/>}/>
      <Route path="review" element={<ReviewPage/>}/>
      <Route path="trace" element={<TracePage/>}/>
    </Route>
    <Route path="*" element={<Navigate to="/projects" replace/>}/>
  </Routes>
}
