import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import Map from "./components/Map";
import DesktopSidebar from "./components/DesktopSidebar";
import MobileDrawer from "./components/MobileDrawer";
import DesktopFilters from "./components/DesktopFilters";
import MobileFilters from "./components/MobileFilters";
import { API_BASE } from "./lib/api";


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

// Normalize your sheet field `days` into ["Mon","Tue",...]
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
  const [theme, setTheme] = useState("light");
  const [locations, setLocations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [selectedDay, setSelectedDay] = useState("Today");
  const [timeMode, setTimeMode] = useState("now"); // "now" | "custom"
  const [selectedTime, setSelectedTime] = useState("17:00"); // only used if custom
  const resolvedDay = resolveSelectedDay(selectedDay);
  const resolvedTimeMin = resolveSelectedTimeMinutes(timeMode, selectedTime);
  const [panelOpen, setPanelOpen] = useState(false);
  const locationsWithStatus = locations.map((loc) => ({
    ...loc,
    _status: getStatus(loc, resolvedDay, resolvedTimeMin),
  }));
  const closePanel = () => {
  setSelected(null);
  setPanelOpen(false);
  };

  const backToList = () => {
    setSelected(null);
  };
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    fetch(`${API_BASE}/locations`)
      .then((res) => res.json())
      .then((data) => setLocations(data))
      .catch((err) => console.error("Failed to load locations", err));
  }, []);


  useEffect(() => {
    if (!locations.length) return;
    const counts = { ACTIVE: 0, UPCOMING: 0, INACTIVE: 0 };
    for (const loc of locations) {
      counts[getStatus(loc, resolvedDay, resolvedTimeMin)]++;
    }
    console.log("Filter:", { selectedDay, timeMode, selectedTime, resolvedDay, resolvedTimeMin });
    console.log("Counts:", counts);
  }, [locations, selectedDay, timeMode, selectedTime, resolvedDay, resolvedTimeMin]);

  // const openPanel = !!selected;
  const openPanel = panelOpen;
  const handleSelect = (loc) => {
    setSelected(loc);
    setPanelOpen(true);
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
          onBackgroundClick={() => setSelected(null)}
        />

      </div>
      <button
        onClick={() => setPanelOpen(true)}
        className="absolute top-4 left-[92px] md:left-[320px] z-[1200] rounded-full px-3 py-2 text-sm bg-white/90 dark:bg-gray-900/90 backdrop-blur border border-black/10 dark:border-white/10 shadow-md text-gray-900 dark:text-gray-100"
      >
        List
      </button>


      <DesktopFilters
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        timeMode={timeMode}
        setTimeMode={setTimeMode}
        selectedTime={selectedTime}
        setSelectedTime={setSelectedTime}
      />

      <MobileFilters
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
        timeMode={timeMode}
        setTimeMode={setTimeMode}
        selectedTime={selectedTime}
        setSelectedTime={setSelectedTime}
      />

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        className="absolute top-4 right-4 z-[1100] rounded-full p-2 bg-white dark:bg-gray-800 shadow-md text-gray-800 dark:text-gray-100"
        aria-label="Toggle theme"
      >
        {theme === "light" ? <Moon /> : <Sun />}
      </button>

      {/* Desktop sidebar + Mobile drawer */}

      {panelOpen ? (
        <DesktopSidebar
          open={panelOpen}
          location={selected}
          locations={locationsWithStatus}
          onSelect={handleSelect}
          onBack={() => setSelected(null)}
          onClosePanel={() => { setSelected(null); setPanelOpen(false); }}
        />
      ) : null}

      {panelOpen ? (
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
        />
      ) : null}



    </div>
  );
}
// console.log("API BASE:", import.meta.env.VITE_API_BASE);

export default App;
