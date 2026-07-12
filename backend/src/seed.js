// Creates one demo login per role. Run after `npm run migrate`.
//   npm run seed
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();
import { pool } from "./db.js";

const DEMO_USERS = [
  { email: "manager@transitops.dev", password: "password123", name: "Fleet Manager Demo", role: "fleet_manager" },
  { email: "dispatcher@transitops.dev", password: "password123", name: "Dispatcher Demo", role: "dispatcher" },
  { email: "safety@transitops.dev", password: "password123", name: "Safety Officer Demo", role: "safety_officer" },
  { email: "finance@transitops.dev", password: "password123", name: "Financial Analyst Demo", role: "financial_analyst" },
];

async function rowExists(query, params) {
  const { rows } = await pool.query(query, params);
  return rows.length > 0;
}

async function main() {
  for (const u of DEMO_USERS) {
    const hash = await bcrypt.hash(u.password, 10);
    await pool.query(
      `insert into users (email, password_hash, name, role) values ($1,$2,$3,$4)
       on conflict (email) do nothing`,
      [u.email, hash, u.name, u.role]
    );
    console.log(`Seeded ${u.role}: ${u.email} / ${u.password}`);
  }

  const { rows: vehicleRows } = await pool.query(
    "select id from vehicles where registration_number = $1 limit 1",
    ["GJ-01-AB-1234"]
  );
  const { rows: vehicleRowsTwo } = await pool.query(
    "select id from vehicles where registration_number = $1 limit 1",
    ["GJ-01-CD-5678"]
  );
  const { rows: driverRows } = await pool.query(
    "select id from drivers where license_number = $1 limit 1",
    ["DL-0001"]
  );
  const { rows: driverRowsTwo } = await pool.query(
    "select id from drivers where license_number = $1 limit 1",
    ["DL-0002"]
  );
  const { rows: userRows } = await pool.query(
    "select id from users where email = $1 limit 1",
    ["manager@transitops.dev"]
  );
  const createdBy = userRows[0]?.id ?? null;

  if (vehicleRows[0] && driverRows[0]) {
    const vehicleId = vehicleRows[0].id;
    const driverId = driverRows[0].id;

    if (!(await rowExists("select 1 from trips where source = $1 and destination = $2", ["Warehouse A", "City Hub"]))) {
      const { rows: tripRows } = await pool.query(
        `insert into trips (source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, status, created_by, dispatched_at)
         values ($1,$2,$3,$4,$5,$6,'dispatched',$7, now())
         returning id`,
        ["Warehouse A", "City Hub", vehicleId, driverId, 450, 42, createdBy]
      );
      await pool.query("update vehicles set status = 'on_trip' where id = $1", [vehicleId]);
      await pool.query("update drivers set status = 'on_trip' where id = $1", [driverId]);
      console.log(`Seeded dispatched trip ${tripRows[0].id} for safety review`);
    }

    if (!(await rowExists("select 1 from maintenance_logs where vehicle_id = $1 and description = $2", [vehicleId, "Brake inspection and oil service"]))) {
      await pool.query(
        `insert into maintenance_logs (vehicle_id, description, cost, status, opened_at, closed_at)
         values ($1,$2,$3,'closed',$4,$5)`,
        [vehicleId, "Brake inspection and oil service", 6800, "2026-06-15T08:00:00Z", "2026-06-16T14:00:00Z"]
      );
      console.log("Seeded closed maintenance record");
    }

    if (!(await rowExists("select 1 from fuel_logs where vehicle_id = $1 and cost = $2", [vehicleId, 5200]))) {
      await pool.query(
        `insert into fuel_logs (vehicle_id, trip_id, liters, cost, date)
         values ($1, null, 48, 5200, '2026-07-10')`,
        [vehicleId]
      );
      console.log("Seeded fuel log for analytics");
    }

    if (!(await rowExists("select 1 from expenses where vehicle_id = $1 and type = $2 and amount = $3", [vehicleId, "toll", 500]))) {
      await pool.query(
        `insert into expenses (vehicle_id, type, amount, date, note)
         values ($1,$2,$3,'2026-07-10',$4)`,
        [vehicleId, "toll", 500, "NH48 toll charge"]
      );
      console.log("Seeded toll expense");
    }
  }

  if (vehicleRowsTwo[0] && driverRowsTwo[0]) {
    const vehicleId = vehicleRowsTwo[0].id;
    const driverId = driverRowsTwo[0].id;

    if (!(await rowExists("select 1 from maintenance_logs where vehicle_id = $1 and description = $2", [vehicleId, "Scheduled preventive service"]))) {
      await pool.query(
        `insert into maintenance_logs (vehicle_id, description, cost, status, opened_at)
         values ($1,$2,$3,'active',$4)`,
        [vehicleId, "Scheduled preventive service", 3200, "2026-07-08T09:00:00Z"]
      );
      console.log("Seeded active maintenance record");
    }

    if (!(await rowExists("select 1 from fuel_logs where vehicle_id = $1 and cost = $2", [vehicleId, 7200]))) {
      await pool.query(
        `insert into fuel_logs (vehicle_id, trip_id, liters, cost, date)
         values ($1, null, 64, 7200, '2026-07-11')`,
        [vehicleId]
      );
      console.log("Seeded second fuel log");
    }

    if (!(await rowExists("select 1 from expenses where vehicle_id = $1 and type = $2 and amount = $3", [vehicleId, "maintenance", 8000]))) {
      await pool.query(
        `insert into expenses (vehicle_id, type, amount, date, note)
         values ($1,$2,$3,'2026-07-11',$4)`,
        [vehicleId, "maintenance", 8000, "Brake replacement"]
      );
      console.log("Seeded maintenance expense");
    }

    if (!(await rowExists("select 1 from trips where source = $1 and destination = $2 and vehicle_id = $3", ["Depot B", "City Hub", vehicleId]))) {
      await pool.query(
        `insert into trips (source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, status, created_by, completed_at)
         values ($1,$2,$3,$4,$5,$6,'completed',$7, now())`,
        ["Depot B", "City Hub", vehicleId, driverId, 600, 55, createdBy]
      );
      console.log("Seeded completed trip for operational history");
    }
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
