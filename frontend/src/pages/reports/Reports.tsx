import { useAuth } from "@/context/AuthContext";

export default function Reports() {
  const { profile } = useAuth();

  const contentByRole = {
    fleet_manager: {
      title: "Fleet Reports",
      description: "Track fleet-wide operational cost, vehicle availability, and maintenance impact.",
      points: ["Vehicle utilization", "Maintenance cost", "Fuel cost", "CSV / PDF export"],
    },
    dispatcher: {
      title: "Trip Reports",
      description: "Review dispatched trips, trip completion trends, and fuel usage after route completion.",
      points: ["Trip status", "Dispatch history", "Fuel usage", "Completion details"],
    },
    driver: {
      title: "Trip Reports",
      description: "View your assigned trips, completion history, and fuel notes.",
      points: ["Assigned trips", "Completion history", "Fuel notes", "Trip timelines"],
    },
    safety_officer: {
      title: "Safety Reports",
      description: "Track expiring licenses, suspended drivers, and trip safety actions.",
      points: ["License expiry", "Suspended drivers", "Trip cancellations", "Safety score trends"],
    },
    financial_analyst: {
      title: "Financial Reports",
      description: "Analyze operational cost, fuel spend, maintenance spend, and ROI.",
      points: ["Operational cost", "ROI", "Fuel spend", "CSV / PDF export"],
    },
  } as const;

  const role = profile?.role ?? "financial_analyst";
  const report = contentByRole[role as keyof typeof contentByRole] ?? contentByRole.financial_analyst;

  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-500">TransitOps</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">{report.title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{report.description}</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {report.points.map((point) => (
            <li key={point} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
