import { useState, type FC, type SubmitEvent as ReactSubmitEvent } from 'react';

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
  validateImportCandidateForm,
  type IImportCandidateFormValues,
  type TImportCandidateResponse,
} from '../../../services';
import type { IImportCandidatesState } from '../useImportCandidates';
import { useTranslation } from '../../../i18n';

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
  const [values, setValues] = useState<IImportCandidateFormValues>(() =>
    editing ? toFormValues(editing) : createEmptyImportCandidateForm(),
  );
  const [touched, setTouched] = useState<Partial<Record<keyof IImportCandidateFormValues, true>>>(
    {},
  );
  const [attempted, setAttempted] = useState(false);
  const errors = validateImportCandidateForm(values);
  const hasErrors = Object.keys(errors).length > 0;

  const show = (field: keyof IImportCandidateFormValues): boolean =>
    attempted || Boolean(touched[field]);
  const fieldError = (field: keyof typeof errors): string | undefined => {
    const problem = errors[field];

    if (!problem || !show(field)) return undefined;

    return problem === 'invalidUrl'
      ? t('importCandidates.form.invalidUrl')
      : t('importCandidates.form.required');
  };
  const bind = (field: keyof IImportCandidateFormValues) => ({
    onBlur: () => setTouched((current) => ({ ...current, [field]: true })),
    onChange: (event: { target: { value: string } }) =>
      setValues((current) => ({ ...current, [field]: event.target.value })),
    value: values[field],
  });

  const handleSubmit = async (event: ReactSubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAttempted(true);

    if (hasErrors || isSaving) return;

    try {
      await onSave(values);
      setValues(createEmptyImportCandidateForm());
      setTouched({});
      setAttempted(false);
    } catch {
      // Error is already recorded in request state and rendered from it.
    }
  };

  return (
    <form className="space-y-3" noValidate onSubmit={handleSubmit}>
      {error && <Alert>{error.message}</Alert>}
      <div className="grid gap-3 md:grid-cols-2">
        <Input
          disabled={isSaving}
          error={fieldError('company')}
          label={t('importCandidates.form.company')}
          {...bind('company')}
        />
        <Input
          disabled={isSaving}
          error={fieldError('roleTitle')}
          label={t('importCandidates.form.roleTitle')}
          {...bind('roleTitle')}
        />
        <Input
          disabled={isSaving}
          label={t('importCandidates.form.location')}
          {...bind('location')}
        />
        <Input
          disabled={isSaving}
          error={fieldError('sourceUrl')}
          helperText={t('importCandidates.form.sourceUrlHelp')}
          label={t('importCandidates.form.sourceUrl')}
          {...bind('sourceUrl')}
        />
      </div>
      <Textarea
        disabled={isSaving}
        error={fieldError('description')}
        label={t('importCandidates.form.description')}
        rows={6}
        {...bind('description')}
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
    </form>
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

    setEditing(null);
  };

  const handleDelete = (candidate: TImportCandidateResponse) => {
    deleteCandidate(candidate.id).catch(() => {
      // Error is already recorded in request state and rendered from it.
    });
  };

  const renderList = () => {
    if (isLoading) return <LoadingState label={t('importCandidates.loading')} />;

    if (loadError)
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
              onEdit={setEditing}
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
          onCancelEdit={() => setEditing(null)}
          onSave={handleSave}
        />
      </Card>
      <Card title={t('importCandidates.list.title')}>{renderList()}</Card>
    </section>
  );
};
