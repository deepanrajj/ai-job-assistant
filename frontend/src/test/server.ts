import { setupServer } from 'msw/node';

import { handlers } from './handlers';

/**
 * Shared MSW server used by tests that exercise API-backed behavior.
 */
export const server = setupServer(...handlers);
