import { useEffect, useRef, useState } from "react";

export default function BottomSheet({
  open,
  onClose,
  title,
  children,
  zIndex = 2000,
  maxHeightClass = "max-h-[85vh]", // tweak per sheet
}) {
  const startY = useRef(null);
  const dragging = useRef(false);
  const [dragY, setDragY] = useState(0);

  // Reset drag when opening/closing
  useEffect(() => {
    if (!open) setDragY(0);
  }, [open]);

  // Close on ESC (nice-to-have)
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onPointerDown = (e) => {
    dragging.current = true;
    startY.current = e.clientY;
    setDragY(0);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragging.current || startY.current == null) return;
    const delta = e.clientY - startY.current;
    // only allow dragging down
    setDragY(Math.max(0, delta));
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;

    // threshold to close
    if (dragY > 90) {
      setDragY(0);
      onClose?.();
      return;
    }
    setDragY(0);
  };

  return (
    <div className="fixed inset-0" style={{ zIndex }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onClose?.()}
      />

      {/* Sheet */}
      <div
        className={[
          "absolute left-0 right-0 bottom-0",
          "rounded-t-2xl border border-black/10 dark:border-white/10",
          "bg-white/95 dark:bg-gray-900/95 backdrop-blur",
          "shadow-2xl",
          "transition-transform duration-200 ease-out",
          maxHeightClass,
        ].join(" ")}
        style={{
          transform: `translateY(${dragY}px)`,
        }}
      >
        {/* Handle area (drag) */}
        <div
          className="px-4 pt-3 pb-2 select-none touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="mx-auto h-1.5 w-12 rounded-full bg-black/20 dark:bg-white/20" />
          <div className="mt-2 flex items-center justify-between">
            <div className="text-sm font-semibold">{title}</div>
            <button
              type="button"
              className="rounded-md px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10"
              onClick={() => onClose?.()}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content (scrollable) */}
        <div className="px-4 pb-4 overflow-y-auto max-h-[calc(85vh-56px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
