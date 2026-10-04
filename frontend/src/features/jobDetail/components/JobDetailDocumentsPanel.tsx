import { memo, useCallback, useState, type FC, type SubmitEvent as ReactSubmitEvent } from 'react';

import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Select,
  Textarea,
} from '../../../components/ui';
import {
  isDocumentFormValid,
  isValidDocumentUrl,
  type IDocumentFormValues,
} from '../../../services';
import { useJobDocuments } from '../useJobDocuments';
import { useTranslation } from '../../../i18n';
import { formatCalendarDate } from '../../jobs/jobs.utils';
import {
  DOCUMENT_TYPE_TRANSLATION_KEYS,
  type TJobDocument,
  type TJobDocumentType,
} from '../../../types';

/**
 * Props used by the job detail documents panel.
 */
interface IJobDetailDocumentsPanelProps {
  jobId: string;
}

/**
 * The document type options offered by the type select, in display order.
 */
const documentTypeOptions: readonly TJobDocumentType[] = [
  'CV',
  'COVER_LETTER',
  'PORTFOLIO',
  'OTHER',
];

/**
 * Empty form values used to seed the add-document form.
 */
const emptyDocumentFormValues: IDocumentFormValues = {
  notes: '',
  submittedAt: '',
  title: '',
  type: 'CV',
  url: '',
};

/**
 * Converts a saved document into the form values its edit row starts from.
 *
 * @param {TJobDocument} document Document as currently loaded.
 * @returns {IDocumentFormValues} Form values seeded from that document.
 */
const toDocumentFormValues = (document: TJobDocument): IDocumentFormValues => ({
  notes: document.notes ?? '',
  submittedAt: document.submittedAt ?? '',
  title: document.title,
  type: document.type,
  url: document.url ?? '',
});

/**
 * Props used by the shared document field set.
 */
interface IDocumentFieldsProps {
  disabled: boolean;
  onChange: (values: IDocumentFormValues) => void;
  values: IDocumentFormValues;
}

/**
 * Renders the editable fields a document carries: type, version label,
 * link, submitted date, and notes.
 *
 * @param {IDocumentFieldsProps} props Component props.
 * @returns {JSX.Element} Document field set.
 */
const DocumentFields: FC<IDocumentFieldsProps> = ({ disabled, onChange, values }) => {
  const { t } = useTranslation();

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Select
        disabled={disabled}
        label={t('jobDetail.documents.fields.type')}
        onChange={(event) => onChange({ ...values, type: event.target.value as TJobDocumentType })}
        value={values.type}
      >
        {documentTypeOptions.map((type) => (
          <option key={type} value={type}>
            {t(DOCUMENT_TYPE_TRANSLATION_KEYS[type])}
          </option>
        ))}
      </Select>
      <Input
        disabled={disabled}
        label={t('jobDetail.documents.fields.title')}
        onChange={(event) => onChange({ ...values, title: event.target.value })}
        placeholder={t('jobDetail.documents.titlePlaceholder')}
        value={values.title}
      />
      <Input
        disabled={disabled}
        error={isValidDocumentUrl(values.url) ? undefined : t('jobDetail.documents.invalidUrl')}
        label={t('jobDetail.documents.fields.url')}
        onChange={(event) => onChange({ ...values, url: event.target.value })}
        value={values.url}
      />
      <Input
        disabled={disabled}
        label={t('jobDetail.documents.fields.submittedAt')}
        onChange={(event) => onChange({ ...values, submittedAt: event.target.value })}
        type="date"
        value={values.submittedAt}
      />
      <Textarea
        className="md:col-span-2"
        disabled={disabled}
        label={t('jobDetail.documents.fields.notes')}
        onChange={(event) => onChange({ ...values, notes: event.target.value })}
        value={values.notes}
      />
    </div>
  );
};

/**
 * Props used by one job detail document row.
 */
interface IJobDetailDocumentItemProps {
  document: TJobDocument;
  isDeleting: boolean;
  isDisabled: boolean;
  isSaving: boolean;
  onDeleteDocument: (documentId: string) => void;
  onSaveDocument: (documentId: string, values: IDocumentFormValues) => Promise<void>;
}

/**
 * Renders one document as a read view, or as its editable field set once
 * the user opens it for editing.
 *
 * @param {IJobDetailDocumentItemProps} props Component props.
 * @returns {JSX.Element} Job detail document row.
 */
const JobDetailDocumentItem: FC<IJobDetailDocumentItemProps> = ({
  document,
  isDeleting,
  isDisabled,
  isSaving,
  onDeleteDocument,
  onSaveDocument,
}) => {
  const { language, t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [values, setValues] = useState<IDocumentFormValues>(() => toDocumentFormValues(document));

  const handleEdit = () => {
    setValues(toDocumentFormValues(document));
    setIsEditing(true);
  };

  /**
   * Leaves edit mode only once the save succeeds, so a failed request does
   * not throw away what the user typed.
   */
  const handleSave = async () => {
    try {
      await onSaveDocument(document.id, values);
      setIsEditing(false);
    } catch {
      // Error is already recorded in request state and rendered from it.
    }
  };

  if (isEditing)
    return (
      <li className="rounded-lg border border-app-borderSoft bg-app-surface2 p-4">
        <DocumentFields disabled={isDisabled} onChange={setValues} values={values} />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            aria-busy={isSaving}
            disabled={isDisabled || !isDocumentFormValid(values)}
            onClick={handleSave}
            size="sm"
          >
            {t('jobDetail.documents.saveDocument')}
          </Button>
          <Button
            disabled={isDisabled}
            onClick={() => setIsEditing(false)}
            size="sm"
            variant="ghost"
          >
            {t('jobDetail.documents.cancel')}
          </Button>
        </div>
      </li>
    );

  return (
    <li className="rounded-lg border border-app-borderSoft bg-app-surface2 p-4">
      <p className="text-sm font-medium text-app-text">{document.title}</p>
      <p className="mt-1 text-xs font-medium text-app-textMuted">
        {t(DOCUMENT_TYPE_TRANSLATION_KEYS[document.type])}
      </p>
      {document.url && (
        <p className="mt-2 text-sm">
          <a
            className="text-primary-700 hover:underline"
            href={document.url}
            rel="noopener noreferrer"
            target="_blank"
          >
            {document.url}
          </a>
        </p>
      )}
      <p className="mt-2 text-xs text-app-textMuted">
        {document.submittedAt
          ? t('jobDetail.documents.submittedOn', {
              date: formatCalendarDate(document.submittedAt, language),
            })
          : t('jobDetail.documents.notSentYet')}
      </p>
      {document.notes && <p className="mt-2 text-sm text-app-text">{document.notes}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          aria-label={t('jobDetail.documents.editDocumentLabel', { title: document.title })}
          disabled={isDisabled}
          onClick={handleEdit}
          size="sm"
        >
          {t('jobDetail.documents.editDocument')}
        </Button>
        <Button
          aria-busy={isDeleting}
          aria-label={t('jobDetail.documents.deleteDocumentLabel', { title: document.title })}
          disabled={isDisabled}
          onClick={() => onDeleteDocument(document.id)}
          size="sm"
          variant="danger"
        >
          {t('jobDetail.documents.deleteDocument')}
        </Button>
      </div>
    </li>
  );
};

const MemoizedJobDetailDocumentItem = memo(JobDetailDocumentItem);

/**
 * Renders and manages a job's application documents: which CV, cover
 * letter, or portfolio piece went with it, and when. Metadata only; no
 * file is uploaded or stored.
 *
 * @param {IJobDetailDocumentsPanelProps} props Component props.
 * @returns {JSX.Element} Job documents panel.
 */
const JobDetailDocumentsPanelComponent: FC<IJobDetailDocumentsPanelProps> = ({ jobId }) => {
  const { t } = useTranslation();
  const {
    createJobDocument,
    deleteJobDocument,
    deletingDocumentIds,
    documents,
    hasLoadedDocuments,
    isCreating,
    isLoading,
    isMutating,
    loadError,
    mutationError,
    reload,
    updateJobDocument,
    updatingDocumentIds,
  } = useJobDocuments(jobId);
  const [newDocumentValues, setNewDocumentValues] =
    useState<IDocumentFormValues>(emptyDocumentFormValues);
  const canCreateDocument = !isMutating && isDocumentFormValid(newDocumentValues);

  /**
   * Resets the form only once the create succeeds, so a failed request
   * leaves the user's input in place to retry.
   */
  const handleCreateDocument = async (event: ReactSubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canCreateDocument) return;

    try {
      await createJobDocument(newDocumentValues);
      setNewDocumentValues(emptyDocumentFormValues);
    } catch {
      // Error is already recorded in request state and rendered from it.
    }
  };

  /**
   * Returns the update promise unswallowed: the row awaits it to decide
   * whether to leave edit mode.
   */
  const handleSaveDocument = useCallback(
    (documentId: string, values: IDocumentFormValues) => updateJobDocument(documentId, values),
    [updateJobDocument],
  );

  const handleDeleteDocument = useCallback(
    (documentId: string) => {
      deleteJobDocument(documentId).catch(() => {
        // Error is already recorded in request state and rendered from it.
      });
    },
    [deleteJobDocument],
  );

  if (isLoading)
    return (
      <Card title={t('jobDetail.documents.title')}>
        <LoadingState label={t('jobDetail.documents.loading')} />
      </Card>
    );

  if (loadError && !hasLoadedDocuments)
    return (
      <Card title={t('jobDetail.documents.title')}>
        <ErrorState
          action={<Button onClick={reload}>{t('jobs.loadErrorRetry')}</Button>}
          description={loadError.message}
          title={t('jobDetail.documents.loadErrorTitle')}
        />
      </Card>
    );

  return (
    <Card subtitle={t('jobDetail.documents.subtitle')} title={t('jobDetail.documents.title')}>
      {mutationError && <Alert className="mb-4">{mutationError.message}</Alert>}
      {loadError && (
        <Alert className="mb-4">
          <p>{loadError.message}</p>
          <Button className="mt-2" onClick={reload} size="sm">
            {t('jobs.loadErrorRetry')}
          </Button>
        </Alert>
      )}

      <form className="mb-4 space-y-3" onSubmit={handleCreateDocument}>
        <DocumentFields
          disabled={isMutating}
          onChange={setNewDocumentValues}
          values={newDocumentValues}
        />
        <Button aria-busy={isCreating} disabled={!canCreateDocument} type="submit">
          {t('jobDetail.documents.addDocument')}
        </Button>
      </form>

      {documents.length === 0 ? (
        <EmptyState
          description={t('jobDetail.documents.emptyDescription')}
          title={t('jobDetail.documents.emptyTitle')}
        />
      ) : (
        <ul aria-label={t('jobDetail.documents.listLabel')} className="space-y-4">
          {documents.map((document) => {
            const isDeleting = deletingDocumentIds.has(document.id);
            const isSaving = updatingDocumentIds.has(document.id);

            return (
              <MemoizedJobDetailDocumentItem
                document={document}
                isDeleting={isDeleting}
                isDisabled={isSaving || isDeleting}
                isSaving={isSaving}
                key={document.id}
                onDeleteDocument={handleDeleteDocument}
                onSaveDocument={handleSaveDocument}
              />
            );
          })}
        </ul>
      )}
    </Card>
  );
};

export const JobDetailDocumentsPanel = memo(JobDetailDocumentsPanelComponent);
