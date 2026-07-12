import type { UserRole } from "@/types";

export type AppPage =
  | "dashboard"
  | "users"
  | "vehicles"
  | "drivers"
  | "trips"
  | "maintenance"
  | "fuel-expenses"
  | "reports";

const PAGE_ACCESS: Record<UserRole, AppPage[]> = {
  fleet_manager: ["dashboard", "users", "vehicles", "drivers", "trips", "maintenance", "fuel-expenses", "reports"],
  dispatcher: ["dashboard", "vehicles", "drivers", "trips", "fuel-expenses"],
  driver: ["dashboard", "vehicles", "drivers", "trips", "fuel-expenses"],
  safety_officer: ["dashboard", "drivers", "trips", "reports"],
  financial_analyst: ["dashboard", "fuel-expenses", "reports"],
};

export function canAccessPage(role: UserRole | undefined, page: AppPage): boolean {
  if (!role) return false;
  return PAGE_ACCESS[role]?.includes(page) ?? false;
}

export function getDefaultRoute(role: UserRole | undefined): string {
  if (role === "dispatcher") return "/trips";
  if (role === "safety_officer") return "/dashboard";
  if (role === "financial_analyst") return "/reports";
  if (role === "driver") return "/trips";
  return "/dashboard";
}