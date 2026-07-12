// OWNER: Person B (shares vehicle status logic with Vehicles module).
// POST /api/maintenance { vehicle_id, description, cost } opens a record and
// flips the vehicle to in_shop server-side. POST /api/maintenance/:id/close
// flips it back to available unless the vehicle is retired.

export default function MaintenanceList() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-gray-900 mb-4">Maintenance</h1>
      <p className="text-sm text-gray-500">TODO: table + new record form + close action.</p>
    </div>
  );
}
