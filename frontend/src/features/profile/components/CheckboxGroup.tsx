/**
 * Props used by one checkbox group.
 */
interface ICheckboxGroupProps<T extends string> {
  disabled: boolean;
  label: (value: T) => string;
  legend: string;
  onChange: (values: T[]) => void;
  options: readonly T[];
  values: T[];
}

/**
 * A fieldset of checkboxes for a fixed set of choices. Checked values keep
 * the options' order, while stored values outside the options are preserved.
 *
 * @param {ICheckboxGroupProps<T>} props Component props.
 * @returns {JSX.Element} Checkbox group.
 */
export const CheckboxGroup = <T extends string>({
  disabled,
  label,
  legend,
  onChange,
  options,
  values,
}: ICheckboxGroupProps<T>) => (
  <fieldset>
    <legend className="mb-2 text-sm font-medium text-app-text">{legend}</legend>
    <div className="flex flex-wrap gap-4">
      {options.map((option) => (
        <label className="inline-flex items-center gap-2 text-sm text-app-text" key={option}>
          <input
            checked={values.includes(option)}
            className="h-4 w-4 rounded border-app-border text-primary-600"
            disabled={disabled}
            onChange={(event) =>
              onChange(
                event.target.checked
                  ? [
                      ...options.filter(
                        (candidate) => candidate === option || values.includes(candidate),
                      ),
                      ...values.filter((value) => !options.includes(value)),
                    ]
                  : values.filter((candidate) => candidate !== option),
              )
            }
            type="checkbox"
          />
          {label(option)}
        </label>
      ))}
    </div>
  </fieldset>
);
