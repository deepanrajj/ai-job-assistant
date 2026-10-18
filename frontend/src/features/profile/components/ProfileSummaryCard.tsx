import type { FC } from 'react';

import { Card } from '../../../components/ui';
import { useTranslation } from '../../../i18n';
import type { IAccountSummary } from '../accountSummary.mock';

/**
 * Props used by the account summary card.
 */
interface IProfileSummaryCardProps {
  account: IAccountSummary;
}

/**
 * Returns up to two initials for the avatar, such as "JD".
 *
 * @param {string} name Full name.
 * @returns {string} Initials.
 */
const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

/**
 * The account summary at the top of the Profile page: an initials avatar,
 * the name, the headline and location, and a few tags. It shows sample
 * data until accounts exist, and says so in words; see
 * `accountSummary.mock.ts`.
 *
 * @param {IProfileSummaryCardProps} props Component props.
 * @returns {JSX.Element} Account summary card.
 */
export const ProfileSummaryCard: FC<IProfileSummaryCardProps> = ({ account }) => {
  const { t } = useTranslation();

  return (
    <section aria-label={t('profile.account.label')}>
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span
            aria-hidden="true"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-100 font-display text-xl font-semibold text-primary-700"
          >
            {getInitials(account.name)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="break-words font-display text-xl font-semibold text-app-text">
                {account.name}
              </h2>
              <span className="rounded-full bg-warning-100 px-2 py-0.5 text-xs font-medium text-warning-800">
                {t('profile.account.sampleData')}
              </span>
            </div>
            <p className="mt-0.5 break-words text-sm text-app-textMuted">
              {account.headline} · {account.location}
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {account.tags.map((tag) => (
                <li
                  className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-800"
                  key={tag}
                >
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </section>
  );
};
