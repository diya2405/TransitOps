// OWNER: Person C. Driver profile CRUD.
// Use api.get("/api/drivers"), api.post("/api/drivers", {...}), api.patch("/api/drivers/:id", {...}).
// Show license_expiry_date clearly; flag expired ones (see isLicenseExpired in lib/businessRules.ts).

export default function DriverList() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-gray-900 mb-4">Drivers</h1>
      <p className="text-sm text-gray-500">TODO: table + add/edit form.</p>
    </div>
  );
}
