import type { FC } from 'react';
import { NavLink } from 'react-router-dom';

import { Tooltip } from '../../ui/Tooltip';
import { useTranslation } from '../../../i18n';
import { navItems } from '../appShell.constants';
import type { TNavLinkClassName } from '../appShell.types';

/**
 * Props used by the app shell navigation component.
 */
interface IAppShellNavigationProps {
  ariaLabel?: string;
  className: string;
  collapsed?: boolean;
  id?: string;
  linkClassName: TNavLinkClassName;
  onNavigate?: (path: string) => void;
}

/**
 * Renders the app shell navigation links.
 *
 * @param {IAppShellNavigationProps} props Component props.
 * @param {string} props.ariaLabel Accessible navigation label, omitted inside a named dialog.
 * @param {string} props.className Navigation container class name.
 * @param {boolean} props.collapsed Whether link labels are visually hidden.
 * @param {TNavLinkClassName} props.linkClassName React Router nav link class builder.
 * @param {string} props.id Optional id so a toggle can reference the navigation.
 * @param {(path: string) => void} props.onNavigate Callback with the selected link's path.
 * @returns {JSX.Element} App shell navigation.
 */
export const AppShellNavigation: FC<IAppShellNavigationProps> = ({
  ariaLabel,
  className,
  collapsed = false,
  id,
  linkClassName,
  onNavigate,
}) => {
  const { t } = useTranslation();

  return (
    <nav className={className} aria-label={ariaLabel} id={id}>
      {navItems.map((item) => {
        // Icons are component references so the same nav config works in desktop and mobile.
        const Icon = item.icon;
        const label = t(item.labelKey);
        const link = (
          <NavLink
            key={item.id}
            to={item.path}
            className={linkClassName}
            onClick={() => onNavigate?.(item.path)}
          >
            <Icon />
            <span className={collapsed ? 'sr-only' : undefined}>{label}</span>
          </NavLink>
        );

        // Icon-only links show their label on hover and keyboard focus.
        return collapsed ? (
          <Tooltip className="flex" content={label} key={item.id} placement="right">
            {link}
          </Tooltip>
        ) : (
          link
        );
      })}
    </nav>
  );
};
