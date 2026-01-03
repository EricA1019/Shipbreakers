import { useRef } from "react";
import { exportSave, importSave } from "../../utils/saveManager";
import { showSuccessNotification } from "../../utils/notifications";

interface SaveManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SaveManagerModal({
  isOpen,
  onClose,
}: SaveManagerModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportSave();
    showSuccessNotification("💾 Save Exported", "Check your downloads folder");
    onClose();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const success = await importSave(file);
      if (success) {
        showSuccessNotification(
          "💾 Save Imported",
          "Game will reload with new save",
        );
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border-2 border-amber-600 rounded p-6 max-w-sm w-full mx-4">
        <div className="text-amber-500 text-xs font-semibold tracking-wider mb-4">
          SAVE MANAGER
        </div>

        <div className="space-y-3 mb-6">
          <div className="text-sm text-zinc-400">
            Export your save file as a backup or to share with others. Import a
            previously exported save to restore your progress.
          </div>

          <div className="space-y-2">
            <button
              className="w-full bg-green-700 text-white px-4 py-2 text-sm font-bold hover:bg-green-600 rounded"
              onClick={handleExport}
            >
              💾 Export Save
            </button>
            <button
              className="w-full bg-blue-700 text-white px-4 py-2 text-sm font-bold hover:bg-blue-600 rounded"
              onClick={handleImportClick}
            >
              📂 Import Save
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelected}
              className="hidden"
            />
          </div>
        </div>

        <button
          className="w-full bg-zinc-700 border border-amber-600/30 text-amber-100 px-4 py-2 text-sm font-bold hover:border-amber-500"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
