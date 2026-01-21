import SubmitLocationForm from "./SubmitLocationForm";

export default function SubmitLocationModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[3000]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-black/10 dark:border-white/10 shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10">
            <div className="font-semibold">Submit a Happy Hour</div>
            <button
              type="button"
              className="rounded-md px-2 py-1 hover:bg-black/5 dark:hover:bg-white/10"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          <div className="p-4">
            <SubmitLocationForm
              showGeocode={false}
              onCancel={onClose}
              onSuccess={onClose}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
