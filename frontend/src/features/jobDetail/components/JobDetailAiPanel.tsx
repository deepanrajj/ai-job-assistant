import { memo, type FC } from 'react';

import { Alert, BulletList, Button, Card } from '../../../components/ui';
import { AnalysisSkeleton } from '../../analyzeJob/AnalysisSkeleton';
import { AskJob } from '../../askJob';
import { analyzeJobDescription } from '../../../services';
import { useAsyncMutation } from '../../../hooks';
import { useTranslation } from '../../../i18n';
import type { TJobAiAnalysis, TJobDetail } from '../../../types';

/**
 * Props used by the job detail AI panel.
 */
interface IJobDetailAiPanelProps {
  job: TJobDetail;
  onAnalyzeJob?: (analysis: TJobAiAnalysis) => void;
}

/**
 * Renders saved AI insights for a job.
 *
 * @param {IJobDetailAiPanelProps} props Component props.
 * @returns {JSX.Element} Job AI panel.
 */
const JobDetailAiPanelComponent: FC<IJobDetailAiPanelProps> = ({ job, onAnalyzeJob }) => {
  const { t } = useTranslation();
  const { mutate: analyzeJob, request } = useAsyncMutation(analyzeJobDescription);
  const hasSavedInsights = Boolean(
    job.aiInsights.summary || job.aiInsights.strengths.length || job.aiInsights.gaps.length,
  );

  const handleAnalyzeJob = async () => {
    try {
      const analysis = await analyzeJob({
        description: job.description,
      });
      onAnalyzeJob?.(analysis);
    } catch {
      // Error alert is rendered from useAsyncMutation request state.
    }
  };

  return (
    <div className="space-y-6">
      <Card
        action={
          <Button
            aria-busy={request.isLoading}
            disabled={request.isLoading || !job.description.trim()}
            onClick={handleAnalyzeJob}
            size="sm"
          >
            {request.isLoading ? t('ai.analyzing') : t('jobDetail.ai.analyzeSavedJob')}
          </Button>
        }
        subtitle={t('jobDetail.ai.analysisSubtitle')}
        title={t('jobDetail.ai.analysisTitle')}
      >
        {request.error && <Alert className="mb-4">{request.error.message}</Alert>}
        {request.isLoading && (
          <section aria-label={t('ai.loadingAnalysis')} className="space-y-4" role="status">
            <AnalysisSkeleton />
          </section>
        )}
        {!request.isLoading && !hasSavedInsights && (
          <p className="text-sm leading-7 text-app-textMuted">{t('jobDetail.ai.emptyInsights')}</p>
        )}
        {!request.isLoading && hasSavedInsights && (
          <p className="text-sm leading-7 text-app-textSoft">{job.aiInsights.summary}</p>
        )}
      </Card>

      {hasSavedInsights && !request.isLoading && (
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card title={t('jobDetail.ai.strengths')}>
            <BulletList items={job.aiInsights.strengths} />
          </Card>

          <Card title={t('jobDetail.ai.gaps')}>
            <BulletList items={job.aiInsights.gaps} markerClassName="bg-warning-800" />
          </Card>
        </div>
      )}

      <Card title={t('ai.askTitle')}>
        <AskJob description={job.description} />
      </Card>
    </div>
  );
};

export const JobDetailAiPanel = memo(JobDetailAiPanelComponent);
