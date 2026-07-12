-- TransitOps schema — plain Postgres, no Supabase-specific extensions.
-- Run once against your shared Postgres instance:
--   psql -U postgres -d transitops -f db/schema.sql diya: password
-- or via docker-compose (see root README) it runs automatically on first boot.
create extension if not exists "pgcrypto"; -- for gen_random_uuid()
create type user_role as enum ('fleet_manager', 'dispatcher', 'driver', 'safety_officer', 'financial_analyst');
create type vehicle_status as enum ('available', 'on_trip', 'in_shop', 'retired');
create type driver_status as enum ('available', 'on_trip', 'off_duty', 'suspended');
create type trip_status as enum ('draft', 'dispatched', 'completed', 'cancelled');
create type maintenance_status as enum ('active', 'closed');
create type expense_type as enum ('toll', 'maintenance', 'other');

create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text not null,
  role user_role not null,
  created_at timestamptz default now()
);

create table vehicles (
  id uuid primary key default gen_random_uuid(),
  registration_number text not null unique,
  name_model text not null,
  type text not null,
  max_load_capacity_kg numeric not null,
  odometer_km numeric not null default 0,
  acquisition_cost numeric not null default 0,
  status vehicle_status not null default 'available',
  region text,
  created_at timestamptz default now()
);

create table drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  license_number text not null,
  license_category text,
  license_expiry_date date not null,
  contact_number text,
  safety_score numeric default 100,
  status driver_status not null default 'available',
  created_at timestamptz default now()
);

create table trips (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  destination text not null,
  vehicle_id uuid references vehicles(id),
  driver_id uuid references drivers(id),
  cargo_weight_kg numeric not null,
  planned_distance_km numeric not null,
  final_odometer_km numeric,
  fuel_consumed_l numeric,
  status trip_status not null default 'draft',
  created_by uuid references users(id),
  created_at timestamptz default now(),
  dispatched_at timestamptz,
  completed_at timestamptz
);

create table maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id),
  description text not null,
  cost numeric not null default 0,
  status maintenance_status not null default 'active',
  opened_at timestamptz default now(),
  closed_at timestamptz
);

create table fuel_logs (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id),
  trip_id uuid references trips(id),
  liters numeric not null,
  cost numeric not null,
  date date not null default current_date
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references vehicles(id),
  type expense_type not null,
  amount numeric not null,
  date date not null default current_date,
  note text
);

create index idx_trips_vehicle_id on trips(vehicle_id);
create index idx_trips_driver_id on trips(driver_id);
create index idx_trips_status on trips(status);
create index idx_vehicles_status on vehicles(status);
create index idx_maintenance_vehicle_id on maintenance_logs(vehicle_id);
create index idx_fuel_logs_vehicle_id on fuel_logs(vehicle_id);

-- Seed vehicles/drivers so nobody is blocked waiting on real CRUD to work.
insert into vehicles (registration_number, name_model, type, max_load_capacity_kg, odometer_km, acquisition_cost, status, region)
values
  ('GJ-01-AB-1234', 'Tata Ace', 'Van', 500, 12000, 650000, 'available', 'West'),
  ('GJ-01-CD-5678', 'Ashok Leyland Dost', 'Truck', 1500, 34000, 1200000, 'available', 'West'),
  ('GJ-01-EF-9012', 'Mahindra Bolero Pickup', 'Pickup', 800, 8000, 900000, 'in_shop', 'North');

insert into drivers (name, license_number, license_category, license_expiry_date, contact_number, safety_score, status)
values
  ('Alex Sharma', 'DL-0001', 'LMV', '2027-06-01', '9990001111', 95, 'available'),
  ('Priya Nair', 'DL-0002', 'HMV', '2026-12-01', '9990002222', 88, 'available'),
  ('Ramesh Iyer', 'DL-0003', 'HMV', '2025-01-01', '9990003333', 70, 'available'); -- expired license, on purpose, to test the validation rule

-- Demo users are inserted by `npm run seed` (backend), not here, because
-- password hashing needs bcrypt at runtime — see backend/src/seed.js.
