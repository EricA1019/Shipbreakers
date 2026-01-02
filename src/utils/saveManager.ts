// Save manager utilities for exporting and importing game saves
import { useUiStore } from "../stores/uiStore";

export function exportSave(filename: string = "shipbreakers-save.json") {
  const addToast = useUiStore.getState().addToast;
  const storeState = localStorage.getItem("ship-breakers-store-v1");
  if (!storeState) {
    addToast({ message: "No save data to export!", type: "warning" });
    return;
  }

  try {
    const data = JSON.stringify(JSON.parse(storeState), null, 2);
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
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Validate basic structure
        if (!data.state || typeof data.state !== "object") {
          throw new Error("Invalid save file format");
        }

        // Save to localStorage
        localStorage.setItem("ship-breakers-store-v1", JSON.stringify(data));

        // Reload page to apply new state
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
    };
    reader.onerror = () => {
      addToast({ message: "Failed to read file", type: "error" });
      resolve(false);
    };
    reader.readAsText(file);
  });
}
