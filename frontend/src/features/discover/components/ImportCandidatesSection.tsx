import { useMemo, useState, type FC } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Form } from '../../../components/form';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Textarea,
} from '../../../components/ui';
import {
  buildImportCandidateRequest,
  createEmptyImportCandidateForm,
  type IImportCandidateFormValues,
  type TImportCandidateResponse,
} from '../../../services';
import type { IImportCandidatesState } from '../useImportCandidates';
import { useTranslation } from '../../../i18n';
import { createImportCandidateFormSchema } from '../importCandidateFormSchema';

/**
 * Converts a saved candidate into intake form values for correcting it.
 *
 * @param {TImportCandidateResponse} candidate Candidate as saved.
 * @returns {IImportCandidateFormValues} Form values.
 */
const toFormValues = (candidate: TImportCandidateResponse): IImportCandidateFormValues => ({
  ...candidate.content,
  sourceUrl: candidate.sourceUrl ?? '',
});

/**
 * Props used by the intake form.
 */
interface ICandidateIntakeFormProps {
  editing: TImportCandidateResponse | null;
  error: IImportCandidatesState['mutationError'];
  isSaving: boolean;
  onCancelEdit: () => void;
  onSave: (values: IImportCandidateFormValues) => Promise<void>;
}

/**
 * The manual intake: paste a description and enter company, role,
 * location, and an optional source link. Field errors appear once a
 * required field has been left, or after a save attempt; a failed save
 * keeps every value so nothing has to be typed again.
 *
 * @param {ICandidateIntakeFormProps} props Component props.
 * @returns {JSX.Element} Intake form.
 */
const CandidateIntakeForm: FC<ICandidateIntakeFormProps> = ({
  editing,
  error,
  isSaving,
  onCancelEdit,
  onSave,
}) => {
  const { t } = useTranslation();
  const schema = useMemo(
    () =>
      createImportCandidateFormSchema(
        t('importCandidates.form.required'),
        t('importCandidates.form.invalidUrl'),
      ),
    [t],
  );
  const form = useForm<IImportCandidateFormValues>({
    defaultValues: editing ? toFormValues(editing) : createEmptyImportCandidateForm(),
    mode: 'onBlur',
    resolver: zodResolver(schema),
  });
  const {
    formState: { errors },
    register,
    reset,
  } = form;

  const handleSubmit = async (values: IImportCandidateFormValues) => {
    if (isSaving) return;

    try {
      await onSave(values);
      reset(createEmptyImportCandidateForm());
    } catch {
      // Error is already recorded in request state and rendered from it.
    }
  };

  return (
    <Form className="space-y-3" form={form} noValidate onSubmit={handleSubmit}>
      {error && <Alert>{error.message}</Alert>}
      <div className="grid gap-3 md:grid-cols-2">
        <Input
          disabled={isSaving}
          error={errors.company?.message}
          label={t('importCandidates.form.company')}
          {...register('company')}
        />
        <Input
          disabled={isSaving}
          error={errors.roleTitle?.message}
          label={t('importCandidates.form.roleTitle')}
          {...register('roleTitle')}
        />
        <Input
          disabled={isSaving}
          label={t('importCandidates.form.location')}
          {...register('location')}
        />
        <Input
          disabled={isSaving}
          error={errors.sourceUrl?.message}
          helperText={t('importCandidates.form.sourceUrlHelp')}
          label={t('importCandidates.form.sourceUrl')}
          {...register('sourceUrl')}
        />
      </div>
      <Textarea
        disabled={isSaving}
        error={errors.description?.message}
        label={t('importCandidates.form.description')}
        rows={6}
        {...register('description')}
      />
      <div className="flex flex-wrap gap-2">
        <Button aria-busy={isSaving} disabled={isSaving} type="submit">
          {editing ? t('importCandidates.form.saveChanges') : t('importCandidates.form.save')}
        </Button>
        {editing && (
          <Button disabled={isSaving} onClick={onCancelEdit} variant="ghost">
            {t('importCandidates.form.cancel')}
          </Button>
        )}
      </div>
    </Form>
  );
};

/**
 * Props used by one candidate row.
 */
interface ICandidateRowProps {
  candidate: TImportCandidateResponse;
  isDisabled: boolean;
  isSelected: boolean;
  onDelete: (candidate: TImportCandidateResponse) => void;
  onEdit: (candidate: TImportCandidateResponse) => void;
  onToggle: (candidateId: string) => void;
}

/**
 * Shows one candidate for review: selection checkbox, company and role,
 * location, where it came from, its review and duplicate state, the source
 * link (shown, never fetched), and the pasted description as plain text.
 *
 * @param {ICandidateRowProps} props Component props.
 * @returns {JSX.Element} Candidate row.
 */
const CandidateRow: FC<ICandidateRowProps> = ({
  candidate,
  isDisabled,
  isSelected,
  onDelete,
  onEdit,
  onToggle,
}) => {
  const { t } = useTranslation();
  const { company, description, location, roleTitle } = candidate.content;
  const label = t('importCandidates.list.candidateLabel', { company, roleTitle });

  return (
    <li className="rounded-lg border border-app-borderSoft p-4">
      <div className="flex items-start gap-3">
        <input
          aria-label={t('importCandidates.list.select', { candidate: label })}
          checked={isSelected}
          className="mt-1 h-4 w-4 rounded border-app-border text-primary-600"
          onChange={() => onToggle(candidate.id)}
          type="checkbox"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-app-text">{label}</h3>
          <p className="text-sm text-app-textMuted">
            {[
              location || t('importCandidates.list.noLocation'),
              t('importCandidates.source.manual'),
              t('importCandidates.reviewStatus.pending'),
              t('importCandidates.duplicateStatus.unchecked'),
            ].join(' · ')}
          </p>
          {candidate.sourceUrl && (
            <a
              className="mt-1 inline-block break-all text-sm text-primary-700 hover:underline"
              href={candidate.sourceUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              {candidate.sourceUrl}
            </a>
          )}
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-medium text-app-textSoft">
              {t('importCandidates.list.description')}
            </summary>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-app-text">
              {description}
            </p>
          </details>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          aria-label={t('importCandidates.list.editLabel', { candidate: label })}
          disabled={isDisabled}
          onClick={() => onEdit(candidate)}
          size="sm"
        >
          {t('importCandidates.list.edit')}
        </Button>
        <Button
          aria-label={t('importCandidates.list.deleteLabel', { candidate: label })}
          disabled={isDisabled}
          onClick={() => onDelete(candidate)}
          size="sm"
          variant="danger"
        >
          {t('importCandidates.list.delete')}
        </Button>
      </div>
    </li>
  );
};

/**
 * Candidate review on Discover: a manual intake that saves opportunities
 * as candidates, and the list of candidates to review and select. A
 * candidate is not a job; nothing here creates one. Importing the selected
 * candidates is task 049's action.
 *
 * @param {IImportCandidatesState} props Candidates state from the route.
 * @returns {JSX.Element} Candidate review section.
 */
export const ImportCandidatesSection: FC<IImportCandidatesState> = ({
  candidates,
  clearMutationError,
  createCandidate,
  deleteCandidate,
  isLoading,
  isMutating,
  loadError,
  mutationError,
  reload,
  updateCandidate,
}) => {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [editing, setEditing] = useState<TImportCandidateResponse | null>(null);
  const selectedCount = candidates.filter((candidate) => selectedIds.has(candidate.id)).length;

  const switchEditing = (candidate: TImportCandidateResponse | null) => {
    clearMutationError();
    setEditing(candidate);
  };

  const toggle = (candidateId: string) =>
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(candidateId)) next.delete(candidateId);
      else next.add(candidateId);

      return next;
    });

  const handleSave = async (values: IImportCandidateFormValues) => {
    const payload = buildImportCandidateRequest(values);

    if (editing) await updateCandidate(editing.id, payload);
    else await createCandidate(payload);

    switchEditing(null);
  };

  const handleDelete = (candidate: TImportCandidateResponse) => {
    deleteCandidate(candidate.id).then(
      () => setEditing((current) => (current?.id === candidate.id ? null : current)),
      () => {
        // Error is already recorded in request state and rendered from it.
      },
    );
  };

  const renderList = () => {
    if (isLoading) return <LoadingState label={t('importCandidates.loading')} />;

    if (loadError && candidates.length === 0)
      return (
        <ErrorState
          action={<Button onClick={reload}>{t('jobs.loadErrorRetry')}</Button>}
          description={loadError.message}
          title={t('importCandidates.loadErrorTitle')}
        />
      );

    if (candidates.length === 0)
      return (
        <EmptyState
          description={t('importCandidates.list.emptyDescription')}
          title={t('importCandidates.list.emptyTitle')}
        />
      );

    return (
      <div className="space-y-3">
        {loadError && (
          <Alert>
            <p>{loadError.message}</p>
            <Button onClick={reload} size="sm" variant="ghost">
              {t('jobs.loadErrorRetry')}
            </Button>
          </Alert>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <p aria-live="polite" className="text-sm text-app-textSoft">
            {t('importCandidates.list.selectedCount', {
              count: selectedCount,
              total: candidates.length,
            })}
          </p>
          <Button
            onClick={() => setSelectedIds(new Set(candidates.map((candidate) => candidate.id)))}
            size="sm"
            variant="ghost"
          >
            {t('importCandidates.list.selectAll')}
          </Button>
          <Button
            disabled={selectedCount === 0}
            onClick={() => setSelectedIds(new Set())}
            size="sm"
            variant="ghost"
          >
            {t('importCandidates.list.clearSelection')}
          </Button>
        </div>
        <ul aria-label={t('importCandidates.list.title')} className="space-y-3">
          {candidates.map((candidate) => (
            <CandidateRow
              candidate={candidate}
              isDisabled={isMutating}
              isSelected={selectedIds.has(candidate.id)}
              key={candidate.id}
              onDelete={handleDelete}
              onEdit={switchEditing}
              onToggle={toggle}
            />
          ))}
        </ul>
      </div>
    );
  };

  return (
    <section aria-labelledby="import-candidates-heading" className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-app-text" id="import-candidates-heading">
          {t('importCandidates.title')}
        </h2>
        <p className="text-sm text-app-textMuted">{t('importCandidates.subtitle')}</p>
      </div>
      <Card
        title={editing ? t('importCandidates.form.editTitle') : t('importCandidates.form.newTitle')}
      >
        <CandidateIntakeForm
          editing={editing}
          error={mutationError}
          isSaving={isMutating}
          key={editing?.id ?? 'new'}
          onCancelEdit={() => switchEditing(null)}
          onSave={handleSave}
        />
      </Card>
      <Card title={t('importCandidates.list.title')}>{renderList()}</Card>
    </section>
  );
};
