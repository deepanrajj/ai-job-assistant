/**
 * TEMPORARY - remove when the task 041 backend lands.
 *
 * False in built images (`production` mode), where the document endpoints
 * do not exist yet: the Documents tab is left out, the Applications page
 * stays "coming soon", and no document request is made. True in the dev
 * server, where `USE_MOCK_DOCUMENTS` stands in for the endpoints, and under
 * Vitest, so the feature stays tested.
 */
export const DOCUMENTS_FEATURE_ENABLED = import.meta.env.MODE !== 'production';
