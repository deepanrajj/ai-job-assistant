import { useMemo, useState, type FC, type ReactNode } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Form } from '../../../components/form';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Textarea,
} from '../../../components/ui';
import { EditIcon, ExternalLinkIcon, TrashIcon } from '../../../components/icons';
import {
  buildImportCandidateRequest,
  createEmptyImportCandidateForm,
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
  error: IImportCandidatesState['saveError'];
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
        t('importCandidates.form.tooLongText'),
        t('importCandidates.form.tooLongUrl'),
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
      {/* Two columns only when the card is wide enough, not the viewport,
          so the fields stack when the form sits in the sidebar. */}
      <div className="grid gap-3 @lg:grid-cols-2">
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
          error={errors.location?.message}
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
  /**
   * Shown above the review, such as the saved searches; from `xl` up the
   * two fill the main column and the intake becomes a sidebar.
   */
  beside?: ReactNode;
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
 * Tailwind tint for a duplicate state's flag.
 *
 * @param {TCandidateDuplicateState} duplicate Candidate's duplicate state.
 * @returns {string} Background and text colour classes.
 */
const duplicateToneClasses = (duplicate: TCandidateDuplicateState): string => {
  if (typeof duplicate !== 'object') return 'bg-app-surface2 text-app-textMuted';
  if (duplicate.classification === 'LIKELY_DUPLICATE') return 'bg-danger-50 text-danger-700';
  if (duplicate.classification === 'POSSIBLE_DUPLICATE') return 'bg-warning-50 text-warning-800';

  return 'bg-success-50 text-success-700';
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
        'flex items-start gap-3 px-5 py-4',
        isImported ? 'bg-app-surface2' : isSelected ? 'bg-primary-50/60' : '',
      )}
    >
      <input
        aria-label={t('importCandidates.list.select', { candidate: label })}
        checked={isSelected}
        className="mt-1 h-4 w-4 shrink-0 rounded border-app-border accent-primary-600"
        disabled={isImported}
        onChange={() => onToggle(candidate.id)}
        type="checkbox"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="break-words font-semibold text-app-text">{label}</h3>
            <p className="break-words text-sm text-app-textMuted">
              {[
                location || t('importCandidates.list.noLocation'),
                t('importCandidates.source.manual'),
              ].join(' · ')}
            </p>
          </div>
          <div className="-ml-3 flex shrink-0 gap-1 sm:ml-0">
            <Button
              aria-label={t('importCandidates.list.editLabel', { candidate: label })}
              disabled={isDisabled || isImported}
              leftIcon={<EditIcon />}
              onClick={() => onEdit(candidate)}
              size="sm"
              variant="ghost"
            >
              {t('importCandidates.list.edit')}
            </Button>
            <Button
              aria-label={t('importCandidates.list.deleteLabel', { candidate: label })}
              disabled={isDisabled}
              leftIcon={<TrashIcon />}
              onClick={() => onDelete(candidate)}
              size="sm"
              variant="dangerGhost"
            >
              {t('importCandidates.list.delete')}
            </Button>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-start gap-2">
          <Badge
            className={classNames(
              'px-2.5 py-0.5 text-xs ring-1 ring-inset',
              isImported
                ? 'bg-success-50 text-success-700 ring-success-100'
                : 'bg-primary-50 text-primary-700 ring-primary-100',
            )}
          >
            {isImported
              ? t('importCandidates.reviewStatus.imported')
              : t('importCandidates.reviewStatus.pending')}
          </Badge>
          {!isImported && (
            <p
              className={classNames(
                'rounded-lg px-2 py-0.5 text-xs font-medium',
                duplicateToneClasses(duplicate),
              )}
            >
              {describeDuplicate(duplicate, t)}
            </p>
          )}
        </div>
        {candidate.sourceUrl && (
          <a
            className="mt-2 inline-flex max-w-full items-start gap-1 text-sm text-primary-700 hover:underline"
            href={candidate.sourceUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span className="min-w-0 break-all">{candidate.sourceUrl}</span>
            <ExternalLinkIcon className="mt-1 h-3 w-3 shrink-0" />
          </a>
        )}
        <details className="mt-2">
          <summary className="cursor-pointer text-sm font-medium text-app-textSoft hover:text-app-text">
            {t('importCandidates.list.description')}
          </summary>
          <p className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-app-surface2 p-3 text-sm text-app-text">
            {description}
          </p>
        </details>
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
  beside,
  candidates,
  clearDeleteError,
  clearSaveError,
  createCandidate,
  deleteCandidate,
  deleteError,
  importCandidates,
  isLoading,
  isMutating,
  jobs,
  loadError,
  reload,
  saveError,
  updateCandidate,
}) => {
  const { t } = useTranslation();
  const [selectionOverrides, setSelectionOverrides] = useState<ReadonlyMap<string, boolean>>(
    new Map(),
  );
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  const editing =
    candidates.find(
      (candidate) => candidate.id === editingCandidateId && candidate.reviewStatus !== 'IMPORTED',
    ) ?? null;
  const [isConfirming, setIsConfirming] = useState(false);
  const [feedback, setFeedback] = useState<IImportFeedback | null>(null);
  const [importRequestError, setImportRequestError] = useState<string | null>(null);
  const { error: jobsError, isLoading: jobsLoading, jobs: savedJobs, reload: reloadJobs } = jobs;
  const duplicates = useMemo(() => {
    const jobState = {
      error: jobsError,
      isLoading: jobsLoading,
      jobs: savedJobs,
      reload: reloadJobs,
    };

    return new Map(
      candidates.map((candidate) => [
        candidate.id,
        getCandidateDuplicateState(candidate, jobState),
      ]),
    );
  }, [candidates, jobsError, jobsLoading, savedJobs, reloadJobs]);

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

  const switchEditing = (candidate: TImportCandidateResponse | null) => {
    clearSaveError();
    setEditingCandidateId(candidate?.id ?? null);
  };

  const toggle = (candidateId: string) =>
    setSelectionOverrides((current) => new Map(current).set(candidateId, !isSelected(candidateId)));

  /**
   * Imports the confirmed selection. Only reached from the confirmation, so
   * nothing is imported without the user saying so.
   */
  const handleImport = async () => {
    if (selectedCount === 0) return;

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
      setEditingCandidateId((current) =>
        results.some((result) => result.candidateId === current && result.outcome === 'IMPORTED')
          ? null
          : current,
      );
      jobs.reload();
      if (results.some((result) => result.outcome === 'FAILED')) reload();
    } catch (error) {
      reload();
      jobs.reload();
      setImportRequestError(
        error instanceof Error ? error.message : t('importCandidates.import.errors.requestFailed'),
      );
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSave = async (values: IImportCandidateFormValues) => {
    const payload = buildImportCandidateRequest(values);

    if (editing) await updateCandidate(editing.id, payload);
    else await createCandidate(payload);

    switchEditing(null);
  };

  const handleDelete = (candidate: TImportCandidateResponse) => {
    deleteCandidate(candidate.id).then(
      () => setEditingCandidateId((current) => (current === candidate.id ? null : current)),
      () => {
        // Error is already recorded in request state and rendered from it.
      },
    );
  };

  // Built once, so whether there is any feedback is read from the same
  // conditions that render it.
  const importFeedback = [
    deleteError && <Alert key="delete">{deleteError.message}</Alert>,
    importRequestError && <Alert key="request">{importRequestError}</Alert>,
    feedback && feedback.importedCount > 0 && (
      <Alert key="imported" role="status" variant="success">
        {t('importCandidates.import.success', { count: feedback.importedCount })}
      </Alert>
    ),
    feedback && feedback.failed.length > 0 && (
      <Alert key="failed">
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
    ),
  ].filter(Boolean);
  const hasImportFeedback = importFeedback.length > 0;

  /**
   * The state shown instead of the list (loading, a failed first load, or
   * no candidates), with any import feedback under it.
   */
  const renderListPlaceholder = () => (
    <>
      {isLoading && <LoadingState label={t('importCandidates.loading')} />}
      {!isLoading && loadError && (
        <ErrorState
          action={<Button onClick={reload}>{t('jobs.loadErrorRetry')}</Button>}
          description={loadError.message}
          title={t('importCandidates.loadErrorTitle')}
        />
      )}
      {!isLoading && !loadError && (
        <EmptyState
          description={t('importCandidates.list.emptyDescription')}
          title={t('importCandidates.list.emptyTitle')}
        />
      )}
      {hasImportFeedback && <div className="space-y-3 px-5 pb-5">{importFeedback}</div>}
    </>
  );

  const renderList = () => {
    if (isLoading || candidates.length === 0) return renderListPlaceholder();

    return (
      <>
        <div className="flex flex-wrap items-center gap-2 border-b border-app-borderSoft bg-app-surface2/60 px-5 py-3">
          <p aria-live="polite" className="mr-1 text-sm font-medium text-app-textSoft">
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
            className="sm:ml-auto"
            disabled={selectedCount === 0 || isMutating || isConfirming}
            onClick={() => {
              setFeedback(null);
              setImportRequestError(null);
              clearDeleteError();
              setIsConfirming(true);
            }}
            size="sm"
          >
            {t('importCandidates.import.start', { count: selectedCount })}
          </Button>
        </div>
        {(loadError || hasImportFeedback || isConfirming) && (
          <div className="space-y-3 border-b border-app-borderSoft px-5 py-4">
            {loadError && (
              <Alert live={false}>
                <p>{loadError.message}</p>
                <Button onClick={reload} size="sm" variant="ghost">
                  {t('jobs.loadErrorRetry')}
                </Button>
              </Alert>
            )}
            {importFeedback}
            {isConfirming && (
              <div
                aria-labelledby="import-confirm-heading"
                className="rounded-xl border border-primary-200 bg-primary-50 p-4"
                role="group"
              >
                <h3 className="font-semibold text-app-text" id="import-confirm-heading">
                  {t('importCandidates.import.confirmTitle')}
                </h3>
                <ul className="mt-2 list-inside list-disc text-sm text-app-text">
                  {selectedCandidates.map((candidate) => (
                    <li className="break-words" key={candidate.id}>
                      {labelOf(candidate)}
                    </li>
                  ))}
                </ul>
                {selectedLikelyDuplicates > 0 && (
                  <p className="mt-2 text-sm font-medium text-danger-700">
                    {t('importCandidates.import.likelyDuplicateWarning', {
                      count: selectedLikelyDuplicates,
                    })}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    aria-busy={isMutating}
                    disabled={isMutating || selectedCount === 0}
                    onClick={handleImport}
                  >
                    {t('importCandidates.import.confirm', { count: selectedCount })}
                  </Button>
                  <Button
                    disabled={isMutating}
                    onClick={() => setIsConfirming(false)}
                    variant="ghost"
                  >
                    {t('importCandidates.import.cancel')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        <ul
          aria-label={t('importCandidates.list.title')}
          className="divide-y divide-app-borderSoft"
        >
          {candidates.map((candidate) => (
            <CandidateRow
              candidate={candidate}
              duplicate={duplicates.get(candidate.id) ?? 'checking'}
              isDisabled={isMutating}
              isSelected={isSelected(candidate.id)}
              key={candidate.id}
              onDelete={handleDelete}
              onEdit={switchEditing}
              onToggle={toggle}
            />
          ))}
        </ul>
      </>
    );
  };

  return (
    // DOM order stays beside, intake, review, so narrow screens stack them
    // that way. From `xl` the intake moves to a sidebar spanning both rows;
    // the second row takes any extra height, so the review sits right under
    // the content beside it.
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:grid-rows-[auto_1fr]">
      {beside && <div className="min-w-0 xl:col-start-1">{beside}</div>}
      {/* Sticky under the header, and never taller than the screen: a
          form grown by field errors scrolls inside itself, so Save stays
          reachable. */}
      <div className="@container xl:sticky xl:top-20 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:max-h-[calc(100dvh-6rem)] xl:overflow-y-auto">
        <Card
          subtitle={t('importCandidates.form.subtitle')}
          title={
            editing ? t('importCandidates.form.editTitle') : t('importCandidates.form.newTitle')
          }
          titleId="candidate-intake-heading"
        >
          <CandidateIntakeForm
            editing={editing}
            error={saveError}
            isSaving={isMutating}
            key={editing?.id ?? 'new'}
            onCancelEdit={() => switchEditing(null)}
            onSave={handleSave}
          />
        </Card>
      </div>
      <div className="min-w-0 xl:col-start-1">
        <Card
          padding="none"
          subtitle={t('importCandidates.subtitle')}
          title={t('importCandidates.title')}
          titleId="import-candidates-heading"
        >
          {renderList()}
        </Card>
      </div>
    </div>
  );
};
