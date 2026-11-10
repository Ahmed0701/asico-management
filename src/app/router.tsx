import { createBrowserRouter } from "react-router"
import AppLayout from "@/shared/layout/AppLayout"
import AuthLayout from "@/shared/layout/AuthLayout"
import RequireAuth from "@/features/auth/components/RequireAuth"
import LoginPage from "@/features/auth/pages/LoginPage"
import SignupPage from "@/features/auth/pages/SignupPage"
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage"
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage"
import ChangePasswordPage from "@/features/auth/pages/ChangePasswordPage"
import ProfilePage from "@/features/auth/pages/ProfilePage"
import DashboardRoute from "@/features/dashboard/pages/DashboardRoute"
import ContractorsRoute from "@/features/contractors/pages/ContractorsRoute"
import ContractorDetailRoute from "@/features/contractors/pages/ContractorDetailRoute"
import ContractorSummaryRoute from "@/features/contractors/pages/ContractorSummaryRoute"
import EngineersRoute from "@/features/engineers/pages/EngineersRoute"
import EngineerDetailRoute from "@/features/engineers/pages/EngineerDetailRoute"
import UsersPage from "@/features/users/pages/UsersPage"
import UserDetailPage from "@/features/users/pages/UserDetailPage"
import PermissionsPage from "@/features/permissions/pages/PermissionsPage"
import AuditLogRoute from "@/features/audit/pages/AuditLogRoute"
import AuditLogDetailRoute from "@/features/audit/pages/AuditLogDetailRoute"
import AuditLogRedirect from "@/features/audit/pages/AuditLogRedirect"
import NotFoundPage from "@/shared/layout/NotFoundPage"
import RouteErrorPage from "@/shared/layout/RouteErrorPage"
import VillasRoute from "@/features/villas/pages/VillasRoute"
import VillaDetailRoute from "@/features/villas/pages/VillaDetailRoute"
import MewFollowUpRoute from "@/features/villas/pages/MewFollowUpRoute"
import MewInspectionRoute from "@/features/villas/pages/MewInspectionRoute"
import MewInspectionPassedRoute from "@/features/villas/pages/MewInspectionPassedRoute"
import MaintenanceRoute from "@/features/maintenance/pages/MaintenanceRoute"
import MaterialsRoute from "@/features/materials/pages/MaterialsRoute"
import MaintenanceSolvedRoute from "@/features/maintenance/pages/MaintenanceSolvedRoute"
import OpenWorksPage from "@/features/open-works/pages/OpenWorksPage"
import DailyReportsPage from "@/features/daily-reports/pages/DailyReportsPage"
import SmallWorksPage from "@/features/small-works/pages/SmallWorksPage"
import DoneWorksRoute from "@/features/done-works/pages/DoneWorksRoute"
import SiteReportsPage from "@/features/site-reports/pages/SiteReportsPage"
import AreasPage from "@/features/areas/pages/AreasPage"
import ElecPhasesPage from "@/features/elec-phases/pages/ElecPhasesPage"
import ElectricalEngineersRoute from "@/features/electrical-engineers/pages/ElectricalEngineersRoute"
import ElectricalEngineerDetailRoute from "@/features/electrical-engineers/pages/ElectricalEngineerDetailRoute"

// Error boundaries (React Router's errorElement): a page that throws while rendering or loading shows RouteErrorPage instead
// of a blank screen. Inside the app, the boundary sits below AppLayout, so the sidebar and header stay usable; the ones on
// the layouts catch what the layouts themselves throw.
export const router = createBrowserRouter([
  {
    Component: AuthLayout,
    ErrorBoundary: RouteErrorPage,
    children: [
      { path: "login", Component: LoginPage },
      { path: "signup", Component: SignupPage },
      { path: "forgot-password", Component: ForgotPasswordPage },
      { path: "reset-password", Component: ResetPasswordPage },
    ],
  },
  {
    path: "/",
    Component: RequireAuth,
    ErrorBoundary: RouteErrorPage,
    children: [
      {
        Component: AppLayout,
        children: [
          {
            ErrorBoundary: RouteErrorPage,
            children: [
              { index: true, Component: DashboardRoute },
              { path: "villas", Component: VillasRoute },
              { path: "villas/mew-follow-up", Component: MewFollowUpRoute },
              { path: "villas/mew-inspection", Component: MewInspectionRoute },
              {
                path: "villas/mew-inspection-passed",
                Component: MewInspectionPassedRoute,
              },
              { path: "villas/open-works", Component: OpenWorksPage },
              { path: "maintenance", Component: MaintenanceRoute },
              { path: "materials", Component: MaterialsRoute },
              {
                path: "maintenance/solved",
                Component: MaintenanceSolvedRoute,
              },
              { path: "villas/:id", Component: VillaDetailRoute },
              { path: "contractors", Component: ContractorsRoute },
              { path: "contractors/:id", Component: ContractorDetailRoute },
              {
                path: "contractors/:id/summary",
                Component: ContractorSummaryRoute,
              },
              { path: "civil-engineers", Component: EngineersRoute },
              { path: "civil-engineers/:id", Component: EngineerDetailRoute },
              {
                path: "electrical-engineers",
                Component: ElectricalEngineersRoute,
              },
              {
                path: "electrical-engineers/:id",
                Component: ElectricalEngineerDetailRoute,
              },
              { path: "daily-reports", Component: DailyReportsPage },
              { path: "small-works", Component: SmallWorksPage },
              { path: "done-works", Component: DoneWorksRoute },
              { path: "site-reports", Component: SiteReportsPage },
              { path: "areas", Component: AreasPage },
              { path: "elec-phases", Component: ElecPhasesPage },
              { path: "users", Component: UsersPage },
              { path: "users/:id", Component: UserDetailPage },
              { path: "permissions", Component: PermissionsPage },
              { path: "audit", Component: AuditLogRoute },
              { path: "audit/:id", Component: AuditLogDetailRoute },
              { path: "audit-log", Component: AuditLogRedirect },
              { path: "profile", Component: ProfilePage },
              { path: "change-password", Component: ChangePasswordPage },
              { path: "*", Component: NotFoundPage },
            ],
          },
        ],
      },
    ],
  },
])
