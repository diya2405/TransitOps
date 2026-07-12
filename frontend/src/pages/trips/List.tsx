// OWNER: Person D. The hub module — depends on Vehicles + Drivers existing.
// GET /api/trips, POST /api/trips to create (status: draft).
// Vehicle dropdown filtered by isVehicleAssignable(), driver dropdown by
// isDriverAssignable() — both from lib/businessRules.ts, for instant UX
// feedback. The REAL enforcement happens server-side in these endpoints:
//   POST /api/trips/:id/dispatch  -> runs canDispatch(), returns 422 + reasons[] on failure
//   POST /api/trips/:id/complete  -> body: { final_odometer_km, fuel_consumed_l }
//   POST /api/trips/:id/cancel    -> only valid from status "dispatched"
// Always show the backend's `reasons` array to the user if dispatch fails —
// don't just rely on the frontend's own pre-check, the server is the source of truth.

export default function TripList() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-gray-900 mb-4">Trips</h1>
      <p className="text-sm text-gray-500">TODO: table + new trip form + dispatch/complete/cancel actions.</p>
    </div>
  );
}
