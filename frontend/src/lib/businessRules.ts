// Every mandatory business rule from the spec lives here, and ONLY here.
// If you find yourself writing an availability/status check inside a
// component, stop — import from this file instead. This is what keeps
// four people's code consistent without talking to each other constantly.

import type { Vehicle, Driver } from "@/types";

export interface DispatchCheckResult {
  ok: boolean;
  reasons: string[]; // empty if ok === true
}

/**
 * All four mandatory checks before a trip can be dispatched:
 * - vehicle must be available (not retired/in_shop/on_trip)
 * - driver must be available (not suspended/on_trip/off_duty)
 * - driver's license must not be expired
 * - cargo weight must not exceed vehicle's max load capacity
 */
export function canDispatch(
  vehicle: Pick<Vehicle, "status" | "max_load_capacity_kg">,
  driver: Pick<Driver, "status" | "license_expiry_date">,
  cargoWeightKg: number
): DispatchCheckResult {
  const reasons: string[] = [];

  if (vehicle.status !== "available") {
    reasons.push(`Vehicle is not available (status: ${vehicle.status}).`);
  }
  if (driver.status !== "available") {
    reasons.push(`Driver is not available (status: ${driver.status}).`);
  }
  if (isLicenseExpired(driver.license_expiry_date)) {
    reasons.push("Driver's license is expired.");
  }
  if (cargoWeightKg > vehicle.max_load_capacity_kg) {
    reasons.push(
      `Cargo weight (${cargoWeightKg}kg) exceeds vehicle's max load capacity (${vehicle.max_load_capacity_kg}kg).`
    );
  }

  return { ok: reasons.length === 0, reasons };
}

export function isLicenseExpired(licenseExpiryDate: string): boolean {
  return new Date(licenseExpiryDate) < new Date();
}

/** Vehicles eligible to appear in the Trip form's vehicle dropdown. */
export function isVehicleAssignable(vehicle: Pick<Vehicle, "status">): boolean {
  return vehicle.status === "available";
}

/** Drivers eligible to appear in the Trip form's driver dropdown. */
export function isDriverAssignable(
  driver: Pick<Driver, "status" | "license_expiry_date">
): boolean {
  return driver.status === "available" && !isLicenseExpired(driver.license_expiry_date);
}

// --- Status transition tables (for reference / validating UI actions) ---
// Encodes exactly what's in the spec's Section 4. Use these to decide which
// action buttons to show/enable for a given trip or maintenance record.

export const TRIP_TRANSITIONS: Record<string, string[]> = {
  draft: ["dispatched", "cancelled"],
  dispatched: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export const MAINTENANCE_TRANSITIONS: Record<string, string[]> = {
  active: ["closed"],
  closed: [],
};

export function canTransitionTrip(from: string, to: string): boolean {
  return TRIP_TRANSITIONS[from]?.includes(to) ?? false;
}
