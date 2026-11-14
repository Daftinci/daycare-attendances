import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { resetMockStore } from '../api/mock/server.js';

afterEach(() => {
  cleanup();
  resetMockStore();
});
