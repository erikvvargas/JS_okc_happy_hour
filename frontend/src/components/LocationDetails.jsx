function formatHappyHour(loc) {
  // Supports either `happy_hour` (string) or `happy_hours` (array)
  if (loc?.happy_hour) return loc.happy_hour;

  if (Array.isArray(loc?.happy_hours) && loc.happy_hours.length > 0) {
    return loc.happy_hours
      .map((hh) => {
        const days = Array.isArray(hh.days) ? hh.days.join(", ") : hh.days ?? "";
        const time = hh.start && hh.end ? `${hh.start}–${hh.end}` : "";
        const desc = hh.description ?? "";
        return [days, time, desc].filter(Boolean).join(" • ");
      })
      .join("\n");
  }

  // fallback if you have days/start/end on the root
  if (loc?.days && loc?.start_time && loc?.end_time) {
    return `${loc.days} ${loc.start_time}–${loc.end_time}`;
  }

  return "N/A";
}

export default function LocationDetails({ location }) {
  if (!location) return null;

  const hhText = formatHappyHour(location);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold leading-tight">{location.name}</h2>
        {location.address ? (
          <p className="text-sm opacity-80">{location.address}</p>
        ) : null}
      </div>

      <div className="rounded-lg border border-black/10 dark:border-white/10 p-3">
        <div className="text-xs uppercase tracking-wide opacity-70 mb-1">
          Happy hour
        </div>
        <pre className="whitespace-pre-wrap text-sm font-sans">
          {hhText}
        </pre>
      </div>

      {location.description ? (
        <div className="rounded-lg border border-black/10 dark:border-white/10 p-3">
          <div className="text-xs uppercase tracking-wide opacity-70 mb-1">
            Notes
          </div>
          <p className="text-sm">{location.description}</p>
        </div>
      ) : null}
    </div>
  );
}
