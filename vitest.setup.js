// vitest.setup.js
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with testing-library matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Firebase if needed
vi.mock('firebase/firebase', () => ({
  default: {
    auth: () => ({}),
    firestore: () => ({}),
  },
}));
