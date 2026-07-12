const PERMISSIONS = {
  fleet_manager: [
    "users:write",
    "vehicles:write",
    "drivers:write",
    "maintenance:write",
    "fuel:write",
    "expenses:write",
    "reports:view",
    "reports:export",
  ],
  dispatcher: ["trips:create", "trips:dispatch", "trips:complete", "trips:cancel", "fuel:write", "expenses:write"],
  driver: ["trips:create", "trips:dispatch", "trips:complete", "trips:cancel", "fuel:write"],
  safety_officer: ["drivers:write", "reports:view"],
  financial_analyst: ["reports:view", "reports:export"],
};

export function can(role, action) {
  return PERMISSIONS[role]?.includes(action) ?? false;
}
