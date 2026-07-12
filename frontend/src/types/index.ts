// Shared types — the single source of truth for data shapes across the app.
// Do NOT redefine these inline in a component. Import from here.
// If a field is missing, add it here and tell the team in your shared channel.

export type UserRole = "fleet_manager" | "dispatcher" | "driver" | "safety_officer" | "financial_analyst";

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface UserAccount extends Profile {
  created_at: string;
}

export type VehicleStatus = "available" | "on_trip" | "in_shop" | "retired";

export interface Vehicle {
  id: string;
  registration_number: string;
  name_model: string;
  type: string;
  max_load_capacity_kg: number;
  odometer_km: number;
  acquisition_cost: number;
  status: VehicleStatus;
  region: string | null;
  created_at: string;
}

export type DriverStatus = "available" | "on_trip" | "off_duty" | "suspended";

export interface Driver {
  id: string;
  name: string;
  license_number: string;
  license_category: string | null;
  license_expiry_date: string; // ISO date
  contact_number: string | null;
  safety_score: number;
  status: DriverStatus;
  created_at: string;
}

export type TripStatus = "draft" | "dispatched" | "completed" | "cancelled";

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicle_id: string;
  driver_id: string;
  cargo_weight_kg: number;
  planned_distance_km: number;
  final_odometer_km: number | null;
  fuel_consumed_l: number | null;
  status: TripStatus;
  created_by: string | null;
  created_at: string;
  dispatched_at: string | null;
  completed_at: string | null;
}

export type MaintenanceStatus = "active" | "closed";

export interface MaintenanceLog {
  id: string;
  vehicle_id: string;
  description: string;
  cost: number;
  status: MaintenanceStatus;
  opened_at: string;
  closed_at: string | null;
}

export interface FuelLog {
  id: string;
  vehicle_id: string;
  trip_id: string | null;
  liters: number;
  cost: number;
  date: string;
}

export type ExpenseType = "toll" | "maintenance" | "other";

export interface Expense {
  id: string;
  vehicle_id: string;
  type: ExpenseType;
  amount: number;
  date: string;
  note: string | null;
}
