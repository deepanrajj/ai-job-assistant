import { describe, expect, it } from 'vitest';

import {
  createJobDetailMetadataItems,
  getCompletedJobTaskCount,
  getJobDetailPanelId,
  getJobDetailTabId,
  getJobTaskDueLabel,
  isJobTaskComplete,
} from './jobDetail.utils';
import { translate, type TTranslationContextValue } from '../../i18n';
import { mockJobDetails } from '../../data/mockJobDetails';

const t: TTranslationContextValue['t'] = (key, params) => translate(key, params, 'en');

describe('jobDetail.utils', () => {
  it('creates localized job detail metadata items', () => {
    const metadataItems = createJobDetailMetadataItems(mockJobDetails[0], 'en', t);

    expect(metadataItems).toEqual([
      {
        id: 'location',
        label: 'Location',
        value: 'Munich / Hybrid',
      },
      {
        id: 'salary',
        label: 'Salary',
        value: 'EUR 76k - EUR 92k',
      },
      {
        id: 'updated',
        label: 'Updated',
        value: 'May 9, 2026',
      },
      {
        id: 'nextStep',
        label: 'Next step',
        value: 'Prepare product analytics case study',
      },
    ]);
  });

  it('uses fallback metadata when optional values are blank', () => {
    const [locationItem, salaryItem, , nextStepItem] = createJobDetailMetadataItems(
      {
        ...mockJobDetails[0],
        location: '',
        nextStep: '',
        salaryMax: 0,
        salaryMin: 0,
      },
      'en',
      t,
    );

    expect(locationItem.value).toBe('Not set');
    expect(salaryItem.value).toBe('Not set');
    expect(nextStepItem.value).toBe('Not set');
  });

  it('builds stable tab and panel ids', () => {
    expect(getJobDetailTabId('overview')).toBe('job-detail-overview-tab');
    expect(getJobDetailPanelId('overview')).toBe('job-detail-overview-panel');
  });

  it('counts completed tasks and formats due labels', () => {
    const tasks = mockJobDetails[0].tasks;

    expect(isJobTaskComplete(tasks[0])).toBe(true);
    expect(isJobTaskComplete(tasks[1])).toBe(false);
    expect(getCompletedJobTaskCount(tasks)).toBe(1);
    expect(getJobTaskDueLabel(tasks[0], 'en', t)).toBe('Due May 10, 2026');
  });
});
