import { useMemo, useState, type FC, type SubmitEvent as ReactSubmitEvent } from 'react';

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
import { useTranslation, type TTranslationContextValue } from '../../../i18n';
import { classNames } from '../../../utils';
import { classifyDuplicate } from '../../duplicates/duplicates.utils';
import type { AppError } from '../../../errors';
import { DUPLICATE_REASON_TRANSLATION_KEYS } from '../../duplicates/duplicates.constants';
import type { TJob } from '../../../types';
import type { IDuplicateResult } from '../../duplicates/duplicates.types';

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
 * A candidate's duplicate state for display: the classification once the
 * saved jobs are known, or why it is not known yet.
 */
type TCandidateDuplicateState = IDuplicateResult | 'checking' | 'unavailable';

/**
 * The jobs the candidates are checked against, as the route loads them.
 */
interface IDuplicateCheckJobs {
  error: AppError | null;
  isLoading: boolean;
  jobs: TJob[];
  /**
   * Reloads the saved jobs, so candidates are re-checked against jobs an
   * import just created.
   */
  reload: () => void;
}

/**
 * Props used by the candidate review section.
 */
type TImportCandidatesSectionProps = IImportCandidatesState & {
  jobs: IDuplicateCheckJobs;
};

/**
 * Classifies one candidate against the saved jobs, or says why it cannot.
 *
 * @param {TImportCandidateResponse} candidate Candidate to check.
 * @param {IDuplicateCheckJobs} jobs Saved jobs and their load state.
 * @returns {TCandidateDuplicateState} Its duplicate state.
 */
const getCandidateDuplicateState = (
  candidate: TImportCandidateResponse,
  { error, isLoading, jobs }: IDuplicateCheckJobs,
): TCandidateDuplicateState => {
  if (isLoading) return 'checking';
  if (error) return 'unavailable';

  return classifyDuplicate(
    {
      company: candidate.content.company,
      location: candidate.content.location,
      roleTitle: candidate.content.roleTitle,
      url: candidate.sourceUrl,
    },
    jobs,
  );
};

/**
 * New and possible duplicates start selected. Likely duplicates start
 * unselected, and so does everything while duplicates are unknown, since
 * a likely duplicate could not be told apart.
 *
 * @param {TCandidateDuplicateState | undefined} duplicate Candidate's duplicate state.
 * @returns {boolean} Whether it is selected by default.
 */
const isSelectedByDefault = (duplicate: TCandidateDuplicateState | undefined): boolean =>
  typeof duplicate === 'object' && duplicate.classification !== 'LIKELY_DUPLICATE';

/**
 * Picks the message for an import failure's error code, falling back to a
 * general one for codes the frontend does not know.
 *
 * @param {string | null} errorCode Error code from the import result.
 * @returns {string} Translation key.
 */
const importErrorTranslationKey = (errorCode: string | null): string => {
  if (errorCode === 'IMPORT_CANDIDATE_ALREADY_IMPORTED')
    return 'importCandidates.import.errors.alreadyImported';
  if (errorCode === 'IMPORT_CANDIDATE_NOT_FOUND') return 'importCandidates.import.errors.notFound';

  return 'importCandidates.import.errors.unknown';
};

/**
 * The outcome of the last import, for the feedback above the list.
 */
interface IImportFeedback {
  failed: { errorCode: string | null; label: string }[];
  importedCount: number;
}

/**
 * Tailwind text colour for a duplicate state.
 *
 * @param {TCandidateDuplicateState} duplicate Candidate's duplicate state.
 * @returns {string} Text colour classes.
 */
const duplicateToneClasses = (duplicate: TCandidateDuplicateState): string => {
  if (typeof duplicate !== 'object') return 'text-app-textMuted';
  if (duplicate.classification === 'LIKELY_DUPLICATE') return 'text-danger-700';
  if (duplicate.classification === 'POSSIBLE_DUPLICATE') return 'text-warning-800';

  return 'text-success-700';
};

/**
 * Says what a duplicate state means, naming the matching job and rule.
 *
 * @param {TCandidateDuplicateState} duplicate Candidate's duplicate state.
 * @param {TTranslationContextValue['t']} t Translation function.
 * @returns {string} Localized description.
 */
const describeDuplicate = (
  duplicate: TCandidateDuplicateState,
  t: TTranslationContextValue['t'],
): string => {
  if (duplicate === 'checking') return t('importCandidates.duplicates.checking');
  if (duplicate === 'unavailable') return t('importCandidates.duplicates.unavailable');
  if (!duplicate.job || !duplicate.reason) return t('importCandidates.duplicates.new');

  return t(
    duplicate.classification === 'LIKELY_DUPLICATE'
      ? 'importCandidates.duplicates.likely'
      : 'importCandidates.duplicates.possible',
    {
      job: t('importCandidates.list.candidateLabel', {
        company: duplicate.job.company,
        roleTitle: duplicate.job.roleTitle,
      }),
      reason: t(DUPLICATE_REASON_TRANSLATION_KEYS[duplicate.reason]),
    },
  );
};

/**
 * Props used by one candidate row.
 */
interface ICandidateRowProps {
  candidate: TImportCandidateResponse;
  duplicate: TCandidateDuplicateState;
  isDisabled: boolean;
  isSelected: boolean;
  onDelete: (candidate: TImportCandidateResponse) => void;
  onEdit: (candidate: TImportCandidateResponse) => void;
  onToggle: (candidateId: string) => void;
}

/**
 * Shows one candidate for review: selection checkbox, company and role,
 * location, where it came from, its review state, its duplicate
 * classification with the reason, the source link (shown, never fetched),
 * and the pasted description as plain text.
 *
 * @param {ICandidateRowProps} props Component props.
 * @returns {JSX.Element} Candidate row.
 */
const CandidateRow: FC<ICandidateRowProps> = ({
  candidate,
  duplicate,
  isDisabled,
  isSelected,
  onDelete,
  onEdit,
  onToggle,
}) => {
  const { t } = useTranslation();
  const { company, description, location, roleTitle } = candidate.content;
  const label = t('importCandidates.list.candidateLabel', { company, roleTitle });
  const isImported = candidate.reviewStatus === 'IMPORTED';

  return (
    <li
      className={classNames(
        'rounded-lg border border-app-borderSoft p-4',
        isImported ? 'bg-app-surface2' : '',
      )}
    >
      <div className="flex items-start gap-3">
        <input
          aria-label={t('importCandidates.list.select', { candidate: label })}
          checked={isSelected}
          className="mt-1 h-4 w-4 rounded border-app-border text-primary-600"
          disabled={isImported}
          onChange={() => onToggle(candidate.id)}
          type="checkbox"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-app-text">{label}</h3>
          <p className="text-sm text-app-textMuted">
            {[
              location || t('importCandidates.list.noLocation'),
              t('importCandidates.source.manual'),
              isImported
                ? t('importCandidates.reviewStatus.imported')
                : t('importCandidates.reviewStatus.pending'),
            ].join(' · ')}
          </p>
          {!isImported && (
            <p className={classNames('mt-1 text-sm', duplicateToneClasses(duplicate))}>
              {describeDuplicate(duplicate, t)}
            </p>
          )}
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
          disabled={isDisabled || isImported}
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
 * as candidates, and the list of candidates to review, select, and import.
 * Saving a candidate never creates a job. Each candidate is classified
 * against the saved jobs (task 048), and likely duplicates start
 * unselected. Importing (task 049) turns the selection into jobs only
 * after an explicit confirmation, then reports each outcome and reloads
 * the saved jobs.
 *
 * @param {TImportCandidatesSectionProps} props Candidates and saved jobs from the route.
 * @returns {JSX.Element} Candidate review section.
 */
export const ImportCandidatesSection: FC<TImportCandidatesSectionProps> = ({
  candidates,
  createCandidate,
  deleteCandidate,
  importCandidates,
  isLoading,
  isMutating,
  jobs,
  loadError,
  mutationError,
  reload,
  updateCandidate,
}) => {
  const { t } = useTranslation();
  const [selectionOverrides, setSelectionOverrides] = useState<ReadonlyMap<string, boolean>>(
    new Map(),
  );
  const [editing, setEditing] = useState<TImportCandidateResponse | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [feedback, setFeedback] = useState<IImportFeedback | null>(null);
  const duplicates = useMemo(
    () =>
      new Map(
        candidates.map((candidate) => [candidate.id, getCandidateDuplicateState(candidate, jobs)]),
      ),
    [candidates, jobs],
  );

  const importedIds = new Set(
    candidates
      .filter((candidate) => candidate.reviewStatus === 'IMPORTED')
      .map((candidate) => candidate.id),
  );

  /**
   * A candidate is selected by default unless it is a likely duplicate, or
   * duplicates are not known yet; the user's own choices override that. An
   * imported candidate is never selected again.
   */
  const isSelected = (candidateId: string): boolean =>
    !importedIds.has(candidateId) &&
    (selectionOverrides.get(candidateId) ?? isSelectedByDefault(duplicates.get(candidateId)));
  const selectedCandidates = candidates.filter((candidate) => isSelected(candidate.id));
  const selectedCount = selectedCandidates.length;
  const selectedLikelyDuplicates = selectedCandidates.filter((candidate) => {
    const duplicate = duplicates.get(candidate.id);

    return typeof duplicate === 'object' && duplicate.classification === 'LIKELY_DUPLICATE';
  }).length;
  const labelOf = (candidate: TImportCandidateResponse): string =>
    t('importCandidates.list.candidateLabel', {
      company: candidate.content.company,
      roleTitle: candidate.content.roleTitle,
    });

  const toggle = (candidateId: string) =>
    setSelectionOverrides((current) => new Map(current).set(candidateId, !isSelected(candidateId)));

  /**
   * Imports the confirmed selection. Only reached from the confirmation, so
   * nothing is imported without the user saying so.
   */
  const handleImport = async () => {
    const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));

    try {
      const results = await importCandidates(selectedCandidates.map((candidate) => candidate.id));

      setFeedback({
        failed: results
          .filter((result) => result.outcome === 'FAILED')
          .map((result) => {
            const candidate = byId.get(result.candidateId);

            return {
              errorCode: result.errorCode,
              label: candidate ? labelOf(candidate) : result.candidateId,
            };
          }),
        importedCount: results.filter((result) => result.outcome === 'IMPORTED').length,
      });
      jobs.reload();
    } catch {
      // Error is already recorded in request state and rendered from it.
    } finally {
      setIsConfirming(false);
    }
  };

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
          <Button onClick={() => setSelectionOverrides(new Map())} size="sm" variant="ghost">
            {t('importCandidates.list.selectDefault')}
          </Button>
          <Button
            disabled={selectedCount === 0}
            onClick={() =>
              setSelectionOverrides(new Map(candidates.map((candidate) => [candidate.id, false])))
            }
            size="sm"
            variant="ghost"
          >
            {t('importCandidates.list.clearSelection')}
          </Button>
          <Button
            disabled={selectedCount === 0 || isMutating || isConfirming}
            onClick={() => {
              setFeedback(null);
              setIsConfirming(true);
            }}
            size="sm"
          >
            {t('importCandidates.import.start', { count: selectedCount })}
          </Button>
        </div>
        {isConfirming && (
          <div
            aria-labelledby="import-confirm-heading"
            className="rounded-lg border border-primary-200 bg-primary-50 p-4"
            role="group"
          >
            <h3 className="font-medium text-app-text" id="import-confirm-heading">
              {t('importCandidates.import.confirmTitle')}
            </h3>
            <ul className="mt-2 list-inside list-disc text-sm text-app-text">
              {selectedCandidates.map((candidate) => (
                <li key={candidate.id}>{labelOf(candidate)}</li>
              ))}
            </ul>
            {selectedLikelyDuplicates > 0 && (
              <p className="mt-2 text-sm text-danger-700">
                {t('importCandidates.import.likelyDuplicateWarning', {
                  count: selectedLikelyDuplicates,
                })}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button aria-busy={isMutating} disabled={isMutating} onClick={handleImport}>
                {t('importCandidates.import.confirm', { count: selectedCount })}
              </Button>
              <Button disabled={isMutating} onClick={() => setIsConfirming(false)} variant="ghost">
                {t('importCandidates.import.cancel')}
              </Button>
            </div>
          </div>
        )}
        {feedback && feedback.importedCount > 0 && (
          <p className="text-sm text-success-700" role="status">
            {t('importCandidates.import.success', { count: feedback.importedCount })}
          </p>
        )}
        {feedback && feedback.failed.length > 0 && (
          <Alert>
            <p>{t('importCandidates.import.failedTitle', { count: feedback.failed.length })}</p>
            <ul className="mt-1 list-inside list-disc">
              {feedback.failed.map((failure) => (
                <li key={failure.label}>
                  {t('importCandidates.import.failedItem', {
                    candidate: failure.label,
                    reason: t(importErrorTranslationKey(failure.errorCode)),
                  })}
                </li>
              ))}
            </ul>
          </Alert>
        )}
        <ul aria-label={t('importCandidates.list.title')} className="space-y-3">
          {candidates.map((candidate) => (
            <CandidateRow
              candidate={candidate}
              duplicate={duplicates.get(candidate.id) ?? 'checking'}
              isDisabled={isMutating}
              isSelected={isSelected(candidate.id)}
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
