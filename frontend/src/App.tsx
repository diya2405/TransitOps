import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { Navbar } from "@/components/layout/Navbar";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Users from "@/pages/users/List";
import VehicleList from "@/pages/vehicles/List";
import DriverList from "@/pages/drivers/List";
import TripList from "@/pages/trips/List";
import MaintenanceList from "@/pages/maintenance/List";
import FuelExpensesList from "@/pages/fuel-expenses/List";
import Reports from "@/pages/reports/Reports";
import { useAuth } from "@/context/AuthContext";
import { canAccessPage, getDefaultRoute } from "@/lib/pageAccess";

function RoleRoute({ page, children }: { page: Parameters<typeof canAccessPage>[1]; children: React.ReactNode }) {
  const { profile } = useAuth();
  if (!canAccessPage(profile?.role, page)) {
    return <Navigate to={getDefaultRoute(profile?.role)} replace />;
  }
  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {children}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
            <Route path="/users" element={<RoleRoute page="users"><AppLayout><Users /></AppLayout></RoleRoute>} />
            <Route path="/vehicles" element={<RoleRoute page="vehicles"><AppLayout><VehicleList /></AppLayout></RoleRoute>} />
            <Route path="/drivers" element={<RoleRoute page="drivers"><AppLayout><DriverList /></AppLayout></RoleRoute>} />
            <Route path="/trips" element={<RoleRoute page="trips"><AppLayout><TripList /></AppLayout></RoleRoute>} />
            <Route path="/maintenance" element={<RoleRoute page="maintenance"><AppLayout><MaintenanceList /></AppLayout></RoleRoute>} />
            <Route path="/fuel-expenses" element={<RoleRoute page="fuel-expenses"><AppLayout><FuelExpensesList /></AppLayout></RoleRoute>} />
            <Route path="/reports" element={<RoleRoute page="reports"><AppLayout><Reports /></AppLayout></RoleRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
