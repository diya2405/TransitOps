// OWNER: Person B. Vehicle registry CRUD.
// Table columns: registration_number, name_model, type, status, region, actions.
// Use api.get("/api/vehicles"), api.post("/api/vehicles", {...}), api.patch("/api/vehicles/:id", {...})
// from lib/apiClient.ts. The backend already rejects duplicate registration_number (409).

export default function VehicleList() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-gray-900 mb-4">Vehicles</h1>
      <p className="text-sm text-gray-500">TODO: table + add/edit form.</p>
    </div>
  );
}
