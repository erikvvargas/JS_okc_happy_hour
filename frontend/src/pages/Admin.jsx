import { useEffect, useMemo, useState } from "react";
import { getToken, clearToken } from "../lib/auth";
import { API_BASE } from "../lib/api";

// const API = import.meta.env.VITE_API_BASE;
// const token = localStorage.getItem("admin_token");
// const authHeaders = { Authorization: `Bearer ${token}` };
// const res = await fetch(`${API_BASE}/admin/locations`, { headers: authHeaders });
const DAYS = [
  { key: "Mon", label: "Mon" },
  { key: "Tue", label: "Tue" },
  { key: "Wed", label: "Wed" },
  { key: "Thu", label: "Thu" },
  { key: "Fri", label: "Fri" },
  { key: "Sat", label: "Sat" },
  { key: "Sun", label: "Sun" },
];

export default function Admin() {
  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  // const [draft, setDraft] = useState({});
  const [status, setStatus] = useState("");

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${getToken()}` }),
    []
  );
  const emptyDraft = {
    name: "",
    address: "",
    happy_hour: "",
    days: [],          // <-- array in UI
    start_time: "",
    end_time: "",
    lat: "",
    lon: "",
  };

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [geoStatus, setGeoStatus] = useState("");
  const [saveStatus, setSaveStatus] = useState("");

  function serializeDays(daysArray) {
    // Keep them in weekday order
    const order = DAYS.map((d) => d.key);
    const sorted = [...daysArray].sort((a, b) => order.indexOf(a) - order.indexOf(b));
    return sorted.join(",");
  }  

  function toggleDay(dayKey) {
    setDraft((d) => {
      const has = d.days.includes(dayKey);
      const days = has ? d.days.filter((x) => x !== dayKey) : [...d.days, dayKey];
      return { ...d, days };
    });
  }

  async function geocodeAddress() {
    setGeoStatus("");
    const q = draft.address?.trim();
    if (!q) {
      setGeoStatus("Enter an address first.");
      return;
    }

    const url = new URL(`${API_BASE}/admin/geocode`);
    url.searchParams.set("q", q);

    const res = await fetch(url.toString(), { headers: authHeaders });
    if (!res.ok) {
      setGeoStatus(`Geocode failed (HTTP ${res.status})`);
      return;
    }
    const data = await res.json();
    if (!data.found) {
      setGeoStatus("No match found.");
      return;
    }

    setDraft((d) => ({
      ...d,
      lat: String(data.lat),
      lon: String(data.lon),
      // optional: you can store place_name too if you want to show it
    }));
    setGeoStatus("Geocoded ✓");
  }

// UNHIDE THIS WHEN DONE ********************************************
  async function saveNewLocation() {
    setSaveStatus("");

    
    // basic validation
    if (!draft.name.trim()) return setSaveStatus("Name is required.");
    if (!draft.happy_hour.trim()) return setSaveStatus("Happy hour info is required.");
    if (draft.days.length === 0) return setSaveStatus("Pick at least one day.");
    if (!draft.start_time || !draft.end_time) return setSaveStatus("Start and end time required.");
    if (!draft.lat || !draft.lon) return setSaveStatus("Geocode to set lat/lon (or enter manually).");

    const payload = {
      name: draft.name.trim(),
      address: draft.address.trim(),
      happy_hour: draft.happy_hour.trim(),
      days: serializeDays(draft.days),       // <-- string for Neon for now
      start_time: draft.start_time,          // "HH:MM"
      end_time: draft.end_time,              // "HH:MM"
      lat: Number(draft.lat),
      lon: Number(draft.lon),
    };

    const res = await fetch(`${API_BASE}/admin/locations`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setSaveStatus(`Save failed (HTTP ${res.status})`);
      return;
    }

    setSaveStatus("Saved ✓");
    setIsAddOpen(false);
    setDraft(emptyDraft);
    await load(); // reload admin table
  }
// ******************************************************************

  // async function saveNewLocation() {
  //   try {
  //     setSaveStatus("");

  //     console.log("Saving new location…", draft);

  //     const payload = {
  //       // if you currently require id, include it here or fix backend (recommended below)
  //       name: draft.name.trim(),
  //       address: draft.address.trim(),
  //       happy_hour: draft.happy_hour.trim(),
  //       days: serializeDays(draft.days),
  //       start_time: draft.start_time,
  //       end_time: draft.end_time,
  //       lat: Number(draft.lat),
  //       lon: Number(draft.lon),
  //     };

  //     const res = await fetch(`${API_BASE}/admin/locations`, {
  //       method: "POST",
  //       headers: { ...authHeaders, "Content-Type": "application/json" },
  //       body: JSON.stringify(payload),
  //     });

  //     if (!res.ok) {
  //       const text = await res.text(); // render error even if not JSON
  //       console.error("Save failed:", res.status, text);
  //       setSaveStatus(`Save failed (${res.status}): ${text.slice(0, 200)}`);
  //       return;
  //     }

  //     setSaveStatus("Saved ✓");
  //     setIsAddOpen(false);
  //     setDraft(emptyDraft);
  //     await load();
  //   } catch (e) {
  //     console.error("Save exception:", e);
  //     setSaveStatus(`Save error: ${String(e?.message || e)}`);
  //   }
  // }




  async function load() {
    setStatus("");
    const res = await fetch(`${API_BASE}/admin/locations`, { headers: authHeaders });
    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    const data = await res.json();
    setRows(data);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  

  function startEdit(row) {
    setEditingId(row.id);
    setDraft({
      // include the fields you want editable
      name: row.name ?? "",
      address: row.address ?? "",
      lat: row.lat ?? "",
      lon: row.lon ?? "",
      happy_hour: row.happy_hour ?? "",
      days: row.days ?? "",
      start_time: row.start_time ?? "",
      end_time: row.end_time ?? "",
      // description: row.description ?? "",
    });
    setStatus("");
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft({});
    setStatus("");
  }

  function updateDraft(key, value) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  async function saveEdit(id) {
    setStatus("Saving...");
    const payload = {
      ...draft,
      // Ensure numeric types for sheet consistency
      lat: draft.lat === "" ? "" : Number(draft.lat),
      lon: draft.lon === "" ? "" : Number(draft.lon),
    };

    const res = await fetch(`${API_BASE}/admin/locations/${id}`, {
      method: "PUT",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    if (!res.ok) {
      setStatus("Save failed.");
      return;
    }

    // Update locally without reloading everything (fast)
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...payload, id: r.id } : r))
    );

    setStatus("Saved.");
    setEditingId(null);
    setDraft({});
  }

  async function onDelete(id) {
    if (!confirm("Delete this location?")) return;
    setStatus("Deleting...");

    const res = await fetch(`${API_BASE}/admin/locations/${id}`, {
      method: "DELETE",
      headers: authHeaders,
    });

    if (res.status === 401) {
      window.location.href = "/admin/login";
      return;
    }
    if (!res.ok) {
      setStatus("Delete failed.");
      return;
    }

    setRows((prev) => prev.filter((r) => r.id !== id));
    setStatus("Deleted.");
  }

  return (
    <div className="min-h-screen p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Manage Locations</h1>

        <div className="flex items-center gap-3">
          {status ? <span className="text-sm opacity-80">{status}</span> : null}
          <button
            onClick={() => {
              clearToken();
              window.location.href = "/";
            }}
            className="text-sm underline opacity-80"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="overflow-auto rounded border border-black/10 dark:border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-black/5 dark:bg-white/10">
            <tr>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Address</th>
              <th className="text-left p-2">Days</th>
              <th className="text-left p-2">Start</th>
              <th className="text-left p-2">End</th>
              <th className="text-left p-2">Lat</th>
              <th className="text-left p-2">Lon</th>
              <th className="p-2"></th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => {
              const isEditing = editingId === r.id;

              return (
                <tr
                  key={r.id}
                  className="border-t border-black/10 dark:border-white/10 align-top"
                >
                  {/* Name */}
                  <td className="p-2 min-w-[200px]">
                    {isEditing ? (
                      <input
                        className="w-full rounded border border-black/10 dark:border-white/10 bg-transparent p-1"
                        value={draft.name}
                        onChange={(e) => updateDraft("name", e.target.value)}
                      />
                    ) : (
                      r.name
                    )}
                  </td>

                  {/* Address */}
                  <td className="p-2 min-w-[260px]">
                    {isEditing ? (
                      <input
                        className="w-full rounded border border-black/10 dark:border-white/10 bg-transparent p-1"
                        value={draft.address}
                        onChange={(e) => updateDraft("address", e.target.value)}
                      />
                    ) : (
                      r.address
                    )}
                  </td>

                  {/* Days */}
                  <td className="p-2 min-w-[140px]">
                    {isEditing ? (
                      <input
                        className="w-full rounded border border-black/10 dark:border-white/10 bg-transparent p-1"
                        value={draft.days}
                        onChange={(e) => updateDraft("days", e.target.value)}
                        placeholder="Mon,Tue,..."
                      />
                    ) : (
                      r.days
                    )}
                  </td>

                  {/* Start */}
                  <td className="p-2 min-w-[90px]">
                    {isEditing ? (
                      <input
                        className="w-full rounded border border-black/10 dark:border-white/10 bg-transparent p-1"
                        value={draft.start_time}
                        onChange={(e) => updateDraft("start_time", e.target.value)}
                        placeholder="16:00"
                      />
                    ) : (
                      r.start_time
                    )}
                  </td>

                  {/* End */}
                  <td className="p-2 min-w-[90px]">
                    {isEditing ? (
                      <input
                        className="w-full rounded border border-black/10 dark:border-white/10 bg-transparent p-1"
                        value={draft.end_time}
                        onChange={(e) => updateDraft("end_time", e.target.value)}
                        placeholder="18:00"
                      />
                    ) : (
                      r.end_time
                    )}
                  </td>

                  {/* Lat */}
                  <td className="p-2 min-w-[120px]">
                    {isEditing ? (
                      <input
                        className="w-full rounded border border-black/10 dark:border-white/10 bg-transparent p-1"
                        value={draft.lat}
                        onChange={(e) => updateDraft("lat", e.target.value)}
                      />
                    ) : (
                      r.lat
                    )}
                  </td>

                  {/* Lon */}
                  <td className="p-2 min-w-[120px]">
                    {isEditing ? (
                      <input
                        className="w-full rounded border border-black/10 dark:border-white/10 bg-transparent p-1"
                        value={draft.lon}
                        onChange={(e) => updateDraft("lon", e.target.value)}
                      />
                    ) : (
                      r.lon
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-2 text-right min-w-[180px]">
                    {isEditing ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => saveEdit(r.id)}
                          className="px-2 py-1 rounded bg-black text-white dark:bg-white dark:text-black"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-2 py-1 rounded border border-black/10 dark:border-white/10"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => startEdit(r)}
                          className="underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(r.id)}
                          className="text-red-500 underline"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => { setDraft(emptyDraft); setGeoStatus(""); setSaveStatus(""); setIsAddOpen(true); }}
        className="rounded-full px-3 py-2 text-sm bg-black text-white dark:bg-white dark:text-black"
      >
        + Add
      </button>


      {isAddOpen && (
        <div className="fixed inset-0 z-[2000]">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsAddOpen(false)}
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-black/10 dark:border-white/10 shadow-xl">
              <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10">
                <div className="font-semibold">Add Location</div>
                <button
                  className="rounded-md px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10"
                  onClick={() => setIsAddOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className="p-4 space-y-3">
                <input className="w-full rounded-lg border p-2 bg-transparent"
                  placeholder="Name"
                  value={draft.name}
                  onChange={(e) => setDraft(d => ({...d, name: e.target.value}))}
                />

                <div className="flex gap-2">
                  <input className="flex-1 rounded-lg border p-2 bg-transparent"
                    placeholder="Address"
                    value={draft.address}
                    onChange={(e) => setDraft(d => ({...d, address: e.target.value}))}
                  />
                  <button
                    className="rounded-lg px-3 py-2 border hover:bg-black/5 dark:hover:bg-white/10"
                    onClick={geocodeAddress}
                    type="button"
                  >
                    Geocode
                  </button>
                </div>
                {geoStatus ? <div className="text-xs opacity-80">{geoStatus}</div> : null}

                <textarea className="w-full rounded-lg border p-2 bg-transparent"
                  placeholder="Happy hour details"
                  rows={3}
                  value={draft.happy_hour}
                  onChange={(e) => setDraft(d => ({...d, happy_hour: e.target.value}))}
                />

                <div>
                  <div className="text-sm font-medium mb-2">Days</div>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((d) => (
                      <label key={d.key} className="flex items-center gap-2 text-sm border rounded-full px-3 py-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draft.days.includes(d.key)}
                          onChange={() => toggleDay(d.key)}
                        />
                        {d.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs opacity-70 mb-1">Start</div>
                    <input className="w-full rounded-lg border p-2 bg-transparent"
                      type="time"
                      value={draft.start_time}
                      onChange={(e) => setDraft(d => ({...d, start_time: e.target.value}))}
                    />
                  </div>
                  <div>
                    <div className="text-xs opacity-70 mb-1">End</div>
                    <input className="w-full rounded-lg border p-2 bg-transparent"
                      type="time"
                      value={draft.end_time}
                      onChange={(e) => setDraft(d => ({...d, end_time: e.target.value}))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input className="w-full rounded-lg border p-2 bg-transparent"
                    placeholder="Lat"
                    value={draft.lat}
                    onChange={(e) => setDraft(d => ({...d, lat: e.target.value}))}
                  />
                  <input className="w-full rounded-lg border p-2 bg-transparent"
                    placeholder="Lon"
                    value={draft.lon}
                    onChange={(e) => setDraft(d => ({...d, lon: e.target.value}))}
                  />
                </div>

                {saveStatus ? <div className="text-xs opacity-80">{saveStatus}</div> : null}
              </div>

              <div className="p-4 border-t border-black/10 dark:border-white/10 flex justify-end gap-2">
                <button
                  className="rounded-lg px-3 py-2 border hover:bg-black/5 dark:hover:bg-white/10"
                  onClick={() => setIsAddOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg px-3 py-2 bg-black text-white dark:bg-white dark:text-black"
                  onClick={saveNewLocation}
                  type="button"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Optional: Edit extended fields below table */}
      {editingId ? (
        <div className="mt-4 rounded border border-black/10 dark:border-white/10 p-4">
          <div className="text-sm font-semibold mb-2">More fields</div>

          <label className="block text-xs opacity-70 mb-1">Happy hour (text)</label>
          <textarea
            className="w-full rounded border border-black/10 dark:border-white/10 bg-transparent p-2 mb-3"
            rows={3}
            value={draft.happy_hour}
            onChange={(e) => updateDraft("happy_hour", e.target.value)}
          />

          {/* <label className="block text-xs opacity-70 mb-1">Description</label>
          <textarea
            className="w-full rounded border border-black/10 dark:border-white/10 bg-transparent p-2"
            rows={3}
            value={draft.description}
            onChange={(e) => updateDraft("description", e.target.value)}
          /> */}
        </div>
      ) : null}
    </div>
  );
}
