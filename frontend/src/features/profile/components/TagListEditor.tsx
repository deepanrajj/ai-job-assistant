import { useRef, type FC, type KeyboardEvent } from 'react';

import { Button, Input } from '../../../components/ui';
import {
  getPreferenceValueError,
  MAX_PREFERENCE_LIST_LENGTH,
  MAX_PREFERENCE_VALUE_LENGTH,
  normalizePreferenceValue,
  type TPreferenceValueError,
} from '../../../services';
import { useTranslation } from '../../../i18n';

/**
 * Props used by the tag list editor.
 */
interface ITagListEditorProps {
  disabled: boolean;
  /** Text typed but not added yet; the form owns it so Save can add it. */
  draft: string;
  /** The input, for the form to focus when its text blocks a save. */
  inputRef?: (element: HTMLInputElement | null) => void;
  label: string;
  onChange: (values: string[]) => void;
  onDraftChange: (draft: string) => void;
  values: string[];
}

/**
 * Translation key explaining why a value cannot be added.
 */
const VALUE_ERROR_TRANSLATION_KEYS: Record<TPreferenceValueError, string> = {
  DUPLICATE: 'preferences.valueDuplicate',
  LIST_FULL: 'preferences.listFull',
  TOO_LONG: 'preferences.valueTooLong',
};

/**
 * Edits a list of short free-text values - skills, roles, locations,
 * keywords - as chips. A value is added with the Add button or Enter and
 * is normalized on the way in. A value that cannot be added - too long, a
 * duplicate in any letter case, or a full list - stays in the input with
 * the reason, rather than vanishing. Each chip has a remove button named
 * after its value.
 *
 * Focus never falls to the page: after adding, it returns to the input;
 * after removing, it moves to the next chip's remove button, or the
 * previous one, or the input when the list is empty.
 *
 * @param {ITagListEditorProps} props Component props.
 * @returns {JSX.Element} Tag list editor.
 */
export const TagListEditor: FC<ITagListEditorProps> = ({
  disabled,
  draft,
  inputRef,
  label,
  onChange,
  onDraftChange,
  values,
}) => {
  const { t } = useTranslation();
  const ownInputRef = useRef<HTMLInputElement | null>(null);
  const removeButtonRefs = useRef(new Map<string, HTMLButtonElement>());

  const setInputRef = (element: HTMLInputElement | null) => {
    ownInputRef.current = element;

    inputRef?.(element);
  };
  const valueError = getPreferenceValueError(values, draft);
  const canAdd = !disabled && Boolean(normalizePreferenceValue(draft)) && !valueError;
  const limits = { max: MAX_PREFERENCE_VALUE_LENGTH, maxItems: MAX_PREFERENCE_LIST_LENGTH };
  const isFull = values.length >= MAX_PREFERENCE_LIST_LENGTH;

  const add = () => {
    if (!canAdd) return;

    // Only the new value is checked against the limits, above; the
    // existing list is left as it is, so a stored value outside them stays.
    onChange([...values, normalizePreferenceValue(draft)]);
    onDraftChange('');
    ownInputRef.current?.focus();
  };

  const remove = (value: string) => {
    const index = values.indexOf(value);
    const neighbour = values[index + 1] ?? values[index - 1];
    const target = neighbour === undefined ? undefined : removeButtonRefs.current.get(neighbour);

    onChange(values.filter((candidate) => candidate !== value));
    (target ?? ownInputRef.current)?.focus();
  };

  /**
   * Enter adds the value instead of submitting the surrounding form.
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;

    event.preventDefault();
    add();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <Input
            disabled={disabled}
            error={valueError ? t(VALUE_ERROR_TRANSLATION_KEYS[valueError], limits) : undefined}
            helperText={isFull ? t('preferences.listFull', limits) : undefined}
            label={label}
            onChange={(event) => onDraftChange(event.target.value)}
            ref={setInputRef}
            onKeyDown={handleKeyDown}
            value={draft}
          />
        </div>
        <Button
          aria-label={t('preferences.addValue', { list: label })}
          disabled={!canAdd}
          onClick={add}
          variant="secondary"
        >
          {t('preferences.add')}
        </Button>
      </div>
      {values.length === 0 ? (
        <p className="text-sm text-app-textMuted">{t('preferences.noneYet')}</p>
      ) : (
        <ul
          aria-label={t('preferences.listLabel', { list: label })}
          className="flex flex-wrap gap-2"
        >
          {values.map((value) => (
            <li
              className="inline-flex items-center gap-1 rounded-full bg-app-surface2 py-1 pl-3 pr-1 text-sm text-app-text"
              key={value}
            >
              {value}
              <button
                aria-label={t('preferences.removeValue', { value })}
                className="cursor-pointer rounded-full px-1.5 text-app-textMuted hover:bg-app-border hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:cursor-not-allowed"
                disabled={disabled}
                onClick={() => remove(value)}
                ref={(element) => {
                  if (element) removeButtonRefs.current.set(value, element);
                  else removeButtonRefs.current.delete(value);
                }}
                type="button"
              >
                <span aria-hidden="true">×</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
