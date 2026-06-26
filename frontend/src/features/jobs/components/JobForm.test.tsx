import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type SubmitHandler } from 'react-hook-form';

import { JobForm } from './JobForm';
import { createJobFormDefaultValues } from '../jobForm.utils';
import { renderWithProviders } from '../../../test/renderWithProviders';
import { createJobFormSchema, type TJobFormValues } from '../jobFormSchema';

/**
 * Props used by the job form test wrapper.
 */
interface IJobFormTestWrapperProps {
  onCancel?: () => void;
  onSubmit: SubmitHandler<TJobFormValues>;
}

const schema = createJobFormSchema({
  invalidSalary: 'Invalid salary',
  invalidSalaryRange: 'Invalid salary range',
  invalidUrl: 'Invalid URL',
  requiredCompany: 'Company required',
  requiredRole: 'Role required',
});

const JobFormTestWrapper = ({ onCancel = vi.fn(), onSubmit }: IJobFormTestWrapperProps) => {
  const form = useForm<TJobFormValues>({
    defaultValues: createJobFormDefaultValues(),
    resolver: zodResolver(schema),
  });

  return (
    <JobForm
      form={form}
      onCancel={onCancel}
      onSubmit={onSubmit}
      submitLabel="Create job"
      subtitle="Save a new job"
      title="Add job"
    />
  );
};

describe('JobForm', () => {
  it('renders the shared job fields and submits valid values', async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<JobFormTestWrapper onSubmit={onSubmit} />);

    expect(screen.getByRole('heading', { name: 'Add job' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Company'), {
      target: { value: 'Acme GmbH' },
    });
    fireEvent.change(screen.getByLabelText('Role'), {
      target: { value: 'Frontend Engineer' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), {
      target: { value: 'INTERVIEW' },
    });
    fireEvent.change(screen.getByLabelText('Location'), {
      target: { value: 'Berlin' },
    });
    fireEvent.change(screen.getByLabelText('Job URL'), {
      target: { value: 'https://example.com/job' },
    });
    fireEvent.change(screen.getByLabelText('Minimum salary'), {
      target: { value: '70000' },
    });
    fireEvent.change(screen.getByLabelText('Maximum salary'), {
      target: { value: '90000' },
    });
    fireEvent.change(screen.getByLabelText('Tags'), {
      target: { value: 'React, TypeScript' },
    });
    fireEvent.change(screen.getByLabelText('Next step'), {
      target: { value: 'Follow up' },
    });
    fireEvent.change(screen.getByLabelText('Description'), {
      target: { value: 'Build frontend workflows.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create job' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          company: 'Acme GmbH',
          roleTitle: 'Frontend Engineer',
          status: 'INTERVIEW',
        }),
        expect.anything(),
      ),
    );
  });

  it('shows validation errors and calls cancel', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    const onSubmit = vi.fn();
    renderWithProviders(<JobFormTestWrapper onCancel={onCancel} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: 'Create job' }));

    expect(await screen.findByText('Company required')).toBeInTheDocument();
    expect(screen.getByText('Role required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
