import { useState, type FC, type SubmitEvent as ReactSubmitEvent } from 'react';

import { Alert, Button, Card, Input, Textarea } from '../../../components/ui';
import { CheckboxGroup } from '../../profile/components/CheckboxGroup';
import { TagListEditor } from '../../profile/components/TagListEditor';
import {
  isSavedSearchValid,
  normalizeSavedSearchCriteria,
  type TSavedSearchCriteria,
} from '../../../services';
import { useTranslation } from '../../../i18n';
import type { AppError } from '../../../errors';
import {
  SENIORITY_OPTIONS,
  SENIORITY_TRANSLATION_KEYS,
  WORK_MODE_OPTIONS,
  WORK_MODE_TRANSLATION_KEYS,
} from '../../profile/preferences.constants';

/**
 * Props used by the saved search editor.
 */
interface ISavedSearchEditorProps {
  error: AppError | null;
  initialCriteria: TSavedSearchCriteria;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (criteria: TSavedSearchCriteria) => Promise<void>;
  title: string;
}

/**
 * Edits one saved search: its name, role, location, seniority, skills,
 * work modes, and notes. Uses task 045's controls and vocabulary, and
 * stays open with the entered values if saving fails.
 *
 * @param {ISavedSearchEditorProps} props Component props.
 * @returns {JSX.Element} Saved search editor.
 */
export const SavedSearchEditor: FC<ISavedSearchEditorProps> = ({
  error,
  initialCriteria,
  isSaving,
  onCancel,
  onSave,
  title,
}) => {
  const { t } = useTranslation();
  const [criteria, setCriteria] = useState(initialCriteria);
  const canSave = !isSaving && isSavedSearchValid(criteria);

  const handleSubmit = async (event: ReactSubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSave) return;

    try {
      await onSave(normalizeSavedSearchCriteria(criteria));
    } catch {
      // Error is already recorded in request state and rendered from it.
    }
  };

  return (
    <Card title={title}>
      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && <Alert>{error.message}</Alert>}
        <Input
          disabled={isSaving}
          label={t('discover.editor.name')}
          onChange={(event) => setCriteria({ ...criteria, name: event.target.value })}
          placeholder={t('discover.editor.namePlaceholder')}
          value={criteria.name}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            disabled={isSaving}
            label={t('discover.editor.role')}
            onChange={(event) => setCriteria({ ...criteria, role: event.target.value })}
            value={criteria.role}
          />
          <Input
            disabled={isSaving}
            label={t('discover.editor.location')}
            onChange={(event) => setCriteria({ ...criteria, location: event.target.value })}
            value={criteria.location}
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <CheckboxGroup
            disabled={isSaving}
            label={(level) => t(SENIORITY_TRANSLATION_KEYS[level])}
            legend={t('preferences.seniorityLabel')}
            onChange={(seniority) => setCriteria({ ...criteria, seniority })}
            options={SENIORITY_OPTIONS}
            values={criteria.seniority}
          />
          <CheckboxGroup
            disabled={isSaving}
            label={(mode) => t(WORK_MODE_TRANSLATION_KEYS[mode])}
            legend={t('preferences.workModes')}
            onChange={(workModes) => setCriteria({ ...criteria, workModes })}
            options={WORK_MODE_OPTIONS}
            values={criteria.workModes}
          />
        </div>
        <TagListEditor
          disabled={isSaving}
          label={t('preferences.skills')}
          onChange={(skills) => setCriteria({ ...criteria, skills })}
          values={criteria.skills}
        />
        <Textarea
          disabled={isSaving}
          label={t('discover.editor.notes')}
          onChange={(event) => setCriteria({ ...criteria, notes: event.target.value })}
          value={criteria.notes}
        />
        <div className="flex flex-wrap gap-2">
          <Button aria-busy={isSaving} disabled={!canSave} type="submit">
            {t('discover.editor.save')}
          </Button>
          <Button disabled={isSaving} onClick={onCancel} variant="ghost">
            {t('discover.editor.cancel')}
          </Button>
        </div>
      </form>
    </Card>
  );
};
