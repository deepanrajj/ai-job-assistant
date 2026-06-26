import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { JobDetailNotesPanel } from './JobDetailNotesPanel';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { mockJobDetails } from '../../../data/mockJobDetails';

describe('JobDetailNotesPanel', () => {
  it('renders saved notes with localized dates', () => {
    renderWithProviders(<JobDetailNotesPanel job={mockJobDetails[0]} />);

    expect(screen.getByRole('heading', { name: 'Notes' })).toBeInTheDocument();
    expect(screen.getByText(/Saved the role because Celonis/)).toBeInTheDocument();
    expect(screen.getByText(/Next preparation focus/)).toBeInTheDocument();
    expect(screen.getByText('May 10, 2026')).toBeInTheDocument();
    expect(screen.queryByLabelText('New note')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Edit note from May 10, 2026')).toHaveAttribute('readonly');
    expect(screen.queryByRole('button', { name: 'Save note from May 10, 2026' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete note from May 10, 2026' })).toBeNull();
  });

  it('creates, updates, and deletes notes', async () => {
    const user = userEvent.setup();
    const onCreateNote = vi.fn();
    const onDeleteNote = vi.fn();
    const onUpdateNote = vi.fn();
    renderWithProviders(
      <JobDetailNotesPanel
        job={mockJobDetails[0]}
        onCreateNote={onCreateNote}
        onDeleteNote={onDeleteNote}
        onUpdateNote={onUpdateNote}
      />,
    );

    await user.type(screen.getByLabelText('New note'), 'Ask about team rituals');
    await user.click(screen.getByRole('button', { name: 'Add note' }));

    expect(onCreateNote).toHaveBeenCalledWith('Ask about team rituals');

    await user.clear(screen.getByLabelText('Edit note from May 10, 2026'));
    await user.type(screen.getByLabelText('Edit note from May 10, 2026'), 'Updated note body');
    await user.click(screen.getByRole('button', { name: 'Save note from May 10, 2026' }));

    expect(onUpdateNote).toHaveBeenCalledWith('job-001-note-1', 'Updated note body');

    await user.click(screen.getByRole('button', { name: 'Delete note from May 10, 2026' }));
    expect(onDeleteNote).toHaveBeenCalledWith('job-001-note-1');
  });

  it('ignores empty note submissions', () => {
    const onCreateNote = vi.fn();
    renderWithProviders(
      <JobDetailNotesPanel job={mockJobDetails[0]} onCreateNote={onCreateNote} />,
    );

    fireEvent.submit(screen.getByLabelText('New note').closest('form')!);

    expect(onCreateNote).not.toHaveBeenCalled();
  });
});
