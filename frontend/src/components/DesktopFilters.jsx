import FiltersPanel from "./FiltersPanel";

export default function DesktopFilters(props) {
  return (
    <div className="hidden md:block absolute top-4 left-4 z-[1200] w-72">
      <div className="rounded-2xl bg-white/90 dark:bg-gray-900/90 backdrop-blur border border-black/10 dark:border-white/10 shadow-lg p-4 text-gray-900 dark:text-gray-100">
        <div className="text-sm font-semibold mb-3">Find happy hour</div>
        <FiltersPanel {...props} />
      </div>
    </div>
  );
}
