import { useEffect, useMemo, useRef, useState } from "react";
import LocationsList from "./LocationsList";
import LocationDetails from "./LocationDetails";

export function MobileBottomSheet({
  open,
  title,
  onClose,
  height = "52vh",
  zIndex = 1400,
  children,
}) {
  const sheetRef = useRef(null);
  const [mounted, setMounted] = useState(open);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (open) setMounted(true);
    if (!open) {
      // allow close animation to finish before unmount
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  // reset drag when closing
  useEffect(() => {
    if (!open) {
      setDragY(0);
      setDragging(false);
    }
  }, [open]);

  const thresholdPx = useMemo(() => {
    const h = sheetRef.current?.getBoundingClientRect?.().height;
    return Math.max(120, (h || 0) * 0.25);
  }, [open]);

  const onHandlePointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);

    const startY = e.clientY;
    const startDrag = dragY;

    const move = (ev) => {
      const dy = Math.max(0, startDrag + (ev.clientY - startY));
      setDragY(dy);
    };

    const up = () => {
      setDragging(false);
      if (dragY > thresholdPx) {
        onClose?.();
      } else {
        setDragY(0);
      }
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  if (!mounted) return null;

  const isOpen = open; // for readability
  const translate = isOpen ? `translateY(${dragY}px)` : "translateY(100%)";
  const transition = dragging ? "none" : "transform 300ms ease-in-out";

  return (
    <div
      className={[
        "md:hidden fixed inset-0",
        isOpen ? "pointer-events-auto" : "pointer-events-none",
      ].join(" ")}
      style={{ zIndex }}
    >
      {/* overlay */}
      <div
        className={[
          "absolute inset-0 bg-black/40 transition-opacity",
          isOpen ? "opacity-100" : "opacity-0",
        ].join(" ")}
        onClick={onClose}
      />

      {/* sheet */}
      <div
        ref={sheetRef}
        className="absolute left-0 right-0 bottom-0 rounded-t-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-2xl border-t border-black/10 dark:border-white/10"
        style={{
          height,
          transform: translate,
          transition,
          willChange: "transform",
        }}
      >
        {/* drag handle */}
        <div className="pt-2" onPointerDown={onHandlePointerDown} role="button" aria-label="Drag to close">
          <div className="mx-auto h-1 w-10 rounded-full bg-black/20 dark:bg-white/20" />
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 dark:border-white/10">
          <div className="text-sm font-semibold">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm hover:bg-black/5 dark:hover:bg-white/10"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="h-[calc(100%-88px)] overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
}

// Default export: your existing List/Details drawer built on MobileBottomSheet
export default function MobileDrawer({
  open,
  location,
  locations,
  onSelect,
  onBack,
  onClosePanel,
}) {
  return (
    <MobileBottomSheet
      open={open}
      onClose={onClosePanel}
      title={location ? "Details" : "List"}
      height="65vh"
      zIndex={1400}
    >
      {location ? (
        <div className="space-y-3">
          <button
            onClick={onBack}
            className="text-sm underline opacity-80"
            type="button"
          >
            ← Back to list
          </button>
          <LocationDetails location={location} />
        </div>
      ) : (
        <LocationsList locations={locations} onSelect={onSelect} />
      )}
    </MobileBottomSheet>
  );
}
