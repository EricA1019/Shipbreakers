import { vi } from "vitest";

// Silence jsdom HTMLMediaElement play warnings
if (typeof window !== "undefined") {
  const proto = (window.HTMLMediaElement as any)?.prototype;
  if (proto && !proto.play._isMockFunction) {
    proto.play = vi.fn().mockResolvedValue(undefined);
  }
}

// Reduce console.warn noise from icon fallback during tests
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  const msg = args?.[0];
  if (typeof msg === "string" && msg.startsWith("Icon not found")) {
    return;
  }
  return originalWarn(...args);
};
