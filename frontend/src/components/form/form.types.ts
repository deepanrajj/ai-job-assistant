import type { ReactNode } from 'react';
import type { FieldValues, Path, UseControllerProps } from 'react-hook-form';

import type { IInputProps, ISelectProps, ITextareaProps } from '../ui';

/**
 * React Hook Form validation rules supported by a field config.
 */
export type TFieldRules<TFieldValues extends FieldValues> = UseControllerProps<
  TFieldValues,
  Path<TFieldValues>
>['rules'];

/**
 * Supported grid column counts for generated form fields.
 */
export type TFormFieldColumns = 1 | 2;

/**
 * Props for a React Hook Form controlled input wrapper.
 */
export type TFormInputProps<TFieldValues extends FieldValues> = Omit<
  IInputProps,
  'error' | 'name' | 'onBlur' | 'onChange' | 'ref' | 'value'
> & {
  name: Path<TFieldValues>;
  rules?: TFieldRules<TFieldValues>;
};

/**
 * Props for a React Hook Form controlled select wrapper.
 */
export type TFormSelectProps<TFieldValues extends FieldValues> = Omit<
  ISelectProps,
  'error' | 'name' | 'onBlur' | 'onChange' | 'ref' | 'value'
> & {
  name: Path<TFieldValues>;
  rules?: TFieldRules<TFieldValues>;
};

/**
 * Props for a React Hook Form controlled textarea wrapper.
 */
export type TFormTextareaProps<TFieldValues extends FieldValues> = Omit<
  ITextareaProps,
  'error' | 'name' | 'onBlur' | 'onChange' | 'ref' | 'value'
> & {
  name: Path<TFieldValues>;
  rules?: TFieldRules<TFieldValues>;
};

/**
 * Shared config fields used by all generated form controls.
 */
export interface IFieldBase<TFieldValues extends FieldValues> {
  className?: string;
  containerClassName?: string;
  helperText?: string;
  label?: string;
  name: Path<TFieldValues>;
  rules?: TFieldRules<TFieldValues>;
  ariaLabel?: string;
}

/**
 * Config for rendering an input field from a field schema.
 */
export interface IInputFieldConfig<
  TFieldValues extends FieldValues,
> extends IFieldBase<TFieldValues> {
  inputType?: IInputProps['type'];
  leftIcon?: ReactNode;
  placeholder?: string;
  type: 'input';
}

/**
 * Config for rendering a select field from a field schema.
 */
export interface ISelectFieldConfig<
  TFieldValues extends FieldValues,
> extends IFieldBase<TFieldValues> {
  options: {
    disabled?: boolean;
    label: string;
    value: ISelectProps['value'];
  }[];
  type: 'select';
}

/**
 * Config for rendering a textarea field from a field schema.
 */
export interface ITextareaFieldConfig<
  TFieldValues extends FieldValues,
> extends IFieldBase<TFieldValues> {
  placeholder?: string;
  rows?: ITextareaProps['rows'];
  type: 'textarea';
}

/**
 * Supported generated form field config variants.
 */
export type TFormFieldConfig<TFieldValues extends FieldValues> =
  | IInputFieldConfig<TFieldValues>
  | ISelectFieldConfig<TFieldValues>
  | ITextareaFieldConfig<TFieldValues>;
