function statusRank(s) {
  if (s === "ACTIVE") return 0;
  if (s === "UPCOMING") return 1;
  return 2;
}

function statusLabel(s) {
  if (s === "ACTIVE") return "Happening now";
  if (s === "UPCOMING") return "Later today";
  return "Not today";
}

export default function LocationsList({ locations, onSelect }) {
  const sorted = [...locations].sort((a, b) => {
    const ra = statusRank(a._status);
    const rb = statusRank(b._status);
    if (ra !== rb) return ra - rb;
    return String(a.name).localeCompare(String(b.name));
  });

  return (
    <div className="space-y-2">
      {sorted.map((loc) => (
        <button
          key={loc.id}
          onClick={() => onSelect(loc)}
          className="w-full text-left rounded-xl border border-black/10 dark:border-white/10 p-3 hover:bg-black/5 dark:hover:bg-white/10 transition"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="font-medium">{loc.name}</div>
            <span
              className={[
                "text-xs rounded-full px-2 py-1",
                loc._status === "ACTIVE"
                  ? "bg-purple-100 text-purple-900 dark:bg-purple-500/20 dark:text-purple-100"
                  : loc._status === "UPCOMING"
                  ? "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-200"
                  : "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300",
              ].join(" ")}
            >
              {statusLabel(loc._status)}
            </span>
          </div>

          <div className="text-sm opacity-80 mt-1">
            {loc.start_time && loc.end_time ? `${loc.start_time}–${loc.end_time}` : ""}
            {loc.days ? ` • ${loc.days}` : ""}
          </div>
        </button>
      ))}
    </div>
  );
}
