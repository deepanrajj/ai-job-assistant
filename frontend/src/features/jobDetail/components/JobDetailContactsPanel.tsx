import { memo, useCallback, useState, type FC, type SubmitEvent as ReactSubmitEvent } from 'react';

import {
  Alert,
  Button,
  Card,
  ErrorState,
  Input,
  LoadingState,
  Select,
  Textarea,
} from '../../../components/ui';
import { useJobContacts } from '../useJobContacts';
import { useTranslation } from '../../../i18n';
import { formatJobDate } from '../../jobs/jobs.utils';
import {
  CONTACT_TYPE_TRANSLATION_KEYS,
  type TJobContact,
  type TJobContactType,
} from '../../../types';
import type { IContactFormValues } from '../../../services';

/**
 * Props used by the job detail contacts panel.
 */
interface IJobDetailContactsPanelProps {
  jobId: string;
}

/**
 * The contact type options offered by the type select, in display order.
 */
const contactTypeOptions: readonly TJobContactType[] = [
  'RECRUITER',
  'HIRING_MANAGER',
  'REFERRAL',
  'OTHER',
];

/**
 * Empty form values used both to seed the add-contact form and to seed a
 * contact row's fields when it is opened for editing.
 */
const emptyContactFormValues: IContactFormValues = {
  email: '',
  lastContactedAt: '',
  name: '',
  notes: '',
  phone: '',
  profileUrl: '',
  type: 'RECRUITER',
};

/**
 * Converts a saved contact into the form values its edit row starts from.
 *
 * @param {TJobContact} contact Contact as currently loaded.
 * @returns {IContactFormValues} Form values seeded from that contact.
 */
const toContactFormValues = (contact: TJobContact): IContactFormValues => ({
  email: contact.email ?? '',
  lastContactedAt: contact.lastContactedAt ?? '',
  name: contact.name,
  notes: contact.notes ?? '',
  phone: contact.phone ?? '',
  profileUrl: contact.profileUrl ?? '',
  type: contact.type,
});

/**
 * Props used by the shared contact field set, rendered both by the
 * add-contact form and by a contact row opened for editing.
 */
interface IContactFieldsProps {
  disabled: boolean;
  onChange: (values: IContactFormValues) => void;
  values: IContactFormValues;
}

/**
 * Renders the editable fields a contact carries: type, name, email, phone,
 * profile URL, last contacted date, and notes.
 *
 * @param {IContactFieldsProps} props Component props.
 * @returns {JSX.Element} Contact field set.
 */
const ContactFields: FC<IContactFieldsProps> = ({ disabled, onChange, values }) => {
  const { t } = useTranslation();

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Select
        disabled={disabled}
        label={t('jobDetail.contacts.fields.type')}
        onChange={(event) => onChange({ ...values, type: event.target.value as TJobContactType })}
        value={values.type}
      >
        {contactTypeOptions.map((type) => (
          <option key={type} value={type}>
            {t(CONTACT_TYPE_TRANSLATION_KEYS[type])}
          </option>
        ))}
      </Select>
      <Input
        disabled={disabled}
        label={t('jobDetail.contacts.fields.name')}
        onChange={(event) => onChange({ ...values, name: event.target.value })}
        value={values.name}
      />
      <Input
        disabled={disabled}
        label={t('jobDetail.contacts.fields.email')}
        onChange={(event) => onChange({ ...values, email: event.target.value })}
        type="email"
        value={values.email}
      />
      <Input
        disabled={disabled}
        label={t('jobDetail.contacts.fields.phone')}
        onChange={(event) => onChange({ ...values, phone: event.target.value })}
        value={values.phone}
      />
      <Input
        disabled={disabled}
        label={t('jobDetail.contacts.fields.profileUrl')}
        onChange={(event) => onChange({ ...values, profileUrl: event.target.value })}
        value={values.profileUrl}
      />
      <Input
        disabled={disabled}
        label={t('jobDetail.contacts.fields.lastContactedAt')}
        onChange={(event) => onChange({ ...values, lastContactedAt: event.target.value })}
        type="date"
        value={values.lastContactedAt}
      />
      <Textarea
        className="md:col-span-2"
        disabled={disabled}
        label={t('jobDetail.contacts.fields.notes')}
        onChange={(event) => onChange({ ...values, notes: event.target.value })}
        value={values.notes}
      />
    </div>
  );
};

/**
 * Props used by one job detail contact row.
 */
interface IJobDetailContactItemProps {
  contact: TJobContact;
  isDeleting: boolean;
  isDisabled: boolean;
  isSaving: boolean;
  onDeleteContact: (contactId: string) => void;
  onSaveContact: (contactId: string, values: IContactFormValues) => void;
}

/**
 * Renders one contact as a read view, or as its editable field set once
 * the user opens it for editing.
 *
 * @param {IJobDetailContactItemProps} props Component props.
 * @returns {JSX.Element} Job detail contact row.
 */
const JobDetailContactItem: FC<IJobDetailContactItemProps> = ({
  contact,
  isDeleting,
  isDisabled,
  isSaving,
  onDeleteContact,
  onSaveContact,
}) => {
  const { language, t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [values, setValues] = useState<IContactFormValues>(() => toContactFormValues(contact));

  const handleEdit = () => {
    setValues(toContactFormValues(contact));
    setIsEditing(true);
  };

  const handleSave = () => {
    onSaveContact(contact.id, values);
    setIsEditing(false);
  };

  if (isEditing)
    return (
      <li className="rounded-lg border border-app-borderSoft bg-app-surface2 p-4">
        <ContactFields disabled={isDisabled} onChange={setValues} values={values} />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            aria-busy={isSaving}
            disabled={isDisabled || !values.name.trim()}
            onClick={handleSave}
            size="sm"
          >
            {t('jobDetail.contacts.saveContact')}
          </Button>
          <Button
            disabled={isDisabled}
            onClick={() => setIsEditing(false)}
            size="sm"
            variant="ghost"
          >
            {t('jobDetail.contacts.cancel')}
          </Button>
        </div>
      </li>
    );

  const lastContactedLabel = contact.lastContactedAt
    ? t('jobDetail.contacts.lastContactedLabel', {
        date: formatJobDate(contact.lastContactedAt, language),
      })
    : t('jobDetail.contacts.notContactedYet');

  return (
    <li className="rounded-lg border border-app-borderSoft bg-app-surface2 p-4">
      <p className="text-sm font-medium text-app-text">{contact.name}</p>
      <p className="mt-1 text-xs font-medium text-app-textMuted">
        {t(CONTACT_TYPE_TRANSLATION_KEYS[contact.type])}
      </p>
      <dl className="mt-2 space-y-1 text-sm text-app-textSoft">
        {contact.email && (
          <div>
            <a className="text-primary-700 hover:underline" href={`mailto:${contact.email}`}>
              {contact.email}
            </a>
          </div>
        )}
        {contact.phone && <div>{contact.phone}</div>}
        {contact.profileUrl && (
          <div>
            <a
              className="text-primary-700 hover:underline"
              href={contact.profileUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              {contact.profileUrl}
            </a>
          </div>
        )}
      </dl>
      <p className="mt-2 text-xs text-app-textMuted">{lastContactedLabel}</p>
      {contact.notes && <p className="mt-2 text-sm text-app-text">{contact.notes}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          aria-label={t('jobDetail.contacts.editContactLabel', { name: contact.name })}
          disabled={isDisabled}
          onClick={handleEdit}
          size="sm"
        >
          {t('jobDetail.contacts.editContact')}
        </Button>
        <Button
          aria-busy={isDeleting}
          aria-label={t('jobDetail.contacts.deleteContactLabel', { name: contact.name })}
          disabled={isDisabled}
          onClick={() => onDeleteContact(contact.id)}
          size="sm"
          variant="danger"
        >
          {t('jobDetail.contacts.deleteContact')}
        </Button>
      </div>
    </li>
  );
};

const MemoizedJobDetailContactItem = memo(JobDetailContactItem);

/**
 * Renders and manages a job's contacts against the backend.
 *
 * @param {IJobDetailContactsPanelProps} props Component props.
 * @returns {JSX.Element} Job contacts panel.
 */
const JobDetailContactsPanelComponent: FC<IJobDetailContactsPanelProps> = ({ jobId }) => {
  const { t } = useTranslation();
  const {
    contacts,
    createJobContact,
    deleteJobContact,
    deletingContactId,
    isCreating,
    isLoading,
    isMutating,
    loadError,
    mutationError,
    reload,
    updateJobContact,
    updatingContactId,
  } = useJobContacts(jobId);
  const [newContactValues, setNewContactValues] =
    useState<IContactFormValues>(emptyContactFormValues);
  const canCreateContact = Boolean(newContactValues.name.trim() && !isMutating);

  /**
   * The form is only reset once the create request actually succeeds, the
   * same reason `JobDetailNotesPanel`'s create form waits: resetting it
   * beforehand would lose the user's input the moment a failed request
   * left them with nothing to retry but retyping it.
   */
  const handleCreateContact = async (event: ReactSubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canCreateContact) return;

    try {
      await createJobContact(newContactValues);
      setNewContactValues(emptyContactFormValues);
    } catch {
      // Error is already recorded in request state and rendered from it.
    }
  };

  const handleSaveContact = useCallback(
    (contactId: string, values: IContactFormValues) => {
      updateJobContact(contactId, values).catch(() => {
        // Error is already recorded in request state and rendered from it.
      });
    },
    [updateJobContact],
  );

  const handleDeleteContact = useCallback(
    (contactId: string) => {
      deleteJobContact(contactId).catch(() => {
        // Error is already recorded in request state and rendered from it.
      });
    },
    [deleteJobContact],
  );

  if (isLoading)
    return (
      <Card title={t('jobDetail.contacts.title')}>
        <LoadingState label={t('jobDetail.contacts.loading')} />
      </Card>
    );

  if (loadError)
    return (
      <Card title={t('jobDetail.contacts.title')}>
        <ErrorState
          action={<Button onClick={reload}>{t('jobs.loadErrorRetry')}</Button>}
          description={loadError.message}
          title={t('jobDetail.contacts.loadErrorTitle')}
        />
      </Card>
    );

  return (
    <Card title={t('jobDetail.contacts.title')}>
      {mutationError && <Alert className="mb-4">{mutationError.message}</Alert>}

      <form className="mb-4 space-y-3" onSubmit={handleCreateContact}>
        <ContactFields
          disabled={isMutating}
          onChange={setNewContactValues}
          values={newContactValues}
        />
        <Button aria-busy={isCreating} disabled={!canCreateContact} type="submit">
          {t('jobDetail.contacts.addContact')}
        </Button>
      </form>

      <ul className="space-y-4">
        {contacts.map((contact) => (
          <MemoizedJobDetailContactItem
            contact={contact}
            isDeleting={deletingContactId === contact.id}
            isDisabled={isMutating}
            isSaving={updatingContactId === contact.id}
            key={contact.id}
            onDeleteContact={handleDeleteContact}
            onSaveContact={handleSaveContact}
          />
        ))}
      </ul>
    </Card>
  );
};

export const JobDetailContactsPanel = memo(JobDetailContactsPanelComponent);
