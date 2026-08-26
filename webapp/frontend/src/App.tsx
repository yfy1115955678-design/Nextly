import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/AppShell'
import { ProjectProvider } from './lib/projectState'
import FeasibilityPage from './pages/FeasibilityPage'
import OpportunityPage from './pages/OpportunityPage'
import OverviewPage from './pages/OverviewPage'
import ProductPage from './pages/ProductPage'
import ResearchPage from './pages/ResearchPage'
import ReviewPage from './pages/ReviewPage'
import TracePage from './pages/TracePage'

export default function App() {
  return (
    <ProjectProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<OverviewPage />} />
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
