// Role -> allowed actions. Gate ACTIONS (buttons, form submits), not whole
// pages — everyone can view everything, most modules just aren't writable
// for every role. Keeps RBAC to one lookup table instead of scattered
// role === "x" checks throughout the app.

import type { UserRole } from "@/types";

export type Action =
  | "users:write"
  | "vehicles:write"
  | "drivers:write"
  | "trips:create"
  | "trips:dispatch"
  | "trips:complete"
  | "trips:cancel"
  | "maintenance:write"
  | "fuel:write"
  | "expenses:write"
  | "reports:view"
  | "reports:export";

const PERMISSIONS: Record<UserRole, Action[]> = {
  fleet_manager: [
    "users:write",
    "vehicles:write",
    "drivers:write",
    "maintenance:write",
    "fuel:write",
    "expenses:write",
    "trips:create",
    "reports:view",
    "reports:export",
  ],
  dispatcher: ["vehicles:write", "trips:create", "trips:dispatch", "trips:complete", "trips:cancel", "fuel:write", "expenses:write"],
  driver: ["trips:complete", "fuel:write"],
  safety_officer: ["drivers:write", "trips:cancel", "reports:view"],
  financial_analyst: ["reports:view", "reports:export"],
};

export function can(role: UserRole | undefined, action: Action): boolean {
  if (!role) return false;
  return PERMISSIONS[role]?.includes(action) ?? false;
}
