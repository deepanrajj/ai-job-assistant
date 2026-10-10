import { useMemo, useRef, useState, type FC } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';

import { Form } from '../../../components/form';
import { Alert, Button, Card, Input, Textarea } from '../../../components/ui';
import { CheckboxGroup } from '../../profile/components/CheckboxGroup';
import { TagListEditor } from '../../profile/components/TagListEditor';
import {
  getPreferenceValueError,
  normalizePreferenceValue,
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
import { createSavedSearchFormSchema } from '../savedSearchFormSchema';

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
  const schema = useMemo(() => createSavedSearchFormSchema(t('discover.editor.required')), [t]);
  const form = useForm<TSavedSearchCriteria>({
    defaultValues: initialCriteria,
    resolver: zodResolver(schema),
  });
  const {
    control,
    formState: { errors },
    register,
  } = form;
  const [skillsDraft, setSkillsDraft] = useState('');
  const skillsInputRef = useRef<HTMLInputElement | null>(null);

  const save = async (criteria: TSavedSearchCriteria) => {
    if (getPreferenceValueError(criteria.skills, skillsDraft)) {
      skillsInputRef.current?.focus();
      return;
    }

    const skill = normalizePreferenceValue(skillsDraft);
    const nextCriteria = skill ? { ...criteria, skills: [...criteria.skills, skill] } : criteria;

    try {
      await onSave(normalizeSavedSearchCriteria(nextCriteria));
    } catch {
      // Error is already recorded in request state and rendered from it.
    }
  };

  return (
    <Card title={title}>
      <Form className="space-y-6" form={form} noValidate onSubmit={save}>
        {error && <Alert>{error.message}</Alert>}
        <Input
          disabled={isSaving}
          error={errors.name?.message}
          label={t('discover.editor.name')}
          placeholder={t('discover.editor.namePlaceholder')}
          {...register('name')}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <Input disabled={isSaving} label={t('discover.editor.role')} {...register('role')} />
          <Input
            disabled={isSaving}
            label={t('discover.editor.location')}
            {...register('location')}
          />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Controller
            control={control}
            name="seniority"
            render={({ field }) => (
              <CheckboxGroup
                disabled={isSaving}
                label={(level) => t(SENIORITY_TRANSLATION_KEYS[level])}
                legend={t('preferences.seniorityLabel')}
                onChange={field.onChange}
                options={SENIORITY_OPTIONS}
                values={field.value}
              />
            )}
          />
          <Controller
            control={control}
            name="workModes"
            render={({ field }) => (
              <CheckboxGroup
                disabled={isSaving}
                label={(mode) => t(WORK_MODE_TRANSLATION_KEYS[mode])}
                legend={t('preferences.workModes')}
                onChange={field.onChange}
                options={WORK_MODE_OPTIONS}
                values={field.value}
              />
            )}
          />
        </div>
        <Controller
          control={control}
          name="skills"
          render={({ field }) => (
            <TagListEditor
              disabled={isSaving}
              draft={skillsDraft}
              inputRef={(element) => {
                skillsInputRef.current = element;
              }}
              label={t('preferences.skills')}
              onChange={field.onChange}
              onDraftChange={setSkillsDraft}
              values={field.value}
            />
          )}
        />
        <Textarea disabled={isSaving} label={t('discover.editor.notes')} {...register('notes')} />
        <div className="flex flex-wrap gap-2">
          <Button aria-busy={isSaving} disabled={isSaving} type="submit">
            {t('discover.editor.save')}
          </Button>
          <Button disabled={isSaving} onClick={onCancel} variant="ghost">
            {t('discover.editor.cancel')}
          </Button>
        </div>
      </Form>
    </Card>
  );
};
