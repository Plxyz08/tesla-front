// Polyfill para setImmediate
if (typeof setImmediate === 'undefined') {
    (global as any).setImmediate = (callback: () => void) => setTimeout(callback, 0);
  }