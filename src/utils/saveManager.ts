// Save manager utilities for exporting and importing game saves
import { useUiStore } from "../stores/uiStore";
import {
  STORE_STORAGE_KEY,
  SAVE_SCHEMA_VERSION,
  isPersistedStoreBlob,
  normalizeAndMigrateImportedSave,
  wrapPersistedState,
} from "../services/SaveService";

export function exportSave(filename: string = "shipbreakers-save.json") {
  const addToast = useUiStore.getState().addToast;
  const storeState = localStorage.getItem(STORE_STORAGE_KEY);
  if (!storeState) {
    addToast({ message: "No save data to export!", type: "warning" });
    return;
  }

  try {
    const parsed = JSON.parse(storeState) as unknown;
    const rawState = isPersistedStoreBlob(parsed) ? parsed.state : parsed;
    const exportJson = JSON.stringify(rawState, null, 2);

    // Basic sanity check so we don't export obviously broken state
    if (!rawState || typeof rawState !== "object") {
      throw new Error("Invalid save state");
    }

    const data = exportJson;
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to export save:", error);
    addToast({ message: "Failed to export save file", type: "error" });
  }
}

export function importSave(file: File): Promise<boolean> {
  const addToast = useUiStore.getState().addToast;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      (async () => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content) as unknown;

          // Support both raw GameState JSON (new format) and persisted wrapper (legacy).
          const fromVersion = isPersistedStoreBlob(parsed)
            ? typeof parsed.version === "number"
              ? parsed.version
              : 0
            : 0;

          if (typeof fromVersion === "number" && fromVersion > SAVE_SCHEMA_VERSION) {
            // Save from a newer app version; treat as incompatible.
            localStorage.removeItem(STORE_STORAGE_KEY);
            addToast({
              message: "Imported save is from a newer version. Existing save cleared.",
              type: "error",
            });
            setTimeout(() => window.location.reload(), 500);
            resolve(false);
            return;
          }

          const normalized = await normalizeAndMigrateImportedSave(parsed, { fromVersion });
          if (!normalized.ok) {
            localStorage.removeItem(STORE_STORAGE_KEY);
            addToast({ message: "Incompatible save. Existing save cleared.", type: "error" });
            setTimeout(() => window.location.reload(), 500);
            resolve(false);
            return;
          }

          localStorage.setItem(
            STORE_STORAGE_KEY,
            JSON.stringify(wrapPersistedState(normalized.state)),
          );

          setTimeout(() => {
            window.location.reload();
          }, 500);

          resolve(true);
        } catch (error) {
          console.error("Failed to import save:", error);
          addToast({
            message:
              "Failed to import save file. Make sure it's a valid Ship Breakers save.",
            type: "error",
          });
          resolve(false);
        }
      })();
    };
    reader.onerror = () => {
      addToast({ message: "Failed to read file", type: "error" });
      resolve(false);
    };
    reader.readAsText(file);
  });
}
