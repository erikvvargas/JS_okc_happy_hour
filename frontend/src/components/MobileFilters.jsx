import FiltersPanel from "./FiltersPanel";
import { MobileBottomSheet } from "./MobileDrawer";

export default function MobileFilters({ open, setOpen, ...props }) {
  return (
    <div className="md:hidden">
      {/* Pill button */}
      <button
        onClick={() => setOpen(true)}
        className="absolute top-4 left-4 z-[1200] rounded-full px-3 py-2 text-sm bg-white/90 dark:bg-gray-900/90 backdrop-blur border border-black/10 dark:border-white/10 shadow-md text-gray-900 dark:text-gray-100"
      >
        Filters
      </button>

      <MobileBottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Filters"
        height="52vh"
        zIndex={1250}
      >
        <FiltersPanel {...props} />
        <div className="mt-4">
          <button
            onClick={() => setOpen(false)}
            className="w-full rounded-lg py-2 bg-black text-white dark:bg-white dark:text-black"
            type="button"
          >
            Done
          </button>
        </div>
      </MobileBottomSheet>
    </div>
  );
}
