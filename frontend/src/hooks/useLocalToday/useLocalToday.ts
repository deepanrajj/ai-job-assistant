import { useEffect, useState } from 'react';

/**
 * Delay past local midnight before re-reading the clock, so a timer that
 * fires a moment early still lands on the new day.
 */
const MIDNIGHT_MARGIN_MS = 1000;

/**
 * Returns the current moment, refreshed once each local day: the value
 * changes, and the component re-renders, shortly after every local
 * midnight. Anything that depends on "today" - due states, week ranges,
 * ages in days - stays correct in a tab left open overnight, without
 * re-rendering more than once a day.
 *
 * Its identity only changes at midnight, so it is safe in `useMemo` and
 * `memo` dependencies. A timer delayed by a sleeping device or a throttled
 * background tab still fires, late, and catches up then.
 *
 * @returns {Date} The moment this value was last refreshed.
 */
export const useLocalToday = (): Date => {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    const nextMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const timeoutId = window.setTimeout(
      () => setToday(new Date()),
      nextMidnight.getTime() - Date.now() + MIDNIGHT_MARGIN_MS,
    );

    return () => window.clearTimeout(timeoutId);
  }, [today]);

  return today;
};
