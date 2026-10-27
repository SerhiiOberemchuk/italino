import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
Object.defineProperty(window, "matchMedia", { writable: true, value: vi.fn((query: string) => ({
  matches: false, media: query, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(),
  addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
})) });
class ResizeObserverMock { observe() {} unobserve() {} disconnect() {} }
Object.defineProperty(globalThis, "ResizeObserver", { configurable: true, writable: true, value: ResizeObserverMock });
if (!window.PointerEvent) window.PointerEvent = MouseEvent as typeof PointerEvent;
HTMLElement.prototype.scrollIntoView = vi.fn();
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); sessionStorage.clear(); });
