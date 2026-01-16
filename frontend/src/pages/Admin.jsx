import { useEffect, useMemo, useState } from "react";
import { getToken, clearToken } from "../lib/auth";

const API = import.meta.env.VITE_API_BASE;

export default function Admin() {
  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [status, setStatus] = useState("");

  const authHeaders = useMemo(
    () => ({ Authorization: `Bearer ${getToken()}` }),
    []
  );

  async function load() {
    setStatus("");
    const res = await fetch(`${API}/admin/locations`, { headers: authHeaders });
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
      description: row.description ?? "",
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

    const res = await fetch(`${API}/admin/locations/${id}`, {
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

    const res = await fetch(`${API}/admin/locations/${id}`, {
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

          <label className="block text-xs opacity-70 mb-1">Description</label>
          <textarea
            className="w-full rounded border border-black/10 dark:border-white/10 bg-transparent p-2"
            rows={3}
            value={draft.description}
            onChange={(e) => updateDraft("description", e.target.value)}
          />
        </div>
      ) : null}
    </div>
  );
}
