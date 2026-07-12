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
  const { rows: driverRows } = await pool.query(
    "select id from drivers where license_number = $1 limit 1",
    ["DL-0001"]
  );
  const { rows: tripExistsRows } = await pool.query(
    "select id from trips where source = $1 and destination = $2 limit 1",
    ["Warehouse A", "City Hub"]
  );

  if (vehicleRows[0] && driverRows[0] && !tripExistsRows[0]) {
    const { rows: userRows } = await pool.query(
      "select id from users where email = $1 limit 1",
      ["manager@transitops.dev"]
    );

    const vehicleId = vehicleRows[0].id;
    const driverId = driverRows[0].id;
    const createdBy = userRows[0]?.id ?? null;

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

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
