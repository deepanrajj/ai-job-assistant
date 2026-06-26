import { useState, type FC } from 'react';

import { Button } from '../../../components/ui';
import { JobDetailActivePanel } from './JobDetailActivePanel';
import { useTranslation } from '../../../i18n';
import { classNames } from '../../../utils';
import { getJobDetailPanelId, getJobDetailTabId } from '../jobDetail.utils';
import {
  activeJobDetailTabButtonClassName,
  inactiveJobDetailTabButtonClassName,
  jobDetailTabButtonClassName,
  jobDetailTabs,
} from '../jobDetail.constants';
import type { TJobDetail, TJobDetailTab } from '../../../types';
import type { IJobDetailPageActions } from '../jobDetail.types';

/**
 * Props used by the job detail tabs.
 */
interface IJobDetailTabsProps extends Omit<
  IJobDetailPageActions,
  'onDeleteJob' | 'onStatusChange'
> {
  job: TJobDetail;
}

/**
 * Renders accessible tabs for the job detail sections.
 *
 * @param {IJobDetailTabsProps} props Component props.
 * @returns {JSX.Element} Job detail tab navigation and active panel.
 */
export const JobDetailTabs: FC<IJobDetailTabsProps> = ({
  job,
  onAnalyzeJob,
  onCreateNote,
  onCreateTask,
  onDeleteNote,
  onDeleteTask,
  onUpdateNote,
  onUpdateTask,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TJobDetailTab>('overview');

  return (
    <section className="space-y-4">
      <div
        aria-label={t('jobDetail.tabs.label')}
        className="flex gap-2 overflow-x-auto border-b border-app-border pb-2"
        role="tablist"
      >
        {jobDetailTabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <Button
              aria-controls={getJobDetailPanelId(tab.id)}
              aria-selected={isActive}
              className={classNames(
                jobDetailTabButtonClassName,
                isActive ? activeJobDetailTabButtonClassName : inactiveJobDetailTabButtonClassName,
              )}
              id={getJobDetailTabId(tab.id)}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              size="sm"
              variant="ghost"
            >
              {t(tab.labelKey)}
            </Button>
          );
        })}
      </div>

      <div
        aria-labelledby={getJobDetailTabId(activeTab)}
        id={getJobDetailPanelId(activeTab)}
        role="tabpanel"
        tabIndex={0}
      >
        <JobDetailActivePanel
          activeTab={activeTab}
          job={job}
          onAnalyzeJob={onAnalyzeJob}
          onCreateNote={onCreateNote}
          onCreateTask={onCreateTask}
          onDeleteNote={onDeleteNote}
          onDeleteTask={onDeleteTask}
          onUpdateNote={onUpdateNote}
          onUpdateTask={onUpdateTask}
        />
      </div>
    </section>
  );
};
