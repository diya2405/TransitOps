TransitOps — Smart Transport Operations Platform
A centralized platform to digitize vehicle, driver, dispatch, maintenance, and expense management for transport/logistics operations — replacing spreadsheets and manual logbooks with real-time visibility and enforced business rules.

Hackathon Duration: 8 Hours

Table of Contents
Tech Stack
Team & Work Allocation
Getting Started (Local Setup)
Database Design
Authentication & RBAC Flow
Roles & Navigation
Mandatory Business Rules
Example Workflow (Demo Script)
Folder Structure
Environment Variables
Git Workflow
Tech Stack
Layer	Technology
Frontend	React
Backend	Node.js (Express)
Database	PostgreSQL (local instance)
Auth	Email + Password, session/JWT-based, custom RBAC
Team & Work Allocation
Phase 1

Member	Module
Rushabh	Login & Registration (Auth)
Keval	Driver Dashboard
Priya	Financial Analyst Dashboard
Diya	Safety Officer Dashboard
The table structure/ERD for login & registration is in this repo for reference (see Database Design). If any additional columns are needed on profiles or elsewhere, please inform the team before altering the schema so migrations stay in sync.

This README will be updated as Phase 2 (Fleet Manager dashboard, Trips, Maintenance, Fuel & Expenses, Reports) gets allocated.

Getting Started (Local Setup)
Prerequisites
Node.js (v18+ recommended)
PostgreSQL installed and running locally
npm or yarn
Git
1. Clone the repo
git clone <repo-url>
cd transitops
2. Database setup (PostgreSQL local)
# Open psql and create the database
psql -U postgres
CREATE DATABASE transitops;
\q
Run the schema/migration scripts (see /backend/db or /backend/migrations once created) to create the tables listed under Database Design.

3. Backend setup
cd backend
npm install
cp .env.example .env   # fill in your local DB credentials (see Environment Variables)
npm run dev
4. Frontend setup
cd frontend
npm install
npm run dev
5. First-time login
On a fresh database with zero users, hit /register once — this account automatically becomes the first Fleet Manager. See Authentication & RBAC Flow below.

Database Design
Entities: Profiles (Users), Vehicles, Drivers, Trips, Maintenance Logs, Fuel Logs, Expenses

profiles
Column	Type	Notes
id	uuid (PK)	
email	string	unique, login identifier
name	string	
role	enum	fleet_manager, driver, safety_officer, financial_analyst
password_hash	string	(add if not already present — not in original ERD)
vehicles
Column	Type	Notes
id	uuid (PK)	
registration_number	string (UK)	unique
name_model	string	
type	string	
max_load_capacity_kg	numeric	
odometer_km	numeric	
acquisition_cost	numeric	
status	enum	Available, On Trip, In Shop, Retired
region	string	for dashboard filters
drivers
Column	Type	Notes
id	uuid (PK)	
name	string	
license_number	string	
license_expiry_date	date	
safety_score	numeric	
status	enum	Available, On Trip, Off Duty, Suspended
license_category	string	(mentioned in spec — confirm if included in migration)
contact_number	string	(mentioned in spec — confirm if included in migration)
trips
Column	Type	Notes
id	uuid (PK)	
source	string	
destination	string	
vehicle_id	uuid (FK → vehicles)	
driver_id	uuid (FK → drivers)	
cargo_weight_kg	numeric	
planned_distance_km	numeric	
status	enum	Draft, Dispatched, Completed, Cancelled
created_by	uuid (FK → profiles)	
maintenance_logs
Column	Type	Notes
id	uuid (PK)	
vehicle_id	uuid (FK → vehicles)	
description	string	
cost	numeric	
status	enum	active / closed
fuel_logs
Column	Type	Notes
id	uuid (PK)	
vehicle_id	uuid (FK → vehicles)	
trip_id	uuid (FK → trips)	
liters	numeric	
cost	numeric	
expenses
Column	Type	Notes
id	uuid (PK)	
vehicle_id	uuid (FK → vehicles)	
type	enum	e.g. toll, misc
amount	numeric	
Relationships
profiles 1—many trips (creates)
vehicles 1—many trips, maintenance_logs, fuel_logs, expenses
drivers 1—many trips
trips 1—many fuel_logs
Note for Rushabh: if the auth module needs extra columns on profiles (e.g. password_hash, created_at, is_active), please add them and update this table so the rest of the team stays in sync.

Authentication & RBAC Flow
Core principle: nobody self-registers with a role of their choosing. A public signup where anyone can pick "Fleet Manager" defeats RBAC entirely.

Bootstrap exception: if the system has zero users, the very first person to hit /register automatically becomes the Fleet Manager (someone has to create the first admin account somehow).
After that, /register is closed. Only a logged-in Fleet Manager can create new accounts (Driver, Safety Officer, Financial Analyst, or another Fleet Manager) via a "Manage Users" screen, setting their initial email/password.
Everyone else just logs in — no public signup ever appears in their nav.
This is single-time registration: the first registered user (Fleet Manager) adds all other users and their login credentials. Those users then simply log in — they never register themselves.

Roles & Navigation
Every role lands on the same Dashboard and sees the same nav bar. What changes per role is which action buttons are enabled on each page (via a permission check like can(profile.role, "trips:dispatch") from a shared permissions.ts), not which pages exist. This means less code and an easier demo — all four roles can be shown just by logging in as each one, no separate builds.

Role	Flow	Main Screen
Fleet Manager (full access)	Login → Dashboard (fleet-wide KPIs) → Vehicles (register) → Drivers (register) → Trips (create + dispatch) → Maintenance (log after trip completes) → Reports (check operational cost)	Dashboard
Driver	Login → Dashboard → Trips (create, dispatch, mark complete with final odometer + fuel)	Trips — Vehicle/Driver master lists render read-only for them (permission-gated buttons, not hidden pages)
Safety Officer	Login → Dashboard → Drivers (monitor license expiry, safety scores, suspend a driver) → Trips (read-only, but can cancel a trip if a safety issue is found)	Drivers
Financial Analyst	Login → Dashboard → Fuel & Expenses (log/review costs) → Reports (operational cost, ROI, CSV export)	Reports
Mandatory Business Rules
Vehicle registration number must be unique.
Retired or In Shop vehicles must never appear in dispatch selection.
Drivers with expired licenses or Suspended status cannot be assigned to trips.
A driver or vehicle already On Trip cannot be assigned to another trip.
Cargo Weight must not exceed the vehicle's max load capacity.
Dispatching a trip → vehicle & driver status → On Trip.
Completing a trip → vehicle & driver status → Available.
Cancelling a dispatched trip → restores vehicle & driver to Available.
Creating an active maintenance record → vehicle status → In Shop.
Closing maintenance → restores vehicle to Available (unless retired).
Example Workflow (Demo Script)
Register vehicle Van-05, max capacity 500 kg, status Available.
Register driver Alex with a valid license.
Create a trip with cargo weight = 450 kg.
System validates 450 kg ≤ 500 kg → allows dispatch.
Vehicle and Driver status automatically become On Trip.
Complete the trip — enter final odometer + fuel consumed.
Vehicle and Driver marked Available again.
Create a maintenance record (e.g. Oil Change) → vehicle becomes In Shop, hidden from dispatch.
Reports update operational cost and fuel efficiency based on latest trip and fuel log.
Folder Structure

Use this as the shared source of truth for where each teammate should paste files:

transitops/
├── backend/
│   ├── db/
│   ├── src/
│   │   ├── middleware/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── shared/
│   │   │   ├── fleet-manager/
│   │   │   ├── driver/
│   │   │   ├── safety-officer/
│   │   │   └── financial-analyst/
│   │   ├── routes/
│   │   └── lib/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── shared/
│   │   │   ├── fleet-manager/
│   │   │   ├── driver/
│   │   │   ├── safety-officer/
│   │   │   └── financial-analyst/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── types/
│   └── package.json
└── README.md

Suggested paste targets:

- Auth screens and auth-only UI: `frontend/src/features/auth/`
- Shared UI and hooks used by every role: `frontend/src/features/shared/`
- Fleet manager screens: `frontend/src/features/fleet-manager/`
- Driver screens: `frontend/src/features/driver/`
- Safety officer screens: `frontend/src/features/safety-officer/`
- Financial analyst screens: `frontend/src/features/financial-analyst/`
- Backend auth routes and services: `backend/src/modules/auth/`
- Shared backend helpers: `backend/src/modules/shared/`
- Role-specific backend logic: `backend/src/modules/<role>/`
Environment Variables
backend/.env

Copy to BlackBox
PORT=5000
DATABASE_URL=postgresql://postgres:diya@localhost:5432/transitops
JWT_SECRET=<your-secret-here>
NODE_ENV=development
frontend/.env

Copy to BlackBox
VITE_API_URL=http://localhost:4000
Git Workflow
Work on feature branches: feature/<module-name> (e.g. feature/auth, feature/driver-dashboard, feature/financial-dashboard, feature/safety-officer-dashboard).
Open a PR into main when your module is demo-ready.
Keep DB schema changes communicated in the team chat before merging, since everyone's module depends on shared tables (profiles, vehicles, drivers, trips).
Last updated: Phase 1 — Auth (Rushabh), Driver Dashboard (Keval), Financial Analyst (Priya), Safety Officer (Diya).