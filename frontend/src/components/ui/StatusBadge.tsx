// One shared status pill so Available/On Trip/In Shop/Retired etc. look the
// same everywhere regardless of who built that page.

const COLOR_MAP: Record<string, string> = {
  available: "bg-green-100 text-green-800",
  on_trip: "bg-blue-100 text-blue-800",
  in_shop: "bg-amber-100 text-amber-800",
  retired: "bg-gray-100 text-gray-600",
  off_duty: "bg-gray-100 text-gray-600",
  suspended: "bg-red-100 text-red-800",
  draft: "bg-gray-100 text-gray-700",
  dispatched: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  active: "bg-amber-100 text-amber-800",
  closed: "bg-green-100 text-green-800",
};

export function StatusBadge({ status }: { status: string }) {
  const classes = COLOR_MAP[status] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {status.replace("_", " ")}
    </span>
  );
}
