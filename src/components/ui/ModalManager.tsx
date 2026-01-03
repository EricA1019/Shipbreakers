/**
 * Modal Manager
 * 
 * Centralized component that renders the currently active modal.
 * Place this once near the root of your app.
 */
import { useModalStore, type ConfirmationModalData } from '../../stores/modalStore';
import ConfirmationModal from './ConfirmationModal';
import SettingsModal from './SettingsModal';
import StatsModal from './StatsModal';
import SaveManagerModal from './SaveManagerModal';

/**
 * Props for screens that might need navigation
 */
interface ModalManagerProps {
  onNavigate?: (screen: string) => void;
}

/**
 * ModalManager renders the active modal based on modalStore state.
 * 
 * This component should be placed once at a high level in the component tree.
 * Individual modals no longer need isOpen/onClose props passed down.
 */
export default function ModalManager(_props: ModalManagerProps) {
  const activeModal = useModalStore((state) => state.activeModal);
  const modalData = useModalStore((state) => state.modalData);
  const closeModal = useModalStore((state) => state.closeModal);

  // Don't render anything if no modal is active
  if (!activeModal) return null;

  // Render the appropriate modal based on type
  switch (activeModal) {
    case 'confirmation': {
      const data = modalData as ConfirmationModalData;
      return (
        <ConfirmationModal
          isOpen={true}
          title={data.title}
          message={data.message}
          confirmText={data.confirmText}
          cancelText={data.cancelText}
          isDangerous={data.isDangerous}
          onConfirm={() => {
            data.onConfirm();
            closeModal();
          }}
          onCancel={() => {
            data.onCancel?.();
            closeModal();
          }}
        />
      );
    }

    case 'settings':
      return (
        <SettingsModal
          isOpen={true}
          onClose={closeModal}
        />
      );

    case 'stats':
      return (
        <StatsModal
          isOpen={true}
          onClose={closeModal}
        />
      );

    case 'save-manager':
      return (
        <SaveManagerModal
          isOpen={true}
          onClose={closeModal}
        />
      );

    // These modals require more complex integration and will be migrated later
    case 'hire-crew':
    case 'crew-selection':
    case 'medical-bay':
    case 'fuel-depot':
    case 'cargo-swap':
    case 'event':
    case 'zone-unlock':
    case 'victory':
      // For now, close unknown modals
      // These can be migrated incrementally
      console.warn(`Modal type '${activeModal}' not yet integrated with ModalManager`);
      return null;

    default:
      console.warn(`Unknown modal type: ${activeModal}`);
      return null;
  }
}
