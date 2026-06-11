import type { TJobSeniority } from '../../types';

/**
 * Tailwind class map for AI seniority labels.
 */
export const seniorityBadgeClasses: Record<TJobSeniority, string> = {
  Junior: 'bg-app-surface2 text-app-textSoft',
  Mid: 'bg-app-surface2 text-app-textSoft',
  Senior: 'bg-primary-900 text-primary-300',
  Lead: 'bg-primary-900 text-primary-300',
  Unknown: 'bg-app-surface2 text-app-textMuted',
};
