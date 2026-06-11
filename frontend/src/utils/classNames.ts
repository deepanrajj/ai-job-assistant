/**
 * Represents supported values passed into the classNames helper.
 */
type TClassNameValue = string | false | null | undefined;

/**
 * Joins conditional class names into a single className string.
 *
 * @param classes Class name values to include when truthy.
 * @returns {string} Space-separated className string.
 */
export const classNames = (...classes: TClassNameValue[]): string =>
  classes.filter(Boolean).join(' ');
