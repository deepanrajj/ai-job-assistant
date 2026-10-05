import { useState, type FC, type SubmitEvent as ReactSubmitEvent } from 'react';

import { Alert, Button, Card, Input, Select, Textarea } from '../../../components/ui';
import {
  isValidProfileUrl,
  type TProfileLinkEntry,
  type TProfileTextEntry,
  type TResumeProfileContent,
  type TResumeProfileTargetRole,
} from '../../../services';
import { useTranslation } from '../../../i18n';
import {
  addProfileEntry,
  isResumeProfileValid,
  moveProfileEntry,
  normalizeProfileContent,
  removeProfileEntry,
  updateProfileEntry,
} from '../profileEntries.utils';
import type { AppError } from '../../../errors';
import {
  RESUME_PROFILE_TARGET_ROLE_TRANSLATION_KEYS,
  RESUME_PROFILE_TARGET_ROLES,
} from '../profile.constants';

/**
 * Props used by the resume profile editor.
 */
interface IResumeProfileEditorProps {
  error: AppError | null;
  initialContent: TResumeProfileContent;
  initialName: string;
  isSaving: boolean;
  onCancel: () => void;
  onSave: (name: string, content: TResumeProfileContent) => Promise<void>;
  title: string;
}

/**
 * Props used by the shared editor for an ordered list of text entries.
 */
interface ITextEntryListEditorProps {
  addLabel: string;
  disabled: boolean;
  entries: TProfileTextEntry[];
  entryLabel: (position: number) => string;
  heading: string;
  onChange: (entries: TProfileTextEntry[]) => void;
}

/**
 * Edits an ordered list of text entries - highlights or education - with
 * buttons to move each up or down and remove it. Every control names its
 * entry by position, so it works by keyboard and screen reader. Entry ids
 * are never touched here; the helpers keep them.
 *
 * @param {ITextEntryListEditorProps} props Component props.
 * @returns {JSX.Element} Entry list editor.
 */
const TextEntryListEditor: FC<ITextEntryListEditorProps> = ({
  addLabel,
  disabled,
  entries,
  entryLabel,
  heading,
  onChange,
}) => {
  const { t } = useTranslation();

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-app-text">{heading}</legend>
      <ol className="space-y-3">
        {entries.map((entry, index) => {
          const label = entryLabel(index + 1);

          return (
            <li className="rounded-lg border border-app-borderSoft p-3" key={entry.id}>
              <Textarea
                disabled={disabled}
                label={label}
                onChange={(event) =>
                  onChange(updateProfileEntry(entries, entry.id, { text: event.target.value }))
                }
                value={entry.text}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  aria-label={t('profile.editor.moveUp', { entry: label })}
                  disabled={disabled || index === 0}
                  onClick={() => onChange(moveProfileEntry(entries, entry.id, -1))}
                  size="sm"
                  variant="ghost"
                >
                  {t('profile.editor.up')}
                </Button>
                <Button
                  aria-label={t('profile.editor.moveDown', { entry: label })}
                  disabled={disabled || index === entries.length - 1}
                  onClick={() => onChange(moveProfileEntry(entries, entry.id, 1))}
                  size="sm"
                  variant="ghost"
                >
                  {t('profile.editor.down')}
                </Button>
                <Button
                  aria-label={t('profile.editor.remove', { entry: label })}
                  disabled={disabled}
                  onClick={() => onChange(removeProfileEntry(entries, entry.id))}
                  size="sm"
                  variant="danger"
                >
                  {t('profile.editor.removeShort')}
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
      <Button
        disabled={disabled}
        onClick={() => onChange(addProfileEntry(entries, { text: '' }))}
        size="sm"
        variant="secondary"
      >
        {addLabel}
      </Button>
    </fieldset>
  );
};

/**
 * Props used by the link list editor.
 */
interface ILinkListEditorProps {
  disabled: boolean;
  links: TProfileLinkEntry[];
  onChange: (links: TProfileLinkEntry[]) => void;
}

/**
 * Edits a profile's links: a label and an http(s) URL each, in order.
 *
 * @param {ILinkListEditorProps} props Component props.
 * @returns {JSX.Element} Link list editor.
 */
const LinkListEditor: FC<ILinkListEditorProps> = ({ disabled, links, onChange }) => {
  const { t } = useTranslation();

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-app-text">{t('profile.editor.links')}</legend>
      <ol className="space-y-3">
        {links.map((link, index) => {
          const label = t('profile.editor.linkLabel', { position: index + 1 });
          const urlIsValid = !link.url.trim() || isValidProfileUrl(link.url);

          return (
            <li className="rounded-lg border border-app-borderSoft p-3" key={link.id}>
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  disabled={disabled}
                  label={t('profile.editor.linkName', { entry: label })}
                  onChange={(event) =>
                    onChange(updateProfileEntry(links, link.id, { label: event.target.value }))
                  }
                  value={link.label}
                />
                <Input
                  disabled={disabled}
                  error={urlIsValid ? undefined : t('profile.editor.invalidUrl')}
                  label={t('profile.editor.linkUrl', { entry: label })}
                  onChange={(event) =>
                    onChange(updateProfileEntry(links, link.id, { url: event.target.value }))
                  }
                  value={link.url}
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  aria-label={t('profile.editor.moveUp', { entry: label })}
                  disabled={disabled || index === 0}
                  onClick={() => onChange(moveProfileEntry(links, link.id, -1))}
                  size="sm"
                  variant="ghost"
                >
                  {t('profile.editor.up')}
                </Button>
                <Button
                  aria-label={t('profile.editor.moveDown', { entry: label })}
                  disabled={disabled || index === links.length - 1}
                  onClick={() => onChange(moveProfileEntry(links, link.id, 1))}
                  size="sm"
                  variant="ghost"
                >
                  {t('profile.editor.down')}
                </Button>
                <Button
                  aria-label={t('profile.editor.remove', { entry: label })}
                  disabled={disabled}
                  onClick={() => onChange(removeProfileEntry(links, link.id))}
                  size="sm"
                  variant="danger"
                >
                  {t('profile.editor.removeShort')}
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
      <Button
        disabled={disabled}
        onClick={() => onChange(addProfileEntry(links, { label: '', url: '' }))}
        size="sm"
        variant="secondary"
      >
        {t('profile.editor.addLink')}
      </Button>
    </fieldset>
  );
};

/**
 * Edits one resume profile: name, target role, summary, highlights,
 * education, links, and notes. Saves the whole profile at once; the editor
 * stays open, with the entered values, if saving fails.
 *
 * @param {IResumeProfileEditorProps} props Component props.
 * @returns {JSX.Element} Resume profile editor.
 */
export const ResumeProfileEditor: FC<IResumeProfileEditorProps> = ({
  error,
  initialContent,
  initialName,
  isSaving,
  onCancel,
  onSave,
  title,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);
  const [content, setContent] = useState(initialContent);
  const canSave = !isSaving && isResumeProfileValid(name, content);

  const handleSubmit = async (event: ReactSubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSave) return;

    try {
      await onSave(name.trim(), normalizeProfileContent(content));
    } catch {
      // Error is already recorded in request state and rendered from it.
    }
  };

  return (
    <Card title={title}>
      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && <Alert>{error.message}</Alert>}
        <div className="grid gap-3 md:grid-cols-2">
          <Input
            disabled={isSaving}
            label={t('profile.editor.name')}
            onChange={(event) => setName(event.target.value)}
            value={name}
          />
          <Select
            disabled={isSaving}
            label={t('profile.editor.targetRole')}
            onChange={(event) =>
              setContent({ ...content, targetRole: event.target.value as TResumeProfileTargetRole })
            }
            value={content.targetRole}
          >
            {RESUME_PROFILE_TARGET_ROLES.map((role) => (
              <option key={role} value={role}>
                {t(RESUME_PROFILE_TARGET_ROLE_TRANSLATION_KEYS[role])}
              </option>
            ))}
          </Select>
        </div>
        <Textarea
          disabled={isSaving}
          label={t('profile.editor.summary')}
          onChange={(event) => setContent({ ...content, summary: event.target.value })}
          value={content.summary}
        />
        <TextEntryListEditor
          addLabel={t('profile.editor.addHighlight')}
          disabled={isSaving}
          entries={content.highlights}
          entryLabel={(position) => t('profile.editor.highlightLabel', { position })}
          heading={t('profile.editor.highlights')}
          onChange={(highlights) => setContent({ ...content, highlights })}
        />
        <TextEntryListEditor
          addLabel={t('profile.editor.addEducation')}
          disabled={isSaving}
          entries={content.education}
          entryLabel={(position) => t('profile.editor.educationLabel', { position })}
          heading={t('profile.editor.education')}
          onChange={(education) => setContent({ ...content, education })}
        />
        <LinkListEditor
          disabled={isSaving}
          links={content.links}
          onChange={(links) => setContent({ ...content, links })}
        />
        <Textarea
          disabled={isSaving}
          label={t('profile.editor.notes')}
          onChange={(event) => setContent({ ...content, notes: event.target.value })}
          value={content.notes}
        />
        <div className="flex flex-wrap gap-2">
          <Button aria-busy={isSaving} disabled={!canSave} type="submit">
            {t('profile.editor.save')}
          </Button>
          <Button disabled={isSaving} onClick={onCancel} variant="ghost">
            {t('profile.editor.cancel')}
          </Button>
        </div>
      </form>
    </Card>
  );
};
