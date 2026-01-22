import SubmitLocationForm from "./SubmitLocationForm";

export default function SubmitLocationModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[3000]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white text-gray-900 border border-black/10 shadow-2xl
           dark:bg-gray-900 dark:text-gray-100 dark:border-white/10">
          <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10">
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Submit a Happy Hour</div>
            <button
              type="button"
              className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
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
