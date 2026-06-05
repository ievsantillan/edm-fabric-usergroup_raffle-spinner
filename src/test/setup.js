// Vitest setup: runs once per test file. Resets localStorage between tests
// so useRaffle's persistence layer doesn't leak state across cases.
import { afterEach } from 'vitest';

afterEach(() => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.clear();
  }
});
