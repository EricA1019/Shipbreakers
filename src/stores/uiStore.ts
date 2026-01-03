import create from "zustand";
import type { Toast } from "../types";

interface UiState {
  toasts: Toast[];
  addToast: (t: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  soundEnabled: boolean;
  soundVolume: number; // 0-1
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
}

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  addToast: (t) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const toast = { id, ...t } as Toast;
    set((s) => ({ toasts: s.toasts.concat(toast) }));

    const duration = t.duration ?? 4000;
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
    }, duration);
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  soundEnabled: true,
  soundVolume: 0.7,
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  setSoundVolume: (volume) => set({ soundVolume: Math.max(0, Math.min(1, volume)) }),
}));
