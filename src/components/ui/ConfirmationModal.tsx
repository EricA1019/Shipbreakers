interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDangerous = false,
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border-2 border-amber-600 p-6 rounded max-w-sm w-full mx-4">
        <div
          className={`text-lg font-bold mb-3 ${isDangerous ? "text-red-400" : "text-amber-100"}`}
        >
          {title}
        </div>
        <div className="text-zinc-300 text-sm mb-6">{message}</div>
        <div className="flex gap-3 justify-end">
          <button
            className="bg-zinc-700 border border-amber-600/30 text-amber-100 px-4 py-2 text-sm font-bold hover:border-amber-500"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className={`px-4 py-2 text-sm font-bold ${
              isDangerous
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-amber-500 text-zinc-900 hover:bg-amber-400"
            }`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
