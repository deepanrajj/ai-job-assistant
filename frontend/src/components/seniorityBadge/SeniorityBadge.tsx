import type { FC } from 'react';

import type { JobAiAnalysis } from '../../types';

interface ISeniorityBadgeProps {
  seniority: JobAiAnalysis['seniority'];
}

export const SeniorityBadge: FC<ISeniorityBadgeProps> = ({ seniority }) => {
  const styles: Record<JobAiAnalysis['seniority'], string> = {
    Junior: 'bg-app-surface2 text-app-textSoft',
    Mid: 'bg-app-surface2 text-app-textSoft',
    Senior: 'bg-primary-900 text-primary-300',
    Lead: 'bg-primary-900 text-primary-300',
    Unknown: 'bg-app-surface2 text-app-textMuted'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${styles[seniority]}`}
    >
      {seniority}
    </span>
  );
};
