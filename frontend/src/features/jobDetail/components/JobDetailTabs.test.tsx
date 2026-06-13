import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { JobDetailTabs } from './JobDetailTabs';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { mockJobDetails } from '../../../data/mockJobDetails';

describe('JobDetailTabs', () => {
  it('renders accessible tab controls and switches active panels', async () => {
    const user = userEvent.setup();
    renderWithProviders(<JobDetailTabs job={mockJobDetails[0]} />);

    const tabList = screen.getByRole('tablist', { name: 'Job detail sections' });
    const overviewTab = within(tabList).getByRole('tab', { name: 'Overview', selected: true });
    const tasksTab = within(tabList).getByRole('tab', { name: 'Tasks', selected: false });

    expect(overviewTab).toHaveAttribute('id', 'job-detail-overview-tab');
    expect(overviewTab).toHaveAttribute('aria-controls', 'job-detail-overview-panel');
    expect(overviewTab).toHaveClass('cursor-pointer', 'bg-primary-50');
    expect(tasksTab).toHaveClass('text-app-textSoft');
    expect(screen.getByRole('tabpanel')).toHaveAttribute(
      'aria-labelledby',
      'job-detail-overview-tab',
    );
    expect(screen.getByRole('heading', { name: 'Description' })).toBeInTheDocument();

    await user.click(tasksTab);
    expect(within(tabList).getByRole('tab', { name: 'Tasks', selected: true })).toHaveAttribute(
      'aria-controls',
      'job-detail-tasks-panel',
    );
    expect(screen.getByRole('heading', { name: 'Preparation tasks' })).toBeInTheDocument();

    await user.click(within(tabList).getByRole('tab', { name: 'Notes' }));
    expect(screen.getByRole('heading', { name: 'Notes' })).toBeInTheDocument();

    await user.click(within(tabList).getByRole('tab', { name: 'Timeline' }));
    expect(screen.getByRole('heading', { name: 'Timeline' })).toBeInTheDocument();

    await user.click(within(tabList).getByRole('tab', { name: 'AI' }));
    expect(screen.getByRole('heading', { name: 'AI summary' })).toBeInTheDocument();
  });
});
