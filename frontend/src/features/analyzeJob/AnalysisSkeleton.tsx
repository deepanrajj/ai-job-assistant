import type { FC } from 'react';

import { SectionCard } from '../../components/sectionCard/SectionCard';
import { useTranslation } from '../../i18n';

/**
 * Renders repeated loading lines used inside skeleton cards.
 *
 * @returns {JSX.Element} Loading line skeleton.
 */
const ListSkeleton: FC = () => (
  <div className="space-y-3">
    <div className="h-4 animate-pulse rounded bg-app-surface2" />
    <div className="h-4 animate-pulse rounded bg-app-surface2" />
    <div className="h-4 animate-pulse rounded bg-app-surface2" />
  </div>
);

/**
 * Renders the loading placeholder shown while the AI analysis is running.
 *
 * @returns {JSX.Element} Analysis loading skeleton.
 */
export const AnalysisSkeleton: FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <SectionCard title={t('ai.summary')}>
        <div className="h-20 animate-pulse rounded-lg bg-app-surface2" />
      </SectionCard>

      <SectionCard title={t('ai.requiredSkills')}>
        <ListSkeleton />
      </SectionCard>

      <SectionCard title={t('ai.preparationTasks')}>
        <ListSkeleton />
      </SectionCard>
    </>
  );
};
