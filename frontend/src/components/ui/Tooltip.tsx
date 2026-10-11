import {
  cloneElement,
  useEffect,
  useId,
  useState,
  type FocusEventHandler,
  type FC,
  type HTMLAttributes,
  type MouseEventHandler,
  type ReactElement,
  type ReactNode,
  type SyntheticEvent,
} from 'react';

import { classNames } from '../../utils';

type TTooltipTriggerProps = HTMLAttributes<HTMLElement> & {
  'aria-describedby'?: string;
};

/**
 * Side of the trigger the tooltip appears on.
 */
type TTooltipPlacement = 'right' | 'top';

/**
 * Props used by the shared tooltip.
 */
interface ITooltipProps {
  children: ReactElement<TTooltipTriggerProps>;
  className?: string;
  content: ReactNode;
  // `right` uses fixed positioning so a scrolling container cannot clip the tooltip.
  placement?: TTooltipPlacement;
}

/**
 * Viewport position of a `right` tooltip, measured from its trigger.
 */
interface ITooltipAnchor {
  left: number;
  top: number;
}

/** Gap in pixels between a trigger and its `right` tooltip. */
const RIGHT_TOOLTIP_OFFSET = 12;

/**
 * Combines an existing trigger handler with the tooltip visibility handler.
 *
 * @param {THandler | undefined} originalHandler Handler already defined on the trigger.
 * @param {THandler} tooltipHandler Handler that updates tooltip visibility.
 * @returns {THandler} Combined event handler.
 */
const composeTooltipHandler = <THandler extends (...args: never[]) => void>(
  originalHandler: THandler | undefined,
  tooltipHandler: THandler,
): THandler =>
  ((...args) => {
    originalHandler?.(...args);
    tooltipHandler(...args);
  }) as THandler;

/**
 * Renders short helper text for an interactive trigger on hover or focus.
 *
 * @param {ITooltipProps} props Component props.
 * @returns {JSX.Element} Tooltip wrapper.
 */
export const Tooltip: FC<ITooltipProps> = ({
  children,
  className = 'relative inline-flex',
  content,
  placement = 'top',
}) => {
  const tooltipId = useId();
  const [isVisible, setIsVisible] = useState(false);
  const [anchor, setAnchor] = useState<ITooltipAnchor | null>(null);

  const show = (event: SyntheticEvent<HTMLElement>) => {
    if (placement === 'right') {
      const rect = event.currentTarget.getBoundingClientRect();
      setAnchor({ left: rect.right + RIGHT_TOOLTIP_OFFSET, top: rect.top + rect.height / 2 });
    }
    setIsVisible(true);
  };

  // A `right` tooltip is placed once in viewport coordinates, so hide it rather than let it drift
  // away from its trigger when anything scrolls or the window resizes.
  useEffect(() => {
    if (!isVisible || placement !== 'right') return;

    const hide = () => setIsVisible(false);
    window.addEventListener('scroll', hide, { capture: true, passive: true });
    window.addEventListener('resize', hide);
    return () => {
      window.removeEventListener('scroll', hide, { capture: true });
      window.removeEventListener('resize', hide);
    };
  }, [isVisible, placement]);

  const describedBy = classNames(children.props['aria-describedby'], isVisible && tooltipId);

  const trigger = cloneElement(children, {
    'aria-describedby': describedBy || undefined,
    onBlur: composeTooltipHandler<FocusEventHandler<HTMLElement>>(children.props.onBlur, () =>
      setIsVisible(false),
    ),
    onFocus: composeTooltipHandler<FocusEventHandler<HTMLElement>>(children.props.onFocus, show),
    onMouseEnter: composeTooltipHandler<MouseEventHandler<HTMLElement>>(
      children.props.onMouseEnter,
      show,
    ),
    onMouseLeave: composeTooltipHandler<MouseEventHandler<HTMLElement>>(
      children.props.onMouseLeave,
      () => setIsVisible(false),
    ),
  });

  return (
    <span className={className}>
      {trigger}
      {isVisible && (
        <span
          className={classNames(
            'whitespace-nowrap rounded-md bg-app-text px-2 py-1 text-xs font-medium text-white shadow-sm',
            placement === 'right'
              ? 'fixed z-50 -translate-y-1/2'
              : 'absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2',
          )}
          id={tooltipId}
          role="tooltip"
          style={placement === 'right' && anchor ? anchor : undefined}
        >
          {content}
        </span>
      )}
    </span>
  );
};
