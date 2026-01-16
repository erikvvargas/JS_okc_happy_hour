import { useState } from "react";
import FiltersPanel from "./FiltersPanel";

export default function MobileFilters(props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Pill button */}
      <button
        onClick={() => setOpen(true)}
        className="absolute top-4 left-4 z-[1200] rounded-full px-3 py-2 text-sm bg-white/90 dark:bg-gray-900/90 backdrop-blur border border-black/10 dark:border-white/10 shadow-md text-gray-900 dark:text-gray-100"
      >
        Filters
      </button>
      {/* <button
        onClick={() => setPanelOpen(true)}
        className="absolute top-4 left-[96px] z-[1200] rounded-full px-3 py-2 text-sm bg-white/90 dark:bg-gray-900/90 backdrop-blur border border-black/10 dark:border-white/10 shadow-md"
      >
        List
      </button> */}

      {/* Overlay */}
      <div
        className={[
          "fixed inset-0 z-[1250] transition-opacity",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setOpen(false)}
        />

        {/* Bottom sheet */}
        <div
          className={[
            "absolute left-0 right-0 bottom-0 rounded-t-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100",
            "transition-transform duration-300 ease-in-out",
            open ? "translate-y-0" : "translate-y-full",
          ].join(" ")}
          style={{ height: "52vh" }}
        >
          <div className="pt-2">
            <div className="mx-auto h-1 w-10 rounded-full bg-black/20 dark:bg-white/20" />
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10">
            <div className="text-sm font-semibold">Filters</div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10"
              aria-label="Close filters"
            >
              ✕
            </button>
          </div>

          <div className="p-4 overflow-auto">
            <FiltersPanel {...props} />
            <div className="mt-4">
              <button
                onClick={() => setOpen(false)}
                className="w-full rounded-lg py-2 bg-black text-white dark:bg-white dark:text-black"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
