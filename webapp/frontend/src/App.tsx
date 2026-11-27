import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import { ProjectProvider } from './lib/projectState'
import BackupsPage from './pages/BackupsPage'
import FeasibilityPage from './pages/FeasibilityPage'
import OpportunityPage from './pages/OpportunityPage'
import OverviewPage from './pages/OverviewPage'
import ProductPage from './pages/ProductPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectProductPage from './pages/ProjectProductPage'
import ConceptPage from './pages/ConceptPage'
import VariantPage from './pages/VariantPage'
import ProductVersionEditorPage from './pages/ProductVersionEditorPage'
import ResearchPage from './pages/ResearchPage'
import ReviewPage from './pages/ReviewPage'
import TracePage from './pages/TracePage'

export default function App() {
  return (
    <ProjectProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<OverviewPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:projectId/product-definition" element={<ProjectProductPage />} />
          <Route path="concepts/:conceptId" element={<ConceptPage />} />
          <Route path="variants/:variantId" element={<VariantPage />} />
          <Route path="versions/:versionId" element={<ProductVersionEditorPage />} />
          <Route path="settings/backups" element={<BackupsPage />} />
          <Route path="opportunity" element={<OpportunityPage />} />
          <Route path="research" element={<ResearchPage />} />
          <Route path="product" element={<ProductPage />} />
          <Route path="feasibility" element={<FeasibilityPage />} />
          <Route path="review" element={<ReviewPage />} />
          <Route path="trace" element={<TracePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ProjectProvider>
  )
}