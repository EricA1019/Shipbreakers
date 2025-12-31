type WasmModule = {
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
        // Use Function to avoid static analysis by bundlers
        // eslint-disable-next-line no-new-func
        const dynamicImport = new Function('p', 'return import(p)');
        const mod = await (dynamicImport('../../../game-logic/pkg') as Promise<any>).catch(() => null);
        this.module = (mod as WasmModule) || null;
      } catch (err) {
        this.module = null;
      }
      // quick smoke test
      if (this.module && typeof (this.module.generate_ship_name) === 'function') {
        console.log('[WASM] Module loaded');
      } else {
        console.warn('[WASM] Module loaded but functions missing');
        this.fallback = true;
      }
    } catch (err) {
      console.warn('[WASM] Failed to load module, falling back to TypeScript implementation', err);
      this.fallback = true;
    }
  }

  async generateShipName(wreckId: string): Promise<string> {
    await this.init();
    if (this.fallback || !this.module || !this.module.generate_ship_name) return `Wreck ${wreckId.slice(-4).toUpperCase()}`;
    try {
      return (this.module.generate_ship_name as any)(wreckId);
    } catch (e) {
      console.warn('WASM generate_ship_name failed', e);
      return `Wreck ${wreckId.slice(-4).toUpperCase()}`;
    }
  }

  async generateWreck(tier: number, mass: string, seed: string): Promise<any | null> {
    await this.init();
    if (this.fallback || !this.module || !this.module.generate_wreck) return null;
    try {
      return (this.module.generate_wreck as any)(tier, mass, seed);
    } catch (e) {
      console.warn('WASM generate_wreck failed', e);
      return null;
    }
  }
}

export const wasmBridge = new WasmBridge();
export default wasmBridge;
