import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import Map from "./components/Map";
import DesktopSidebar from "./components/DesktopSidebar";
import MobileDrawer, { MobileBottomSheet } from "./components/MobileDrawer";
import DesktopFilters from "./components/DesktopFilters";
import MobileFilters from "./components/MobileFilters";
import { API_BASE } from "./lib/api";
import SubmitLocationModal from "./components/SubmitLocationModal";
import SubmitLocationForm from "./components/SubmitLocationForm";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getTodayAbbrev() {
  return WEEKDAYS[new Date().getDay()];
}

// "HH:MM" -> minutes since midnight
function timeToMinutes(t) {
  if (!t || typeof t !== "string") return null;
  const [hh, mm] = t.split(":").map(Number);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  return hh * 60 + mm;
}

// returns "Mon"..."Sun"
function resolveSelectedDay(selectedDay) {
  return selectedDay === "Today" ? getTodayAbbrev() : selectedDay;
}

// returns minutes since midnight
function resolveSelectedTimeMinutes(timeMode, selectedTime) {
  if (timeMode === "now") {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }
  return timeToMinutes(selectedTime);
}

function parseDays(daysValue) {
  if (!daysValue) return [];
  if (Array.isArray(daysValue)) return daysValue;
  return String(daysValue)
    .split(/[,/ ]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.slice(0, 3))
    .map((s) => s[0].toUpperCase() + s.slice(1).toLowerCase());
}

function locationHasDay(loc, dayAbbrev) {
  const days = parseDays(loc.days);
  return days.includes(dayAbbrev);
}

function isActive(loc, dayAbbrev, timeMin) {
  if (!locationHasDay(loc, dayAbbrev)) return false;
  const start = timeToMinutes(loc.start_time);
  const end = timeToMinutes(loc.end_time);
  if (start == null || end == null || timeMin == null) return false;
  return start <= timeMin && timeMin <= end;
}

function isUpcoming(loc, dayAbbrev, timeMin) {
  if (!locationHasDay(loc, dayAbbrev)) return false;
  const start = timeToMinutes(loc.start_time);
  if (start == null || timeMin == null) return false;
  return start > timeMin;
}

function getStatus(loc, dayAbbrev, timeMin) {
  if (isActive(loc, dayAbbrev, timeMin)) return "ACTIVE";
  if (isUpcoming(loc, dayAbbrev, timeMin)) return "UPCOMING";
  return "INACTIVE";
}

function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
  });

  const [locations, setLocations] = useState([]);
  const [selected, setSelected] = useState(null);

  const [selectedDay, setSelectedDay] = useState("Today");
  const [timeMode, setTimeMode] = useState("now"); // "now" | "custom"
  const [selectedTime, setSelectedTime] = useState("17:00"); // only used if custom

  const resolvedDay = resolveSelectedDay(selectedDay);
  const resolvedTimeMin = resolveSelectedTimeMinutes(timeMode, selectedTime);

  const [panelOpen, setPanelOpen] = useState(false);   // list/details
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [map, setMap] = useState(null);

  useEffect(() => {
    const calc = () => setIsMobile(window.innerWidth < 768);
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  const locationsWithStatus = locations.map((loc) => ({
    ...loc,
    _status: getStatus(loc, resolvedDay, resolvedTimeMin),
  }));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    fetch(`${API_BASE}/locations`)
      .then((res) => res.json())
      .then((data) => setLocations(data))
      .catch((err) => console.error("Failed to load locations", err));
  }, []);

  const handleSelect = (loc) => {
    setSelected(loc);
    setPanelOpen(true);
  };

  const closeAllOverlays = () => {
    setSelected(null);
    setPanelOpen(false);
    setFiltersOpen(false);
    setSubmitOpen(false);
  };

  return (
    <div className="h-[100dvh] w-screen relative overflow-hidden bg-white dark:bg-gray-900">
      {/* MAP fills the screen */}
      <div className="absolute inset-0">
        <Map
          locations={locationsWithStatus}
          onSelect={handleSelect}
          selected={selected}
          theme={theme}
          onBackgroundClick={() => {
            setSelected(null);
            setPanelOpen(false);
          }}
          onMapReady={setMap}
        />

      </div>
      
      {/* List + Submit pills (you can tweak spacing later) */}
      <div className="absolute top-4 left-[92px] md:left-[320px] z-[1300] flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="rounded-full px-3 py-2 text-sm bg-white/90 dark:bg-gray-900/90 backdrop-blur border border-black/10 dark:border-white/10 shadow-md text-gray-900 dark:text-gray-100"
        >
          List
        </button>

        <button
          type="button"
          onClick={() => setSubmitOpen(true)}
          className="rounded-full px-3 py-2 text-sm bg-white/90 dark:bg-gray-900/90 backdrop-blur border border-black/10 dark:border-white/10 shadow-md text-gray-900 dark:text-gray-100"
        >
          Submit
        </button>
      </div>


{/* Commented out to ensure this is the correct crosshair that 
needs to be removed from the map that is rendering incorrectly */}

      {/* <button
        type="button"
        onClick={() => {
          if (!map) return;
          if (!navigator.geolocation) {
            alert("Geolocation not supported on this device.");
            return;
          }
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              map.flyTo([latitude, longitude], Math.max(map.getZoom(), 15), {
                animate: true,
                duration: 0.8,
              });
            },
            (err) => {
              alert(err?.message || "Could not get your location.");
            },
            { enableHighAccuracy: true, timeout: 8000 }
          );
        }}
        className={[
          "absolute z-[1200] rounded-full p-2",
          "bg-white/90 dark:bg-gray-900/90 backdrop-blur",
          "border border-black/10 dark:border-white/10 shadow-md",
          "text-gray-900 dark:text-gray-100",
          // position: bottom-right, above Leaflet ZoomControl
          "right-3",
          "bottom-[calc(5.5rem+env(safe-area-inset-bottom))]",
        ].join(" ")}
        aria-label="Center map on my location"
        title="Center on me"
      >
        ⌖
      </button>

 */}
      <DesktopFilters
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        timeMode={timeMode}
        setTimeMode={setTimeMode}
        selectedTime={selectedTime}
        setSelectedTime={setSelectedTime}
      />

      <MobileFilters
        open={filtersOpen}
        setOpen={setFiltersOpen}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        timeMode={timeMode}
        setTimeMode={setTimeMode}
        selectedTime={selectedTime}
        setSelectedTime={setSelectedTime}
      />

      {/* Desktop Submit modal */}
      {!isMobile ? (
        <SubmitLocationModal open={submitOpen} onClose={() => setSubmitOpen(false)} />
      ) : null}

      {/* Mobile Submit drawer */}
      {isMobile ? (
        <MobileBottomSheet
          open={submitOpen}
          onClose={() => setSubmitOpen(false)}
          title="Submit a Happy Hour"
          height="75vh"
          zIndex={1500}
        >
          <div className="pb-4">
            <SubmitLocationForm
              showGeocode={false}
              onCancel={() => setSubmitOpen(false)}
              onSuccess={() => setSubmitOpen(false)}
            />
          </div>
        </MobileBottomSheet>
      ) : null}

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        className="absolute top-4 right-4 z-[1100] rounded-full p-2 bg-white dark:bg-gray-800 shadow-md text-gray-800 dark:text-gray-100"
        aria-label="Toggle theme"
      >
        {theme === "light" ? <Moon /> : <Sun />}
      </button>

      {/* Desktop sidebar + Mobile drawer (List/Details) */}
      {panelOpen ? (
        <DesktopSidebar
          open={panelOpen}
          location={selected}
          locations={locationsWithStatus}
          onSelect={handleSelect}
          onBack={() => setSelected(null)}
          onClosePanel={() => {
            setSelected(null);
            setPanelOpen(false);
          }}
          nowMin={resolvedTimeMin}
        />
      ) : null}

      <MobileDrawer
        open={panelOpen}
        location={selected}
        locations={locationsWithStatus}
        onSelect={handleSelect}
        onBack={() => setSelected(null)}
        onClosePanel={() => {
          setSelected(null);
          setPanelOpen(false);
        }}
        nowMin={resolvedTimeMin}
      />

    </div>
  );
}

export default App;
