import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DatabaseProvider } from "@/context/database-context";
import { AppLayout } from "@/components/layout/app-layout";
import { DashboardPage } from "@/pages/dashboard-page";
import { ProjectListPage } from "@/pages/project-list-page";
import { ProjectDetailPage } from "@/pages/project-detail-page";
import { NotFoundPage } from "@/pages/not-found-page";

function App() {
  return (
    <DatabaseProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectListPage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DatabaseProvider>
  );
}

export default App;
