# TransitOps — Smart Transport Operations Platform

A centralized platform to digitize vehicle, driver, dispatch, maintenance, and expense management for transport/logistics operations while enforcing business rules and providing operational insights.

Hackathon Duration: 8 Hours

## Current Status

The app now includes a working end-to-end flow for the core roles:
- Fleet Manager: vehicle registry, maintenance, user management, fleet reporting
- Safety Officer: driver compliance monitoring, suspension/reactivation, trip safety review
- Financial Analyst: cost reporting, expense and fuel review, exportable reports
- Dispatcher/Driver: trip creation, assignment, dispatch, completion, and cancellation with validation

## Role Access Summary

| Role | Pages available | What they can do |
|---|---|---|
| Fleet Manager | Dashboard, Vehicles, Drivers, Maintenance, Fuel & Expenses, Reports, User Management | Register/edit/retire vehicles, manage drivers, open/close maintenance, record fuel/expenses, view/export reports, create user accounts |
| Dispatcher | Dashboard, Trips, Vehicles (view), Drivers (view), Fuel & Expenses | Create trips, dispatch, complete, cancel, record fuel and expenses |
| Driver | Dashboard, Trips, Vehicles (view), Drivers (view), Fuel & Expenses | View assigned trip workflow and operational records |
| Safety Officer | Dashboard, Drivers, Trips (cancel only), Reports | Monitor driver compliance, suspend/reactivate drivers, review trip safety actions |
| Financial Analyst | Dashboard, Fuel & Expenses, Reports | Review fuel/maintenance/expense costs, run analytics, export reports |

## Table of Contents

1. Tech Stack
2. Team & Work Allocation
3. Getting Started (Local Setup)
4. Database Design
5. Authentication & RBAC Flow
6. Roles & Navigation
7. Mandatory Business Rules
8. Example Workflow (Demo Script)
9. Folder Structure
10. Environment Variables
11. Git Workflow

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Backend | Node.js (Express) |
| Database | PostgreSQL (local instance) |
| Auth | Email + Password, session/JWT-based, custom RBAC |

## Team & Work Allocation

| Member | Module |
|---|---|
| Rushabh | Login & Registration (Auth) |
| Keval | Driver Dashboard |
| Priya | Financial Analyst Dashboard |
| Diya | Safety Officer Dashboard |

The table structure/ERD for login & registration is in this repo for reference (see Database Design). If any additional columns are needed on profiles or elsewhere, please inform the team before altering the schema so migrations stay in sync.

This README will be updated as Phase 2 (Fleet Manager dashboard, Trips, Maintenance, Fuel & Expenses, Reports) gets allocated.

## Getting Started (Local Setup)

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL installed and running locally
- npm or yarn
- Git

### 1. Clone the repo

```bash
git clone <repo-url>
cd transitops
```

### 2. Database setup (PostgreSQL local)

```bash
# Open psql and create the database
psql -U postgres
CREATE DATABASE transitops;
\q
```

Run the schema/migration scripts in backend/db to create the tables listed under Database Design.

### 3. Backend setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 4. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

### 5. First-time login

On a fresh database with zero users, hit /register once — this account automatically becomes the first Fleet Manager. After that, /register is closed and only a logged-in Fleet Manager can create new accounts through Manage Users.

## Database Design

Entities: Profiles (Users), Vehicles, Drivers, Trips, Maintenance Logs, Fuel Logs, Expenses

### profiles

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| email | string | unique, login identifier |
| name | string | |
| role | enum | fleet_manager, dispatcher, driver, safety_officer, financial_analyst |
| password_hash | string | add if not already present |

### vehicles

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| registration_number | string | unique |
| name_model | string | |
| type | string | |
| max_load_capacity_kg | numeric | |
| odometer_km | numeric | |
| acquisition_cost | numeric | |
| status | enum | Available, On Trip, In Shop, Retired |
| region | string | dashboard filters |

### drivers

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | string | |
| license_number | string | |
| license_expiry_date | date | |
| safety_score | numeric | |
| status | enum | Available, On Trip, Off Duty, Suspended |
| license_category | string | mentioned in spec |
| contact_number | string | mentioned in spec |

### trips

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| source | string | |
| destination | string | |
| vehicle_id | uuid (FK → vehicles) | |
| driver_id | uuid (FK → drivers) | |
| cargo_weight_kg | numeric | |
| planned_distance_km | numeric | |
| status | enum | Draft, Dispatched, Completed, Cancelled |
| created_by | uuid (FK → profiles) | |

### maintenance_logs

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| vehicle_id | uuid (FK → vehicles) | |
| description | string | |
| cost | numeric | |
| status | enum | active / closed |

### fuel_logs

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| vehicle_id | uuid (FK → vehicles) | |
| trip_id | uuid (FK → trips) | |
| liters | numeric | |
| cost | numeric | |

### expenses

| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| vehicle_id | uuid (FK → vehicles) | |
| type | enum | e.g. toll, misc |
| amount | numeric | |

### Relationships

- profiles 1—many trips (creates)
- vehicles 1—many trips, maintenance_logs, fuel_logs, expenses
- drivers 1—many trips
- trips 1—many fuel_logs

## Authentication & RBAC Flow

Core principle: nobody self-registers with a role of their choosing. A public signup where anyone can pick Fleet Manager defeats RBAC entirely.

Bootstrap exception: if the system has zero users, the very first person to hit /register automatically becomes the Fleet Manager.

After that, /register is closed. Only a logged-in Fleet Manager can create new accounts (Dispatcher, Driver, Safety Officer, Financial Analyst, or another Fleet Manager) via Manage Users.

Everyone else just logs in — no public signup ever appears in their nav.

## Roles & Navigation

Every role lands on the same Dashboard shell and sees a role-specific nav bar. What changes per role is which action buttons are enabled on each page, not which pages exist.

| Role | Main Screen | Key Pages |
|---|---|---|
| Fleet Manager | Dashboard | Vehicles, Drivers, Maintenance, Fuel & Expenses, Reports, User Management |
| Dispatcher | Trips | Dashboard, Trips, Vehicles (view), Drivers (view), Fuel & Expenses |
| Driver | Trips | Dashboard, Trips, Vehicles (view), Drivers (view), Fuel & Expenses |
| Safety Officer | Drivers | Dashboard, Drivers, Trips (cancel only), Reports |
| Financial Analyst | Reports | Dashboard, Fuel & Expenses, Reports |

## Mandatory Business Rules

- Vehicle registration number must be unique.
- Retired or In Shop vehicles must never appear in dispatch selection.
- Drivers with expired licenses or Suspended status cannot be assigned to trips.
- A driver or vehicle already On Trip cannot be assigned to another trip.
- Cargo Weight must not exceed the vehicle's max load capacity.
- Dispatching a trip → vehicle & driver status → On Trip.
- Completing a trip → vehicle & driver status → Available.
- Cancelling a dispatched trip → restores vehicle & driver to Available.
- Creating an active maintenance record → vehicle status → In Shop.
- Closing maintenance → restores vehicle to Available unless retired.
- Reports and dashboards refresh from live backend data.

## Example Workflow (Demo Script)

1. Register vehicle Van-05, max capacity 500 kg, status Available.
2. Register driver Alex with a valid license.
3. Create a trip with cargo weight = 450 kg.
4. System validates 450 kg ≤ 500 kg and allows dispatch.
5. Vehicle and Driver status automatically become On Trip.
6. Complete the trip — enter final odometer + fuel consumed.
7. Vehicle and Driver marked Available again.
8. Create a maintenance record such as Oil Change → vehicle becomes In Shop.
9. Reports update operational cost and fuel efficiency based on the latest trip and fuel log.

## Folder Structure

Use this as the shared source of truth for where each teammate should paste files:

```text
transitops/
├── backend/
│   ├── db/
│   ├── src/
│   │   ├── middleware/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── shared/
│   │   │   ├── fleet-manager/
│   │   │   ├── dispatcher/
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
│   │   │   ├── dispatcher/
│   │   │   ├── driver/
│   │   │   ├── safety-officer/
│   │   │   └── financial-analyst/
│   │   ├── lib/
│   │   ├── pages/
│   │   └── types/
│   └── package.json
└── README.md
```

Suggested paste targets:

- Auth screens and auth-only UI: frontend/src/features/auth/
- Shared UI and hooks used by every role: frontend/src/features/shared/
- Fleet manager screens: frontend/src/features/fleet-manager/
- Dispatcher screens: frontend/src/features/dispatcher/
- Driver screens: frontend/src/features/driver/
- Safety officer screens: frontend/src/features/safety-officer/
- Financial analyst screens: frontend/src/features/financial-analyst/
- Backend auth routes and services: backend/src/modules/auth/
- Shared backend helpers: backend/src/modules/shared/
- Role-specific backend logic: backend/src/modules/<role>/

## Environment Variables

### backend/.env

```bash
PORT=4000
DATABASE_URL=postgresql://postgres:diya@localhost:5432/transitops
JWT_SECRET=<your-secret-here>
NODE_ENV=development
```

### frontend/.env

```bash
VITE_API_URL=http://localhost:4000
```

## Git Workflow

- Work on feature branches: feature/<module-name>
- Open a PR into main when your module is demo-ready
- Keep DB schema changes communicated in the team chat before merging

Last updated: Fleet Manager, Safety Officer, Financial Analyst, dispatcher workflow, trip validation, maintenance flow, and role-based access controls.
