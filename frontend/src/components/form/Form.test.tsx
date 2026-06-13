import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, type SubmitHandler } from 'react-hook-form';

import { Form } from './Form';
import { renderWithProviders } from '../../test/renderWithProviders';

type TExampleFormValues = {
  fullName: string;
};

/**
 * Props used by the basic form test component.
 */
interface IExampleFormProps {
  onSubmit: SubmitHandler<TExampleFormValues>;
}

const ExampleForm = ({ onSubmit }: IExampleFormProps) => {
  const form = useForm<TExampleFormValues>({
    defaultValues: {
      fullName: '',
    },
  });

  return (
    <Form form={form} onSubmit={onSubmit}>
      <label htmlFor="fullName">Full name</label>
      <input id="fullName" {...form.register('fullName')} />
      <button type="submit">Save profile</button>
    </Form>
  );
};

describe('Form', () => {
  it('provides form context and submits form values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(<ExampleForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Full name'), 'Deepan Raj');
    await user.click(screen.getByRole('button', { name: 'Save profile' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          fullName: 'Deepan Raj',
        },
        expect.anything(),
      ),
    );
  });
});
