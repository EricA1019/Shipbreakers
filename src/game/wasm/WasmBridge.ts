import type { ShipLayout } from "../../types";

type WasmModule = {
  default?: (module_or_path?: unknown) => Promise<unknown>;
  generate_wreck?: (tier: number, mass: string, seed: string) => any;
  generate_ship_name?: (seed: string) => string;
};

class WasmBridge {
  private module: WasmModule | null = null;
  private initialized = false;
  public fallback = false;

  async init() {
    if (this.initialized) return;
    this.initialized = true;
    try {
      // Dynamically import the wasm pkg if it exists
      // This will work after running `npm run build:wasm` which places pkg in game-logic/pkg
      // The path may vary depending on build output; adjust if necessary
      // Attempt dynamic import without letting bundler statically analyze the path
      try {
        const mod = await import("../../../game-logic/pkg/game_logic.js").catch(
          () => null,
        );
        const loaded = (mod as WasmModule) || null;
        if (loaded?.default && typeof loaded.default === "function") {
          await loaded.default();
        }
        this.module = loaded;
      } catch (err) {
        this.module = null;
      }
      // quick smoke test
      if (this.module && typeof this.module.generate_ship_name === "function") {
        // WASM module loaded successfully
      } else {
        console.warn("[WASM] Module loaded but functions missing");
        this.fallback = true;
      }
    } catch (err) {
      console.warn(
        "[WASM] Failed to load module, falling back to TypeScript implementation",
        err,
      );
      this.fallback = true;
    }
  }

  async generateShipName(wreckId: string): Promise<string> {
    await this.init();
    if (this.fallback || !this.module || !this.module.generate_ship_name)
      return `Wreck ${wreckId.slice(-4).toUpperCase()}`;
    try {
      return (this.module.generate_ship_name as any)(wreckId);
    } catch (e) {
      console.warn("WASM generate_ship_name failed", e);
      return `Wreck ${wreckId.slice(-4).toUpperCase()}`;
    }
  }

  async generateWreck(
    tier: number,
    mass: string,
    seed: string,
  ): Promise<any | null> {
    await this.init();
    if (this.fallback || !this.module || !this.module.generate_wreck)
      return null;
    try {
      return (this.module.generate_wreck as any)(tier, mass, seed);
    } catch (e) {
      console.warn("WASM generate_wreck failed", e);
      return null;
    }
  }

  async generateShopStock(
    daySeed: number,
    licenseTier: number,
  ): Promise<any[]> {
    await this.init();
    if (
      !this.fallback &&
      this.module &&
      (this.module as any).generate_shop_stock
    ) {
      try {
        return (this.module as any).generate_shop_stock(daySeed, licenseTier);
      } catch (e) {
        console.warn("WASM generate_shop_stock failed", e);
      }
    }
    // Fallback TypeScript generator
    return this.generateShopStockFallback(daySeed, licenseTier);
  }

  // TypeScript fallback generator for shop stock
  async generateShopStockFallback(
    daySeed: number,
    licenseTier: number,
  ): Promise<any[]> {
    // Lazy import to avoid circular deps at module load
    const { getAllEquipment } = await import("../data/equipment");
    const { SHOP_STOCK_SIZE } = await import("../constants");
    const all = getAllEquipment();
    // Deterministic pseudo-random selection based on seed
    const chosen: any[] = [];
    let idx = daySeed % all.length;
    while (chosen.length < SHOP_STOCK_SIZE) {
      const candidate = all[idx % all.length];
      // bias to license tier: prefer items with tier <= licenseTier+1
      if (candidate.tier && candidate.tier <= Math.max(1, licenseTier + 1))
        chosen.push(candidate);
      idx += 1 + ((daySeed + chosen.length) % 7);
      // safety
      if (idx > daySeed + all.length * 3) break;
    }
    return chosen.slice(0, SHOP_STOCK_SIZE);
  }

  /**
   * Generate ship layout synchronously (always uses TypeScript fallback for reliability)
   * Layouts must fit within ship dimensions from Ship.sizeByMass:
   * - small: 2x2, medium: 3x2, large: 3x3, massive: 4x3
   */
  generateShipLayoutSync(_seed: string, template: string): ShipLayout {
    const rooms: ShipLayout["rooms"] = [];
    const t = template.toLowerCase();

    if (t.includes("l-") || t.includes("military")) {
      // L-shaped military wreck (fits 2x2 small)
      rooms.push({ x: 0, y: 0, w: 1, h: 1, kind: "armory" });
      rooms.push({ x: 0, y: 1, w: 1, h: 1, kind: "cargo" });
      rooms.push({ x: 1, y: 1, w: 1, h: 1, kind: "bridge" });
    } else if (t.includes("cross") || t.includes("science")) {
      // Cross-shaped science wreck (fits 3x3 large)
      rooms.push({ x: 1, y: 0, w: 1, h: 1, kind: "labs" });
      rooms.push({ x: 0, y: 1, w: 1, h: 1, kind: "corridor" });
      rooms.push({ x: 1, y: 1, w: 1, h: 1, kind: "bridge" });
      rooms.push({ x: 2, y: 1, w: 1, h: 1, kind: "corridor" });
      rooms.push({ x: 1, y: 2, w: 1, h: 1, kind: "medbay" });
    } else if (t.includes("u-") || t.includes("industrial")) {
      // U-shaped industrial wreck (fits 3x3 large)
      rooms.push({ x: 0, y: 0, w: 1, h: 1, kind: "cargo" });
      rooms.push({ x: 2, y: 0, w: 1, h: 1, kind: "cargo" });
      rooms.push({ x: 0, y: 1, w: 1, h: 1, kind: "workshop" });
      rooms.push({ x: 2, y: 1, w: 1, h: 1, kind: "engine" });
      rooms.push({ x: 0, y: 2, w: 1, h: 1, kind: "bridge" });
      rooms.push({ x: 1, y: 2, w: 1, h: 1, kind: "corridor" });
      rooms.push({ x: 2, y: 2, w: 1, h: 1, kind: "cargo" });
    } else if (t.includes("h-") || t.includes("luxury")) {
      // H-shaped luxury wreck (fits 3x3 large)
      rooms.push({ x: 0, y: 0, w: 1, h: 1, kind: "salon" });
      rooms.push({ x: 2, y: 0, w: 1, h: 1, kind: "lounge" });
      rooms.push({ x: 0, y: 1, w: 1, h: 1, kind: "corridor" });
      rooms.push({ x: 1, y: 1, w: 1, h: 1, kind: "bridge" });
      rooms.push({ x: 2, y: 1, w: 1, h: 1, kind: "corridor" });
      rooms.push({ x: 0, y: 2, w: 1, h: 1, kind: "salon" });
      rooms.push({ x: 2, y: 2, w: 1, h: 1, kind: "cargo" });
    } else if (t.includes("t-") || t.includes("freighter")) {
      // T-shaped freighter wreck (fits 3x2 medium)
      rooms.push({ x: 0, y: 0, w: 1, h: 1, kind: "cargo" });
      rooms.push({ x: 1, y: 0, w: 1, h: 1, kind: "bridge" });
      rooms.push({ x: 2, y: 0, w: 1, h: 1, kind: "cargo" });
      rooms.push({ x: 1, y: 1, w: 1, h: 1, kind: "engine" });
    } else {
      // Default rectangular layout (fits 2x2)
      rooms.push({ x: 0, y: 0, w: 1, h: 1, kind: "bridge" });
      rooms.push({ x: 1, y: 0, w: 1, h: 1, kind: "cargo" });
      rooms.push({ x: 0, y: 1, w: 1, h: 1, kind: "cargo" });
      rooms.push({ x: 1, y: 1, w: 1, h: 1, kind: "engine" });
    }
    return { template, rooms };
  }

  /**
   * Generate ship layout, using WASM if available, otherwise TypeScript fallback
   */
  async generateShipLayout(
    seed: string,
    template: string,
  ): Promise<ShipLayout> {
    await this.init();
    if (
      !this.fallback &&
      this.module &&
      (this.module as any).generate_ship_layout
    ) {
      try {
        return (this.module as any).generate_ship_layout(
          seed,
          template,
        ) as ShipLayout;
      } catch (e) {
        console.warn("WASM generate_ship_layout failed", e);
      }
    }
    return this.generateShipLayoutSync(seed, template);
  }
}

export const wasmBridge = new WasmBridge();
export default wasmBridge;
