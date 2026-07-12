export function isLicenseExpired(licenseExpiryDate) {
  return new Date(licenseExpiryDate) < new Date();
}

export function canDispatch(vehicle, driver, cargoWeightKg) {
  const reasons = [];
  if (vehicle.status !== "available") {
    reasons.push(`Vehicle is not available (status: ${vehicle.status}).`);
  }
  if (driver.status !== "available") {
    reasons.push(`Driver is not available (status: ${driver.status}).`);
  }
  if (isLicenseExpired(driver.license_expiry_date)) {
    reasons.push("Driver's license is expired.");
  }
  if (Number(cargoWeightKg) > Number(vehicle.max_load_capacity_kg)) {
    reasons.push(
      `Cargo weight (${cargoWeightKg}kg) exceeds vehicle's max load capacity (${vehicle.max_load_capacity_kg}kg).`
    );
  }
  return { ok: reasons.length === 0, reasons };
}

export const TRIP_TRANSITIONS = {
  draft: ["dispatched", "cancelled"],
  dispatched: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function canTransitionTrip(from, to) {
  return TRIP_TRANSITIONS[from]?.includes(to) ?? false;
}
