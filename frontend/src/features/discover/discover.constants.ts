/**
 * TEMPORARY - remove when the task 046 backend lands.
 *
 * False in built images (`production` mode), where `/api/saved-searches`
 * does not exist yet: Discover stays "coming soon" and no request is made.
 * True in the dev server, where `USE_MOCK_SAVED_SEARCHES` stands in for
 * the endpoints, and under Vitest, so the feature stays tested.
 */
export const SAVED_SEARCHES_FEATURE_ENABLED = import.meta.env.MODE !== 'production';
