import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { useNeonAuth } from "@neondatabase/neon-js/auth/react";

// Layouts
import { DashboardLayout } from "@/components/shared/DashboardLayout";

// Auth pages
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";

// Dashboard pages
import { DashboardPage } from "@/pages/dashboard/DashboardPage";
import { IssuesPage } from "@/pages/dashboard/IssuesPage";
import { IssueDetailPage } from "@/pages/dashboard/IssueDetailPage";
import { ProjectsPage } from "@/pages/dashboard/ProjectsPage";
import { ProjectDetailPage } from "@/pages/dashboard/ProjectDetailPage";
import { AgentsPage } from "@/pages/dashboard/AgentsPage";
import { CustomerAgentsPage } from "@/pages/dashboard/CustomerAgentsPage";
import { AgentAdminPage } from "@/pages/dashboard/AgentAdminPage";

/** Redirect to login if not authenticated */
function RequireAuth() {
  const { user, isLoading } = useNeonAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<RequireAuth />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/issues" element={<IssuesPage />} />
            <Route path="/dashboard/issues/:identifier" element={<IssueDetailPage />} />
            <Route path="/dashboard/projects" element={<ProjectsPage />} />
            <Route path="/dashboard/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/dashboard/agents" element={<AgentsPage />} />
            <Route path="/dashboard/customer-agents" element={<CustomerAgentsPage />} />
            <Route path="/dashboard/admin/agents" element={<AgentAdminPage />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
