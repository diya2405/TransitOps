import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function ProtectedRoute() {
  const { profile, loading } = useAuth();

  if (loading) return <div className="p-6">Loading...</div>;
  if (!profile) return <Navigate to="/login" replace />;

  return <Outlet />;
}
