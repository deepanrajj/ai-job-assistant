/**
 * Stores viewport breakpoints that match Tailwind 4's default screens. They are in rem, like
 * Tailwind's, so JS and CSS agree when the browser's default font size is not 16px.
 */
export const RESPONSIVE_BREAKPOINTS = {
  sm: '40rem',
  md: '48rem',
  lg: '64rem',
  xl: '80rem',
  '2xl': '96rem',
} as const;
