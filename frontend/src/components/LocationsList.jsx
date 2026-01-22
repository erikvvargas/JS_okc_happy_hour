function statusRank(s) {
  if (s === "ACTIVE") return 0;
  if (s === "UPCOMING") return 1;
  return 2;
}

function statusLabel(loc, nowMin) {
  if (loc._status === "ACTIVE") return "Happening now";
  if (loc._status === "UPCOMING") {
    const t = timeUntilLabel(loc, nowMin);
    return t ? `Starts in ${t}` : "Later today";
  }
  return "Not today";
}


function timeToMinutes(t) {
  if (!t || typeof t !== "string") return null;
  const [hh, mm] = t.split(":").map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return hh * 60 + mm;
}

function timeUntilLabel(loc, nowMin) {
  if (loc?._status !== "UPCOMING") return null;

  const start = timeToMinutes(loc.start_time);
  if (start == null || nowMin == null) return null;

  const diff = start - nowMin; // minutes until start
  if (diff <= 0) return null;

  if (diff < 60) return `${diff} min`;
  const hours = Math.ceil(diff / 60);
  return `${hours} hr`;
}



export default function LocationsList({ locations, onSelect, nowMin }) {
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
              {statusLabel(loc, nowMin)}
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
