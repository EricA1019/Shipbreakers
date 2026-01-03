/**
 * Modal Store
 * 
 * Centralized modal state management using Zustand.
 * This allows any component to open/close modals without prop drilling.
 */
import { create } from 'zustand';

/**
 * Modal types supported by the system
 */
export type ModalType =
  | 'confirmation'
  | 'settings'
  | 'stats'
  | 'hire-crew'
  | 'crew-selection'
  | 'medical-bay'
  | 'fuel-depot'
  | 'cargo-swap'
  | 'event'
  | 'zone-unlock'
  | 'victory'
  | 'save-manager';

/**
 * Modal data types for each modal
 */
export interface ConfirmationModalData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export interface EventModalData {
  eventId?: string;
}

export interface CargoSwapModalData {
  itemId?: string;
}

export interface ZoneUnlockModalData {
  zone?: string;
}

/**
 * Union type for all modal data
 */
export type ModalData = 
  | ConfirmationModalData 
  | EventModalData 
  | CargoSwapModalData 
  | ZoneUnlockModalData
  | Record<string, unknown>;

/**
 * Modal state interface
 */
interface ModalState {
  // Currently open modal (null if none)
  activeModal: ModalType | null;
  // Data passed to the modal
  modalData: ModalData | null;
  // Stack of previously opened modals (for nested modals)
  modalStack: Array<{ type: ModalType; data: ModalData | null }>;
  
  // Actions
  openModal: (type: ModalType, data?: ModalData) => void;
  closeModal: () => void;
  closeAllModals: () => void;
  
  // Convenience methods for common modals
  confirm: (options: ConfirmationModalData) => void;
  alert: (title: string, message: string) => void;
}

/**
 * Modal store
 */
export const useModalStore = create<ModalState>((set, get) => ({
  activeModal: null,
  modalData: null,
  modalStack: [],

  openModal: (type, data) => {
    const { activeModal, modalData, modalStack } = get();
    
    // If a modal is already open, push it to the stack
    if (activeModal) {
      set({
        modalStack: [...modalStack, { type: activeModal, data: modalData }],
        activeModal: type,
        modalData: data ?? null,
      });
    } else {
      set({
        activeModal: type,
        modalData: data ?? null,
      });
    }
  },

  closeModal: () => {
    const { modalStack } = get();
    
    // If there are modals in the stack, pop one
    if (modalStack.length > 0) {
      const previous = modalStack[modalStack.length - 1];
      set({
        activeModal: previous.type,
        modalData: previous.data,
        modalStack: modalStack.slice(0, -1),
      });
    } else {
      set({
        activeModal: null,
        modalData: null,
      });
    }
  },

  closeAllModals: () => {
    set({
      activeModal: null,
      modalData: null,
      modalStack: [],
    });
  },

  confirm: (options) => {
    get().openModal('confirmation', options);
  },

  alert: (title, message) => {
    get().openModal('confirmation', {
      title,
      message,
      confirmText: 'OK',
      onConfirm: () => get().closeModal(),
    });
  },
}));

/**
 * Hook to check if a specific modal is open
 */
export function useIsModalOpen(type: ModalType): boolean {
  return useModalStore((state) => state.activeModal === type);
}

/**
 * Hook to get modal data with type safety
 */
export function useModalData<T extends ModalData>(): T | null {
  return useModalStore((state) => state.modalData as T | null);
}

/**
 * Hook for confirmation dialog
 * Returns a function that shows the confirmation and returns a promise
 */
export function useConfirm() {
  const openModal = useModalStore((state) => state.openModal);
  const closeModal = useModalStore((state) => state.closeModal);

  return (options: Omit<ConfirmationModalData, 'onConfirm' | 'onCancel'>): Promise<boolean> => {
    return new Promise((resolve) => {
      openModal('confirmation', {
        ...options,
        onConfirm: () => {
          closeModal();
          resolve(true);
        },
        onCancel: () => {
          closeModal();
          resolve(false);
        },
      });
    });
  };
}
