import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the AutoSalvageRules interface
interface AutoSalvageRules {
  maxHazardLevel: number;
  priorityRooms: ("cargo" | "labs" | "armory" | "any")[];
  stopOnInjury: boolean;
  stopOnLowStamina: number;
  stopOnLowSanity: number;
}

// Test validation logic
function validateRules(rules: AutoSalvageRules): string | null {
  if (rules.maxHazardLevel < 1 || rules.maxHazardLevel > 5) {
    return "Hazard level must be 1-5";
  }
  if (rules.stopOnLowStamina < 0 || rules.stopOnLowStamina > 100) {
    return "Stamina threshold must be 0-100";
  }
  if (rules.stopOnLowSanity < 0 || rules.stopOnLowSanity > 100) {
    return "Sanity threshold must be 0-100";
  }
  if (rules.priorityRooms.length === 0) {
    return "At least one room priority required";
  }
  return null;
}

// Test presets
const PRESETS: { name: string; rules: AutoSalvageRules }[] = [
  {
    name: "Conservative",
    rules: {
      maxHazardLevel: 2,
      priorityRooms: ["cargo", "any"],
      stopOnInjury: true,
      stopOnLowStamina: 40,
      stopOnLowSanity: 50,
    },
  },
  {
    name: "Balanced",
    rules: {
      maxHazardLevel: 3,
      priorityRooms: ["any"],
      stopOnInjury: true,
      stopOnLowStamina: 30,
      stopOnLowSanity: 40,
    },
  },
  {
    name: "Aggressive",
    rules: {
      maxHazardLevel: 5,
      priorityRooms: ["armory", "labs", "cargo", "any"],
      stopOnInjury: false,
      stopOnLowStamina: 10,
      stopOnLowSanity: 20,
    },
  },
];

describe("Auto-Salvage Rule Validation", () => {
  it("should accept valid rules", () => {
    const validRules: AutoSalvageRules = {
      maxHazardLevel: 3,
      priorityRooms: ["any"],
      stopOnInjury: true,
      stopOnLowStamina: 30,
      stopOnLowSanity: 40,
    };
    expect(validateRules(validRules)).toBeNull();
  });

  it("should reject hazard level below 1", () => {
    const rules: AutoSalvageRules = {
      maxHazardLevel: 0,
      priorityRooms: ["any"],
      stopOnInjury: true,
      stopOnLowStamina: 30,
      stopOnLowSanity: 40,
    };
    expect(validateRules(rules)).toBe("Hazard level must be 1-5");
  });

  it("should reject hazard level above 5", () => {
    const rules: AutoSalvageRules = {
      maxHazardLevel: 6,
      priorityRooms: ["any"],
      stopOnInjury: true,
      stopOnLowStamina: 30,
      stopOnLowSanity: 40,
    };
    expect(validateRules(rules)).toBe("Hazard level must be 1-5");
  });

  it("should reject negative stamina threshold", () => {
    const rules: AutoSalvageRules = {
      maxHazardLevel: 3,
      priorityRooms: ["any"],
      stopOnInjury: true,
      stopOnLowStamina: -10,
      stopOnLowSanity: 40,
    };
    expect(validateRules(rules)).toBe("Stamina threshold must be 0-100");
  });

  it("should reject stamina threshold over 100", () => {
    const rules: AutoSalvageRules = {
      maxHazardLevel: 3,
      priorityRooms: ["any"],
      stopOnInjury: true,
      stopOnLowStamina: 150,
      stopOnLowSanity: 40,
    };
    expect(validateRules(rules)).toBe("Stamina threshold must be 0-100");
  });

  it("should reject negative sanity threshold", () => {
    const rules: AutoSalvageRules = {
      maxHazardLevel: 3,
      priorityRooms: ["any"],
      stopOnInjury: true,
      stopOnLowStamina: 30,
      stopOnLowSanity: -5,
    };
    expect(validateRules(rules)).toBe("Sanity threshold must be 0-100");
  });

  it("should reject empty room priorities", () => {
    const rules: AutoSalvageRules = {
      maxHazardLevel: 3,
      priorityRooms: [],
      stopOnInjury: true,
      stopOnLowStamina: 30,
      stopOnLowSanity: 40,
    };
    expect(validateRules(rules)).toBe("At least one room priority required");
  });
});

describe("Auto-Salvage Presets", () => {
  it("should have 3 presets defined", () => {
    expect(PRESETS).toHaveLength(3);
  });

  it("should have Conservative preset with safe defaults", () => {
    const conservative = PRESETS.find((p) => p.name === "Conservative");
    expect(conservative).toBeDefined();
    expect(conservative!.rules.maxHazardLevel).toBe(2);
    expect(conservative!.rules.stopOnInjury).toBe(true);
    expect(conservative!.rules.stopOnLowStamina).toBeGreaterThanOrEqual(40);
  });

  it("should have Balanced preset with moderate settings", () => {
    const balanced = PRESETS.find((p) => p.name === "Balanced");
    expect(balanced).toBeDefined();
    expect(balanced!.rules.maxHazardLevel).toBe(3);
    expect(balanced!.rules.stopOnInjury).toBe(true);
  });

  it("should have Aggressive preset with risk-taking settings", () => {
    const aggressive = PRESETS.find((p) => p.name === "Aggressive");
    expect(aggressive).toBeDefined();
    expect(aggressive!.rules.maxHazardLevel).toBe(5);
    expect(aggressive!.rules.stopOnInjury).toBe(false);
    expect(aggressive!.rules.stopOnLowStamina).toBeLessThanOrEqual(20);
  });

  it("all presets should pass validation", () => {
    for (const preset of PRESETS) {
      expect(validateRules(preset.rules)).toBeNull();
    }
  });
});

describe("Auto-Salvage Room Prioritization", () => {
  // Mock rooms for testing
  const mockRooms = [
    { id: "r1", name: "Cargo Bay", hazardLevel: 2 },
    { id: "r2", name: "Research Labs", hazardLevel: 3 },
    { id: "r3", name: "Main Armory", hazardLevel: 4 },
    { id: "r4", name: "Bridge", hazardLevel: 1 },
    { id: "r5", name: "Engine Room", hazardLevel: 5 },
  ];

  function findPriorityRoom(
    rooms: typeof mockRooms,
    priorities: AutoSalvageRules["priorityRooms"],
    maxHazard: number
  ) {
    const available = rooms.filter((r) => r.hazardLevel <= maxHazard);
    if (available.length === 0) return null;

    for (const priority of priorities) {
      if (priority === "any") return available[0];
      const match = available.find((r) => r.name.toLowerCase().includes(priority));
      if (match) return match;
    }
    return available[0];
  }

  it("should filter rooms by max hazard level", () => {
    const result = findPriorityRoom(mockRooms, ["any"], 2);
    expect(result).toBeDefined();
    expect(result!.hazardLevel).toBeLessThanOrEqual(2);
  });

  it("should prioritize cargo rooms when specified", () => {
    const result = findPriorityRoom(mockRooms, ["cargo", "any"], 5);
    expect(result!.name).toBe("Cargo Bay");
  });

  it("should prioritize labs rooms when specified", () => {
    const result = findPriorityRoom(mockRooms, ["labs", "any"], 5);
    expect(result!.name).toBe("Research Labs");
  });

  it("should prioritize armory rooms when specified", () => {
    const result = findPriorityRoom(mockRooms, ["armory", "any"], 5);
    expect(result!.name).toBe("Main Armory");
  });

  it("should fall back to any room if priority not found", () => {
    const result = findPriorityRoom(mockRooms, ["labs", "any"], 2);
    // Labs has hazard 3, so can't be selected with maxHazard 2
    // Should fall back to first available
    expect(result).toBeDefined();
    expect(result!.hazardLevel).toBeLessThanOrEqual(2);
  });

  it("should return null if no rooms available", () => {
    const result = findPriorityRoom(mockRooms, ["any"], 0);
    expect(result).toBeNull();
  });
});

describe("Auto-Salvage Stop Conditions", () => {
  interface MockCrewState {
    hp: number;
    maxHp: number;
    stamina: number;
    sanity: number;
  }

  function shouldStopForCrew(
    crew: MockCrewState,
    rules: AutoSalvageRules
  ): string | null {
    if (rules.stopOnInjury && crew.hp < crew.maxHp * 0.5) {
      return "injury";
    }
    if (crew.stamina <= rules.stopOnLowStamina) {
      return "crew_exhausted";
    }
    if (crew.sanity <= rules.stopOnLowSanity) {
      return "crew_exhausted";
    }
    return null;
  }

  it("should stop for injury when enabled and HP below 50%", () => {
    const crew: MockCrewState = { hp: 40, maxHp: 100, stamina: 80, sanity: 80 };
    const rules: AutoSalvageRules = {
      maxHazardLevel: 3,
      priorityRooms: ["any"],
      stopOnInjury: true,
      stopOnLowStamina: 30,
      stopOnLowSanity: 30,
    };
    expect(shouldStopForCrew(crew, rules)).toBe("injury");
  });

  it("should not stop for injury when disabled", () => {
    const crew: MockCrewState = { hp: 40, maxHp: 100, stamina: 80, sanity: 80 };
    const rules: AutoSalvageRules = {
      maxHazardLevel: 3,
      priorityRooms: ["any"],
      stopOnInjury: false,
      stopOnLowStamina: 30,
      stopOnLowSanity: 30,
    };
    expect(shouldStopForCrew(crew, rules)).toBeNull();
  });

  it("should stop for low stamina", () => {
    const crew: MockCrewState = { hp: 100, maxHp: 100, stamina: 25, sanity: 80 };
    const rules: AutoSalvageRules = {
      maxHazardLevel: 3,
      priorityRooms: ["any"],
      stopOnInjury: true,
      stopOnLowStamina: 30,
      stopOnLowSanity: 30,
    };
    expect(shouldStopForCrew(crew, rules)).toBe("crew_exhausted");
  });

  it("should stop for low sanity", () => {
    const crew: MockCrewState = { hp: 100, maxHp: 100, stamina: 80, sanity: 25 };
    const rules: AutoSalvageRules = {
      maxHazardLevel: 3,
      priorityRooms: ["any"],
      stopOnInjury: true,
      stopOnLowStamina: 30,
      stopOnLowSanity: 30,
    };
    expect(shouldStopForCrew(crew, rules)).toBe("crew_exhausted");
  });

  it("should allow continuation when stats above thresholds", () => {
    const crew: MockCrewState = { hp: 90, maxHp: 100, stamina: 80, sanity: 80 };
    const rules: AutoSalvageRules = {
      maxHazardLevel: 3,
      priorityRooms: ["any"],
      stopOnInjury: true,
      stopOnLowStamina: 30,
      stopOnLowSanity: 30,
    };
    expect(shouldStopForCrew(crew, rules)).toBeNull();
  });
});

describe("Auto-Salvage Edge Cases", () => {
  it("should handle rules with zero stamina threshold", () => {
    const rules: AutoSalvageRules = {
      maxHazardLevel: 3,
      priorityRooms: ["any"],
      stopOnInjury: false,
      stopOnLowStamina: 0,
      stopOnLowSanity: 0,
    };
    expect(validateRules(rules)).toBeNull();
  });

  it("should handle rules with max thresholds", () => {
    const rules: AutoSalvageRules = {
      maxHazardLevel: 5,
      priorityRooms: ["any"],
      stopOnInjury: false,
      stopOnLowStamina: 100,
      stopOnLowSanity: 100,
    };
    expect(validateRules(rules)).toBeNull();
  });

  it("should handle crew at exactly 50% HP with injury stop enabled", () => {
    const crew: MockCrewState = { hp: 50, maxHp: 100, stamina: 80, sanity: 80 };
    const rules: AutoSalvageRules = {
      maxHazardLevel: 3,
      priorityRooms: ["any"],
      stopOnInjury: true,
      stopOnLowStamina: 30,
      stopOnLowSanity: 30,
    };
    // Should not stop at exactly 50%, only below
    expect(shouldStopForCrew(crew, rules)).toBeNull();
  });

  it("should handle crew at exactly threshold values", () => {
    const crew: MockCrewState = { hp: 100, maxHp: 100, stamina: 30, sanity: 30 };
    const rules: AutoSalvageRules = {
      maxHazardLevel: 3,
      priorityRooms: ["any"],
      stopOnInjury: false,
      stopOnLowStamina: 30,
      stopOnLowSanity: 30,
    };
    // At exact threshold, should stop (<= triggers)
    expect(shouldStopForCrew(crew, rules)).toBe("crew_exhausted");
  });

  it("should handle crew with zero stats", () => {
    const crew: MockCrewState = { hp: 0, maxHp: 100, stamina: 0, sanity: 0 };
    const rules: AutoSalvageRules = {
      maxHazardLevel: 3,
      priorityRooms: ["any"],
      stopOnInjury: true,
      stopOnLowStamina: 10,
      stopOnLowSanity: 10,
    };
    expect(shouldStopForCrew(crew, rules)).toBeTruthy();
  });

  it("should handle maximum hazard level filter", () => {
    const rooms = [
      { id: "r1", name: "Room 1", hazardLevel: 5 },
      { id: "r2", name: "Room 2", hazardLevel: 5 },
    ];
    const result = findPriorityRoom(rooms, ["any"], 5);
    expect(result).toBeDefined();
    expect(result!.hazardLevel).toBe(5);
  });

  it("should handle single room with priority match", () => {
    const rooms = [{ id: "r1", name: "Cargo Bay", hazardLevel: 2 }];
    const result = findPriorityRoom(rooms, ["cargo"], 5);
    expect(result!.name).toBe("Cargo Bay");
  });

  it("should handle multiple priority types in order", () => {
    const rooms = [
      { id: "r1", name: "Cargo Bay", hazardLevel: 2 },
      { id: "r2", name: "Armory", hazardLevel: 3 },
      { id: "r3", name: "Labs", hazardLevel: 4 },
    ];
    // Should prioritize armory first
    const result = findPriorityRoom(rooms, ["armory", "cargo", "any"], 5);
    expect(result!.name).toBe("Armory");
  });

  function findPriorityRoom(
    rooms: Array<{ id: string; name: string; hazardLevel: number }>,
    priorities: AutoSalvageRules["priorityRooms"],
    maxHazard: number
  ) {
    const available = rooms.filter((r) => r.hazardLevel <= maxHazard);
    if (available.length === 0) return null;

    for (const priority of priorities) {
      if (priority === "any") return available[0];
      const match = available.find((r) => r.name.toLowerCase().includes(priority));
      if (match) return match;
    }
    return available[0];
  }

  interface MockCrewState {
    hp: number;
    maxHp: number;
    stamina: number;
    sanity: number;
  }

  function shouldStopForCrew(
    crew: MockCrewState,
    rules: AutoSalvageRules
  ): string | null {
    if (rules.stopOnInjury && crew.hp < crew.maxHp * 0.5) {
      return "injury";
    }
    if (crew.stamina <= rules.stopOnLowStamina) {
      return "crew_exhausted";
    }
    if (crew.sanity <= rules.stopOnLowSanity) {
      return "crew_exhausted";
    }
    return null;
  }
});

describe("Auto-Salvage Stress Tests", () => {
  it("should handle 100 consecutive rule validations", () => {
    for (let i = 0; i < 100; i++) {
      const rules: AutoSalvageRules = {
        maxHazardLevel: (i % 5) + 1,
        priorityRooms: ["any"],
        stopOnInjury: i % 2 === 0,
        stopOnLowStamina: i % 100,
        stopOnLowSanity: (i * 2) % 100,
      };
      expect(validateRules(rules)).toBeNull();
    }
  });

  it("should handle room prioritization with large room sets", () => {
    const rooms = Array.from({ length: 1000 }, (_, i) => ({
      id: `r${i}`,
      name: `Room ${i}`,
      hazardLevel: (i % 5) + 1,
    }));
    
    const startTime = Date.now();
    const result = findPriorityRoom(rooms, ["any"], 3);
    const elapsed = Date.now() - startTime;
    
    expect(result).toBeDefined();
    expect(elapsed).toBeLessThan(100); // Should be fast
  });

  it("should handle multiple crew state checks in succession", () => {
    const crew: MockCrewState = { hp: 80, maxHp: 100, stamina: 60, sanity: 70 };
    const rules: AutoSalvageRules = {
      maxHazardLevel: 3,
      priorityRooms: ["any"],
      stopOnInjury: true,
      stopOnLowStamina: 30,
      stopOnLowSanity: 30,
    };

    // Simulate checking 1000 times (like during auto-salvage loop)
    for (let i = 0; i < 1000; i++) {
      const result = shouldStopForCrew(crew, rules);
      expect(result).toBeNull();
    }
  });

  it("should handle rapid preset switching", () => {
    for (let i = 0; i < 100; i++) {
      const preset = PRESETS[i % PRESETS.length];
      expect(preset.name).toBeDefined();
      expect(validateRules(preset.rules)).toBeNull();
    }
  });

  function findPriorityRoom(
    rooms: Array<{ id: string; name: string; hazardLevel: number }>,
    priorities: AutoSalvageRules["priorityRooms"],
    maxHazard: number
  ) {
    const available = rooms.filter((r) => r.hazardLevel <= maxHazard);
    if (available.length === 0) return null;

    for (const priority of priorities) {
      if (priority === "any") return available[0];
      const match = available.find((r) => r.name.toLowerCase().includes(priority));
      if (match) return match;
    }
    return available[0];
  }

  interface MockCrewState {
    hp: number;
    maxHp: number;
    stamina: number;
    sanity: number;
  }

  function shouldStopForCrew(
    crew: MockCrewState,
    rules: AutoSalvageRules
  ): string | null {
    if (rules.stopOnInjury && crew.hp < crew.maxHp * 0.5) {
      return "injury";
    }
    if (crew.stamina <= rules.stopOnLowStamina) {
      return "crew_exhausted";
    }
    if (crew.sanity <= rules.stopOnLowSanity) {
      return "crew_exhausted";
    }
    return null;
  }
});

describe("Auto-Salvage Long-Term Stability", () => {
  it("should simulate degrading crew stats over time", () => {
    let crew: MockCrewState = { hp: 100, maxHp: 100, stamina: 100, sanity: 100 };
    const rules: AutoSalvageRules = {
      maxHazardLevel: 3,
      priorityRooms: ["any"],
      stopOnInjury: true,
      stopOnLowStamina: 30,
      stopOnLowSanity: 30,
    };

    let stopReason: string | null = null;
    let iterations = 0;

    // Simulate salvaging until stop condition
    while (!stopReason && iterations < 100) {
      crew.stamina -= 5; // Simulate stamina drain
      crew.sanity -= 3; // Simulate sanity loss
      
      if (iterations % 10 === 0) {
        crew.hp -= 5; // Occasional damage
      }

      stopReason = shouldStopForCrew(crew, rules);
      iterations++;
    }

    expect(stopReason).toBeTruthy();
    expect(iterations).toBeGreaterThan(0);
    expect(iterations).toBeLessThan(100);
  });

  it("should handle multiple salvage runs with state persistence", () => {
    const runs = 10;
    const results: string[] = [];

    for (let run = 0; run < runs; run++) {
      let crew: MockCrewState = { hp: 100, maxHp: 100, stamina: 100, sanity: 100 };
      const rules: AutoSalvageRules = {
        maxHazardLevel: 3,
        priorityRooms: ["any"],
        stopOnInjury: true,
        stopOnLowStamina: 30,
        stopOnLowSanity: 30,
      };

      let roomsSalvaged = 0;
      while (crew.stamina > rules.stopOnLowStamina && roomsSalvaged < 20) {
        crew.stamina -= 5;
        crew.sanity -= 2;
        roomsSalvaged++;
      }

      results.push(`Run ${run}: ${roomsSalvaged} rooms`);
    }

    expect(results).toHaveLength(runs);
  });

  it("should handle extreme stat degradation scenarios", () => {
    const scenarios = [
      { hp: 100, stamina: 5, sanity: 100, expected: "crew_exhausted" },
      { hp: 100, stamina: 100, sanity: 5, expected: "crew_exhausted" },
      { hp: 45, stamina: 100, sanity: 100, expected: "injury" },
      { hp: 5, stamina: 5, sanity: 5, expected: "injury" }, // HP checked first
    ];

    const rules: AutoSalvageRules = {
      maxHazardLevel: 3,
      priorityRooms: ["any"],
      stopOnInjury: true,
      stopOnLowStamina: 30,
      stopOnLowSanity: 30,
    };

    for (const scenario of scenarios) {
      const crew: MockCrewState = {
        hp: scenario.hp,
        maxHp: 100,
        stamina: scenario.stamina,
        sanity: scenario.sanity,
      };
      const result = shouldStopForCrew(crew, rules);
      expect(result).toBe(scenario.expected);
    }
  });

  interface MockCrewState {
    hp: number;
    maxHp: number;
    stamina: number;
    sanity: number;
  }

  function shouldStopForCrew(
    crew: MockCrewState,
    rules: AutoSalvageRules
  ): string | null {
    if (rules.stopOnInjury && crew.hp < crew.maxHp * 0.5) {
      return "injury";
    }
    if (crew.stamina <= rules.stopOnLowStamina) {
      return "crew_exhausted";
    }
    if (crew.sanity <= rules.stopOnLowSanity) {
      return "crew_exhausted";
    }
    return null;
  }
});

describe("Auto-Salvage Stress Tests", () => {
  it("should handle 100 consecutive rule validations", () => {
    for (let i = 0; i < 100; i++) {
      const rules: AutoSalvageRules = {
        maxHazardLevel: (i % 5) + 1,
        priorityRooms: ["any"],
        stopOnInjury: i % 2 === 0,
        stopOnLowStamina: i % 100,
        stopOnLowSanity: (i * 2) % 100,
      };
      expect(validateRules(rules)).toBeNull();
    }
  });

  it("should handle room prioritization with large room sets", () => {
    const rooms = Array.from({ length: 1000 }, (_, i) => ({
      id: `r${i}`,
      name: `Room ${i}`,
      hazardLevel: (i % 5) + 1,
    }));
    
    function findPriorityRoom(
      rooms: Array<{ id: string; name: string; hazardLevel: number }>,
      priorities: AutoSalvageRules["priorityRooms"],
      maxHazard: number
    ) {
      const available = rooms.filter((r) => r.hazardLevel <= maxHazard);
      if (available.length === 0) return null;
      for (const priority of priorities) {
        if (priority === "any") return available[0];
        const match = available.find((r) => r.name.toLowerCase().includes(priority));
        if (match) return match;
      }
      return available[0];
    }
    
    const startTime = Date.now();
    const result = findPriorityRoom(rooms, ["any"], 3);
    const elapsed = Date.now() - startTime;
    
    expect(result).toBeDefined();
    expect(elapsed).toBeLessThan(100); // Should be fast
  });

  it("should handle multiple crew state checks in succession", () => {
    interface MockCrewState {
      hp: number;
      maxHp: number;
      stamina: number;
      sanity: number;
    }

    function shouldStopForCrew(
      crew: MockCrewState,
      rules: AutoSalvageRules
    ): string | null {
      if (rules.stopOnInjury && crew.hp < crew.maxHp * 0.5) {
        return "injury";
      }
      if (crew.stamina <= rules.stopOnLowStamina) {
        return "crew_exhausted";
      }
      if (crew.sanity <= rules.stopOnLowSanity) {
        return "crew_exhausted";
      }
      return null;
    }

    const crew: MockCrewState = { hp: 80, maxHp: 100, stamina: 60, sanity: 70 };
    const rules: AutoSalvageRules = {
      maxHazardLevel: 3,
      priorityRooms: ["any"],
      stopOnInjury: true,
      stopOnLowStamina: 30,
      stopOnLowSanity: 30,
    };

    // Simulate checking 1000 times (like during auto-salvage loop)
    for (let i = 0; i < 1000; i++) {
      const result = shouldStopForCrew(crew, rules);
      expect(result).toBeNull();
    }
  });

  it("should handle rapid preset switching", () => {
    for (let i = 0; i < 100; i++) {
      const preset = PRESETS[i % PRESETS.length];
      expect(preset.name).toBeDefined();
      expect(validateRules(preset.rules)).toBeNull();
    }
  });
});

describe("Auto-Salvage Long-Term Stability", () => {
  interface MockCrewState {
    hp: number;
    maxHp: number;
    stamina: number;
    sanity: number;
  }

  function shouldStopForCrew(
    crew: MockCrewState,
    rules: AutoSalvageRules
  ): string | null {
    if (rules.stopOnInjury && crew.hp < crew.maxHp * 0.5) {
      return "injury";
    }
    if (crew.stamina <= rules.stopOnLowStamina) {
      return "crew_exhausted";
    }
    if (crew.sanity <= rules.stopOnLowSanity) {
      return "crew_exhausted";
    }
    return null;
  }

  it("should simulate degrading crew stats over time", () => {
    let crew: MockCrewState = { hp: 100, maxHp: 100, stamina: 100, sanity: 100 };
    const rules: AutoSalvageRules = {
      maxHazardLevel: 3,
      priorityRooms: ["any"],
      stopOnInjury: true,
      stopOnLowStamina: 30,
      stopOnLowSanity: 30,
    };

    let stopReason: string | null = null;
    let iterations = 0;

    // Simulate salvaging until stop condition
    while (!stopReason && iterations < 100) {
      crew.stamina -= 5; // Simulate stamina drain
      crew.sanity -= 3; // Simulate sanity loss
      
      if (iterations % 10 === 0) {
        crew.hp -= 5; // Occasional damage
      }

      stopReason = shouldStopForCrew(crew, rules);
      iterations++;
    }

    expect(stopReason).toBeTruthy();
    expect(iterations).toBeGreaterThan(0);
    expect(iterations).toBeLessThan(100);
  });

  it("should handle multiple salvage runs with state persistence", () => {
    const runs = 10;
    const results: string[] = [];

    for (let run = 0; run < runs; run++) {
      let crew: MockCrewState = { hp: 100, maxHp: 100, stamina: 100, sanity: 100 };
      const rules: AutoSalvageRules = {
        maxHazardLevel: 3,
        priorityRooms: ["any"],
        stopOnInjury: true,
        stopOnLowStamina: 30,
        stopOnLowSanity: 30,
      };

      let roomsSalvaged = 0;
      while (crew.stamina > rules.stopOnLowStamina && roomsSalvaged < 20) {
        crew.stamina -= 5;
        crew.sanity -= 2;
        roomsSalvaged++;
      }

      results.push(`Run ${run}: ${roomsSalvaged} rooms`);
    }

    expect(results).toHaveLength(runs);
  });

  it("should handle extreme stat degradation scenarios", () => {
    const scenarios = [
      { hp: 100, stamina: 5, sanity: 100, expected: "crew_exhausted" },
      { hp: 100, stamina: 100, sanity: 5, expected: "crew_exhausted" },
      { hp: 45, stamina: 100, sanity: 100, expected: "injury" },
      { hp: 5, stamina: 5, sanity: 5, expected: "injury" }, // HP checked first
    ];

    const rules: AutoSalvageRules = {
      maxHazardLevel: 3,
      priorityRooms: ["any"],
      stopOnInjury: true,
      stopOnLowStamina: 30,
      stopOnLowSanity: 30,
    };

    for (const scenario of scenarios) {
      const crew: MockCrewState = {
        hp: scenario.hp,
        maxHp: 100,
        stamina: scenario.stamina,
        sanity: scenario.sanity,
      };
      const result = shouldStopForCrew(crew, rules);
      expect(result).toBe(scenario.expected);
    }
  });
});
