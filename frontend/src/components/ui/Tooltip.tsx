import {
  cloneElement,
  useId,
  useState,
  type FocusEventHandler,
  type FC,
  type HTMLAttributes,
  type MouseEventHandler,
  type ReactElement,
  type ReactNode,
} from 'react';

import { classNames } from '../../utils';

type TTooltipTriggerProps = HTMLAttributes<HTMLElement> & {
  'aria-describedby'?: string;
};

/**
 * Props used by the shared tooltip.
 */
interface ITooltipProps {
  children: ReactElement<TTooltipTriggerProps>;
  content: ReactNode;
}

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
export const Tooltip: FC<ITooltipProps> = ({ children, content }) => {
  const tooltipId = useId();
  const [isVisible, setIsVisible] = useState(false);

  const describedBy = classNames(children.props['aria-describedby'], isVisible && tooltipId);

  const trigger = cloneElement(children, {
    'aria-describedby': describedBy || undefined,
    onBlur: composeTooltipHandler<FocusEventHandler<HTMLElement>>(children.props.onBlur, () =>
      setIsVisible(false),
    ),
    onFocus: composeTooltipHandler<FocusEventHandler<HTMLElement>>(children.props.onFocus, () =>
      setIsVisible(true),
    ),
    onMouseEnter: composeTooltipHandler<MouseEventHandler<HTMLElement>>(
      children.props.onMouseEnter,
      () => setIsVisible(true),
    ),
    onMouseLeave: composeTooltipHandler<MouseEventHandler<HTMLElement>>(
      children.props.onMouseLeave,
      () => setIsVisible(false),
    ),
  });

  return (
    <span className="relative inline-flex">
      {trigger}
      {isVisible && (
        <span
          className="absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-app-text px-2 py-1 text-xs font-medium text-white shadow-sm"
          id={tooltipId}
          role="tooltip"
        >
          {content}
        </span>
      )}
    </span>
  );
};
