import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { can } from "@/lib/permissions";
import { canAccessPage } from "@/lib/pageAccess";
import type { AppPage } from "@/lib/pageAccess";

const links: Array<{ to: string; label: string; page: AppPage }> = [
  { to: "/dashboard", label: "Dashboard", page: "dashboard" },
  { to: "/vehicles", label: "Vehicles", page: "vehicles" },
  { to: "/drivers", label: "Drivers", page: "drivers" },
  { to: "/trips", label: "Trips", page: "trips" },
  { to: "/maintenance", label: "Maintenance", page: "maintenance" },
  { to: "/fuel-expenses", label: "Fuel & Expenses", page: "fuel-expenses" },
  { to: "/reports", label: "Reports", page: "reports" },
];

export function Navbar() {
  const { profile, signOut } = useAuth();
  const visibleLinks: Array<{ to: string; label: string }> = [
    ...links.filter((link) => canAccessPage(profile?.role, link.page)),
    ...(can(profile?.role, "users:write") ? [{ to: "/users", label: "Manage Users" }] : []),
  ];

  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-6">
        <span className="font-semibold text-gray-900">TransitOps</span>
        {visibleLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `text-sm ${isActive ? "text-blue-600 font-medium" : "text-gray-600 hover:text-gray-900"}`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span>
          {profile?.name} ({profile?.role})
        </span>
        <button onClick={() => signOut()} className="text-red-600 hover:underline">
          Sign out
        </button>
      </div>
    </nav>
  );
}
