function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPastDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);
  return parsed < today;
}

export function validateVehiclePayload(payload) {
  const errors = [];
  if (!isNonEmptyString(payload?.registration_number)) errors.push("registration_number is required.");
  if (!isNonEmptyString(payload?.name_model)) errors.push("name_model is required.");
  if (!isNonEmptyString(payload?.type)) errors.push("type is required.");
  if (payload?.max_load_capacity_kg === undefined || Number(payload.max_load_capacity_kg) <= 0) {
    errors.push("max_load_capacity_kg must be a positive number.");
  }
  if (payload?.odometer_km !== undefined && Number(payload.odometer_km) < 0) {
    errors.push("odometer_km cannot be negative.");
  }
  if (payload?.acquisition_cost !== undefined && Number(payload.acquisition_cost) < 0) {
    errors.push("acquisition_cost cannot be negative.");
  }
  return { errors };
}

export function validateDriverPayload(payload) {
  const errors = [];
  if (!isNonEmptyString(payload?.name)) errors.push("name is required.");
  if (!isNonEmptyString(payload?.license_number)) errors.push("license_number is required.");
  if (!isNonEmptyString(payload?.license_category)) errors.push("license_category is required.");
  if (!payload?.license_expiry_date) {
    errors.push("license_expiry_date is required.");
  } else if (isPastDate(payload.license_expiry_date)) {
    errors.push("license_expiry_date cannot be in the past.");
  }
  if (payload?.safety_score !== undefined && (Number(payload.safety_score) < 0 || Number(payload.safety_score) > 100)) {
    errors.push("safety_score must be between 0 and 100.");
  }
  return { errors };
}

export function validateFuelPayload(payload) {
  const errors = [];
  if (!isNonEmptyString(payload?.vehicle_id)) errors.push("vehicle_id is required.");
  if (payload?.liters === undefined || Number(payload.liters) <= 0) errors.push("liters must be a positive number.");
  if (payload?.cost === undefined || Number(payload.cost) < 0) errors.push("cost cannot be negative.");
  if (payload?.date && Number.isNaN(new Date(payload.date).getTime())) errors.push("date must be a valid date.");
  return { errors };
}

export function validateExpensePayload(payload) {
  const errors = [];
  if (!isNonEmptyString(payload?.vehicle_id)) errors.push("vehicle_id is required.");
  if (!["toll", "maintenance", "other"].includes(payload?.type)) errors.push("type must be one of: toll, maintenance, other.");
  if (payload?.amount === undefined || Number(payload.amount) < 0) errors.push("amount cannot be negative.");
  if (payload?.date && Number.isNaN(new Date(payload.date).getTime())) errors.push("date must be a valid date.");
  return { errors };
}
