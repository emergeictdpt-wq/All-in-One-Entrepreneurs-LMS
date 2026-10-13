import { webcrypto } from "node:crypto";
// jsdom has no crypto.subtle; Node's WebCrypto stands in for the browser's.
if (!globalThis.crypto?.subtle) Object.defineProperty(globalThis, "crypto", { value: webcrypto });
window.scrollTo = () => {};
Element.prototype.scrollIntoView = () => {};
(globalThis as any).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
(globalThis as any).matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
