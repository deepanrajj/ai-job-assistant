import type { FC } from 'react';

import { AnalysisSkeleton } from './AnalysisSkeleton';
import { AskJob } from '../askJob';
import { SectionCard } from '../../components/sectionCard/SectionCard';
import { SeniorityBadge } from '../../components/seniorityBadge/SeniorityBadge';
import { BulletList } from '../../components/ui';
import { useTranslation } from '../../i18n';
import type { TAnalysisStatus } from './analyzeJob.types';
import type { TJobAiAnalysis } from '../../types';

/**
 * Props used by the AI analysis result panel.
 */
interface IAnalysisPanelProps {
  analysis: TJobAiAnalysis | null;
  description: string;
  status: TAnalysisStatus;
}

/**
 * Renders the AI analysis results, loading placeholder, or empty state.
 *
 * @param {IAnalysisPanelProps} props Component props.
 * @param {TJobAiAnalysis | null} props.analysis Current analysis result.
 * @param {string} props.description Job description context for follow-up questions.
 * @param {TAnalysisStatus} props.status Current analysis request status.
 * @returns {JSX.Element} Analysis result panel.
 */
export const AnalysisPanel: FC<IAnalysisPanelProps> = ({ analysis, description, status }) => {
  const { t } = useTranslation();

  if (status === 'loading')
    return (
      <section aria-label={t('ai.loadingAnalysis')} className="space-y-4" role="status">
        <AnalysisSkeleton />
      </section>
    );

  if (status === 'error' && !analysis) return <section className="space-y-4" />;

  if (!analysis)
    return (
      <section className="space-y-4">
        <SectionCard title={t('ai.analysisTitle')}>
          <p className="text-app-textMuted">{t('ai.emptyAnalysis')}</p>
        </SectionCard>
      </section>
    );

  return (
    <section className="space-y-4">
      <SectionCard title={t('ai.summary')}>
        <p className="text-app-textSoft">{analysis.summary}</p>
      </SectionCard>

      <SectionCard title={t('ai.requiredSkills')}>
        <BulletList items={analysis.requiredSkills} />
      </SectionCard>

      <SectionCard title={t('ai.niceToHaveSkills')}>
        <BulletList items={analysis.niceToHaveSkills} />
      </SectionCard>

      <SectionCard title={t('ai.seniority')}>
        <SeniorityBadge seniority={analysis.seniority} />
      </SectionCard>

      <SectionCard title={t('ai.preparationTasks')}>
        <BulletList items={analysis.prepTasks} markerClassName="bg-emerald-400" />
      </SectionCard>

      <SectionCard title={t('ai.askTitle')}>
        <AskJob description={description} />
      </SectionCard>
    </section>
  );
};
