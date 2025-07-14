import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Extend expect with jest-dom matchers
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock fetch
global.fetch = vi.fn();

// Mock FormData
global.FormData = vi.fn(() => ({
  append: vi.fn(),
  get: vi.fn(),
  getAll: vi.fn(),
  has: vi.fn(),
  delete: vi.fn(),
  forEach: vi.fn(),
  set: vi.fn(),
  entries: vi.fn(),
  keys: vi.fn(),
  values: vi.fn(),
})); 