import { describe, expect, it } from 'vitest';

import {
  buildJobTaskUpdateRequest,
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
    ]);
  });

  it('uses fallback metadata when optional values are blank', () => {
    const [locationItem, salaryItem] = createJobDetailMetadataItems(
      {
        ...mockJobDetails[0],
        location: '',
        salaryMax: 0,
        salaryMin: 0,
      },
      'en',
      t,
    );

    expect(locationItem.value).toBe('Not set');
    expect(salaryItem.value).toBe('Not set');
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

  it('renders a no-due-date label when a task has no due date', () => {
    expect(getJobTaskDueLabel({ ...mockJobDetails[0].tasks[0], dueDate: '' }, 'en', t)).toBe(
      'No due date',
    );
  });

  describe('buildJobTaskUpdateRequest', () => {
    const task = mockJobDetails[0].tasks[0];

    it('fills unspecified fields from the currently loaded task', () => {
      expect(buildJobTaskUpdateRequest(task, { status: 'TODO' })).toEqual({
        title: task.title,
        status: 'TODO',
        dueDate: task.dueDate,
      });
    });

    it('keeps the loaded status when only the title changes', () => {
      expect(buildJobTaskUpdateRequest(task, { title: 'Updated title' })).toEqual({
        title: 'Updated title',
        status: task.status,
        dueDate: task.dueDate,
      });
    });

    it('sends every field from the input when the caller provides all of them', () => {
      expect(
        buildJobTaskUpdateRequest(task, {
          title: 'Updated title',
          status: 'DONE',
          dueDate: '2026-07-01',
        }),
      ).toEqual({
        title: 'Updated title',
        status: 'DONE',
        dueDate: '2026-07-01',
      });
    });

    it('sends an explicit null when the resulting due date is empty', () => {
      expect(buildJobTaskUpdateRequest({ ...task, dueDate: '' }, { status: 'DONE' })).toMatchObject(
        {
          dueDate: null,
        },
      );
    });
  });
});
