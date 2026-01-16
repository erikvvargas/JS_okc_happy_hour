import LocationsList from "./LocationsList";
import LocationDetails from "./LocationDetails";


export default function DesktopSidebar({
    open,
    location,
    locations,
    onSelect,
    onBack,
    onClosePanel,
}) {
  return (
    <div
      className={[
        "hidden md:block",
        "absolute top-0 left-0 h-full w-96 z-[1400]",
        "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100",
        "shadow-xl",
        "transition-transform duration-300 ease-in-out",
        open ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}
    >
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10">
          <div className="text-sm font-semibold">Details</div>
          <button
            type="button"
            onClick={onClosePanel}
            className="rounded-md px-2 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>

        <div className="p-4 overflow-auto">
          {location ? (
            <div className="space-y-3">
              <button
                onClick={() => onBack()} // or a new "onBack" handler
                className="text-sm underline opacity-80"
              >
                ← Back to list
              </button>
              <LocationDetails location={location} />
            </div>
          ) : (
            <LocationsList locations={locations} onSelect={onSelect} />
          )}

        </div>
      </div>
    </div>
  );
}
