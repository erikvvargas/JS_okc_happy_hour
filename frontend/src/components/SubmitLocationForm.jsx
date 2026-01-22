import { useMemo, useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function serializeDays(days) {
  const order = DAYS;
  const sorted = [...days].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  return sorted.join(",");
}

export default function SubmitLocationForm({
  apiBase = import.meta.env.VITE_API_BASE,
  showGeocode = false,
  onCancel,
  onSuccess, // called after a successful submit (after brief delay)
}) {
  const empty = useMemo(
    () => ({
      name: "",
      address: "",
      happy_hour: "",
      days: [],
      start_time: "",
      end_time: "",
      note: "",
    }),
    []
  );

  const [draft, setDraft] = useState(empty);
  const [geoStatus, setGeoStatus] = useState("");
  const [latLon, setLatLon] = useState({ lat: "", lon: "" });
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const INPUT =
  "w-full rounded-lg border p-2 bg-transparent " +
  "text-gray-900 dark:text-gray-100 " +
  "border-black/10 dark:border-white/10 " +
  "placeholder:text-gray-500 dark:placeholder:text-gray-400 " +
  "focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10";

  const toggleDay = (d) => {
    setDraft((x) => {
      const has = x.days.includes(d);
      return { ...x, days: has ? x.days.filter((k) => k !== d) : [...x.days, d] };
    });
  };

  async function geocode() {
    setGeoStatus("");
    setStatus("");

    const q = draft.address.trim();
    if (!q) {
      setGeoStatus("Enter an address first.");
      return;
    }

    try {
      const url = new URL(`${apiBase}/geocode`);
      url.searchParams.set("q", q);

      const res = await fetch(url.toString());
      if (!res.ok) {
        setGeoStatus(`Geocode failed (HTTP ${res.status})`);
        return;
      }
      const data = await res.json();
      if (!data.found) {
        setGeoStatus("No match found.");
        return;
      }
      setLatLon({ lat: String(data.lat), lon: String(data.lon) });
      setGeoStatus("Found ✓");
    } catch (e) {
      setGeoStatus(`Geocode error: ${String(e?.message || e)}`);
    }
  }

  async function submit() {
    setStatus("");
    setGeoStatus("");

    if (!draft.name.trim()) return setStatus("Name is required.");
    if (!draft.happy_hour.trim()) return setStatus("Happy hour details are required.");
    if (draft.days.length === 0) return setStatus("Pick at least one day.");
    if (!draft.start_time || !draft.end_time) return setStatus("Start and end time required.");

    const payload = {
      name: draft.name.trim(),
      address: draft.address.trim() || null,
      happy_hour: draft.happy_hour.trim(),
      days: serializeDays(draft.days),
      start_time: draft.start_time,
      end_time: draft.end_time,
      lat: latLon.lat ? Number(latLon.lat) : null,
      lon: latLon.lon ? Number(latLon.lon) : null,
      note: draft.note.trim() || null,
    };

    const LABEL = "text-sm font-medium text-gray-700 dark:text-gray-200";

    const INPUT =
      "w-full rounded-lg border p-2 bg-transparent " +
      "text-gray-900 dark:text-gray-100 " +
      "border-black/10 dark:border-white/10 " +
      "placeholder:text-gray-500 dark:placeholder:text-gray-400 " +
      "focus:outline-none focus:ring-2 focus:ring-black/10 dark:focus:ring-white/10";

    const CHIP =
      "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm select-none " +
      "border-black/10 dark:border-white/10 " +
      "bg-white/70 dark:bg-gray-800/60 " +
      "text-gray-900 dark:text-gray-100";

    const CHIP_ACTIVE =
      "bg-black text-white border-black dark:bg-indigo-600 dark:border-indigo-500";

    const BTN_CANCEL =
      "rounded-lg px-3 py-2 border border-black/10 dark:border-white/10 " +
      "hover:bg-black/5 dark:hover:bg-white/10 text-gray-900 dark:text-gray-100";

    const BTN_SUBMIT =
      "rounded-lg px-3 py-2 bg-black text-white hover:opacity-90 " +
      "dark:bg-indigo-600 dark:text-white disabled:opacity-60";


    try {
      setSubmitting(true);
      const res = await fetch(`${apiBase}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        setStatus(`Submit failed (${res.status}): ${text.slice(0, 200)}`);
        return;
      }

      setStatus("Thanks! Submitted for review ✓");
      setDraft(empty);
      setLatLon({ lat: "", lon: "" });

      setTimeout(() => {
        onSuccess?.();
      }, 600);
    } catch (e) {
      setStatus(`Submit error: ${String(e?.message || e)}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3">
      <input
        className={INPUT}
        placeholder="Place name"
        value={draft.name}
        onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
      />

      <div className="flex gap-2">
        <input
          className={INPUT}
          placeholder="Address (optional but helpful)"
          value={draft.address}
          onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
        />
        {showGeocode ? (
          <button
            type="button"
            className="rounded-lg px-3 py-2 border hover:bg-black/5 dark:hover:bg-white/10"
            onClick={geocode}
            disabled={submitting}
          >
            Geocode
          </button>
        ) : null}
      </div>

      {showGeocode && geoStatus ? <div className="text-xs opacity-80">{geoStatus}</div> : null}
      {showGeocode && latLon.lat && latLon.lon ? (
        <div className="text-xs opacity-70">
          lat/lon: {latLon.lat}, {latLon.lon}
        </div>
      ) : null}

      <textarea
        className={INPUT}
        placeholder="Happy hour details (deals, times, etc.)"
        rows={3}
        value={draft.happy_hour}
        onChange={(e) => setDraft((d) => ({ ...d, happy_hour: e.target.value }))}
      />

      <div>
        <div className="text-sm font-medium mb-2">Days</div>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => (
            <label
              key={d}
              className={LABEL}
            >
              <input
                type="checkbox"
                checked={draft.days.includes(d)}
                onChange={() => toggleDay(d)}
              />
              {d}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-xs opacity-70 mb-1">Start</div>
          <input
            className={INPUT}
            type="time"
            value={draft.start_time}
            onChange={(e) => setDraft((d) => ({ ...d, start_time: e.target.value }))}
          />
        </div>
        <div>
          <div className="text-xs opacity-70 mb-1">End</div>
          <input
            className={INPUT}
            type="time"
            value={draft.end_time}
            onChange={(e) => setDraft((d) => ({ ...d, end_time: e.target.value }))}
          />
        </div>
      </div>

      <textarea
        className={INPUT}
        placeholder="Optional note (e.g., 'bar-only', 'lounge', etc.)"
        rows={2}
        value={draft.note}
        onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
      />

      {status ? <div className="text-xs opacity-80">{status}</div> : null}

      <div className="pt-2 flex justify-end gap-2">
        <button
          type="button"
          className={BTN_CANCEL}
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button 
        type="submit" 
        className={BTN_SUBMIT}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
