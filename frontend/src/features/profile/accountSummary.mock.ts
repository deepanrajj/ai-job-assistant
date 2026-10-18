/*
 * TEMPORARY MOCK - remove when an account source exists.
 *
 * The Profile page's account summary card follows the design, but the
 * app has no accounts yet: no name, headline, location, or avatar is
 * stored anywhere (task 090, owner decision). This one module holds the
 * stand-in, and the card says "Sample data", so it is never taken for
 * stored data. To remove it, replace `MOCK_ACCOUNT_SUMMARY` with the real
 * source, or delete the card and this file.
 */

/**
 * What the account summary card shows.
 */
export interface IAccountSummary {
  headline: string;
  location: string;
  name: string;
  tags: string[];
}

/**
 * The sample account shown until accounts exist.
 */
export const MOCK_ACCOUNT_SUMMARY: IAccountSummary = {
  headline: 'Full-stack Engineer',
  location: 'Berlin, Germany',
  name: 'Jordan Davis',
  tags: ['Full-stack Engineer', 'Backend Engineer', 'Remote friendly'],
};
