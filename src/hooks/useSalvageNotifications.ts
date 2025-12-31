import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { showSuccessNotification } from '../utils/notifications';

export function useSalvageNotifications() {
  const currentRun = useGameStore((s) => s.currentRun);
  const previousLootCountRef = useRef(currentRun?.collectedLoot.length ?? 0);

  useEffect(() => {
    if (!currentRun) return;

    const currentCount = currentRun.collectedLoot.length;
    const previousCount = previousLootCountRef.current;

    if (currentCount > previousCount) {
      const newItem = currentRun.collectedLoot[currentCount - 1];
      showSuccessNotification(
        `✅ Item Salvaged: ${newItem.name}`,
        `+${newItem.value} CR`
      );
    }

    previousLootCountRef.current = currentCount;
  }, [currentRun?.collectedLoot.length]);
}
