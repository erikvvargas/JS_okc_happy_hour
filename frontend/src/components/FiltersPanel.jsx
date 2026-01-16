const WEEKDAYS = ["Today", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function buildTimes(stepMinutes = 15) {
  const out = [];
  for (let m = 0; m < 24 * 60; m += stepMinutes) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    out.push(`${hh}:${mm}`);
  }
  return out;
}
const TIME_OPTIONS = buildTimes(15);


export default function FiltersPanel({
  selectedDay,
  setSelectedDay,
  timeMode,
  setTimeMode,
  selectedTime,
  setSelectedTime,
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium opacity-70 mb-1">
          Day
        </label>
        <select
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
          className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white/90 dark:bg-gray-900/90 p-2"
        >
          {WEEKDAYS.map((d) => (
            <option key={d} value={d}>
              {d === "Today" ? "Today" : d}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium opacity-70 mb-1">
          Time
        </label>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTimeMode("now")}
            className={[
              "flex-1 rounded-lg border px-3 py-2 text-sm transition",
              timeMode === "now"
                ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                : "bg-white/90 dark:bg-gray-900/90 border-black/10 dark:border-white/10",
            ].join(" ")}
          >
            Now
          </button>

          <button
            type="button"
            onClick={() => setTimeMode("custom")}
            className={[
              "flex-1 rounded-lg border px-3 py-2 text-sm transition",
              timeMode === "custom"
                ? "bg-black text-white dark:bg-white dark:text-black border-transparent"
                : "bg-white/90 dark:bg-gray-900/90 border-black/10 dark:border-white/10",
            ].join(" ")}
          >
            Pick time
          </button>
        </div>

        {/* {timeMode === "custom" ? (
          <div className="mt-2">
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white/90 dark:bg-gray-900/90 p-2"
            />
          </div>
        ) : null} */}

        {timeMode === "custom" ? (
          <select
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white/90 dark:bg-gray-900/90 p-2"
          >
            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        ) : null}

      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setSelectedDay("Today");
            setTimeMode("now");
          }}
          className="flex-1 rounded-lg border border-black/10 dark:border-white/10 px-3 py-2 text-sm bg-white/90 dark:bg-gray-900/90"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
