import { useEffect, useRef } from "react";
import { useGameStore } from "../stores/gameStore";
import {
  showSuccessNotification,
  showWarningNotification,
} from "../utils/notifications";
import { CREDIT_MILESTONES } from "../game/constants";

export function useGameNotifications() {
  const { credits, crew, licenseDaysRemaining } = useGameStore((s) => ({
    credits: s.credits,
    crew: s.crew,
    licenseDaysRemaining: s.licenseDaysRemaining,
  }));

  const previousCreditsRef = useRef<number | null>(null);
  const previousSkillLevelsRef = useRef<Record<string, number>>({});
  const previousHpRef = useRef<number | null>(null);
  const previousLicenseDaysRef = useRef<number | null>(null);

  // Initialize refs on first render
  useEffect(() => {
    if (previousCreditsRef.current === null)
      previousCreditsRef.current = credits;
    if (previousHpRef.current === null) previousHpRef.current = crew.hp;
    if (previousLicenseDaysRef.current === null)
      previousLicenseDaysRef.current = licenseDaysRemaining;
    if (Object.keys(previousSkillLevelsRef.current).length === 0) {
      previousSkillLevelsRef.current = { ...crew.skills };
    }
  }, []);

  useEffect(() => {
    // Credit milestone notifications
    if (previousCreditsRef.current === null) return;
    const creditMilestones = CREDIT_MILESTONES || [
      1000, 5000, 10000, 25000, 50000, 100000,
    ];
    creditMilestones.forEach((milestone) => {
      if (credits >= milestone && previousCreditsRef.current! < milestone) {
        showSuccessNotification(
          `💰 Milestone Reached!`,
          `${milestone} CR accumulated`,
        );
      }
    });
    previousCreditsRef.current = credits;
  }, [credits]);

  useEffect(() => {
    // Skill level-up notifications
    if (Object.keys(previousSkillLevelsRef.current).length === 0) return;
    Object.entries(crew.skills).forEach(([skill, level]) => {
      const prevLevel = previousSkillLevelsRef.current[skill];
      if (level > prevLevel) {
        showSuccessNotification(
          `⭐ Skill Level-Up!`,
          `${skill.toUpperCase()} is now Level ${level}`,
        );
      }
    });
    previousSkillLevelsRef.current = { ...crew.skills };
  }, [crew.skills]);

  useEffect(() => {
    // Critical HP warning
    if (previousHpRef.current === null) return;
    if (crew.hp <= 5 && previousHpRef.current > 5 && crew.hp > 0) {
      showWarningNotification(
        `❤️ CRITICAL HEALTH!`,
        `Only ${crew.hp} HP remaining`,
      );
    }
    previousHpRef.current = crew.hp;
  }, [crew.hp]);

  useEffect(() => {
    // License expiry warning
    if (previousLicenseDaysRef.current === null) return;
    if (licenseDaysRemaining === 2 && previousLicenseDaysRef.current !== 2) {
      showWarningNotification(
        `📜 License Expiring Soon`,
        `Only ${licenseDaysRemaining} days remain`,
      );
    }
    if (licenseDaysRemaining === 1 && previousLicenseDaysRef.current !== 1) {
      showWarningNotification(
        `📜 URGENT: License Expires Tomorrow`,
        `Renew immediately to avoid game over`,
      );
    }
    previousLicenseDaysRef.current = licenseDaysRemaining;
  }, [licenseDaysRemaining]);
}
