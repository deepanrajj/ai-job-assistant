import type { FC } from 'react';
import { NavLink } from 'react-router-dom';

import { useTranslation } from '../../../i18n';
import { navItems } from '../appShell.constants';
import type { TNavLinkClassName } from '../appShell.types';

/**
 * Props used by the app shell navigation component.
 */
interface IAppShellNavigationProps {
  ariaLabel: string;
  className: string;
  linkClassName: TNavLinkClassName;
}

/**
 * Renders the app shell navigation links.
 *
 * @param {IAppShellNavigationProps} props Component props.
 * @param {string} props.ariaLabel Accessible navigation label.
 * @param {string} props.className Navigation container class name.
 * @param {TNavLinkClassName} props.linkClassName React Router nav link class builder.
 * @returns {JSX.Element} App shell navigation.
 */
export const AppShellNavigation: FC<IAppShellNavigationProps> = ({
  ariaLabel,
  className,
  linkClassName,
}) => {
  const { t } = useTranslation();

  return (
    <nav className={className} aria-label={ariaLabel}>
      {navItems.map((item) => {
        // Icons are component references so the same nav config works in desktop and mobile.
        const Icon = item.icon;

        return (
          <NavLink key={item.id} to={item.path} className={linkClassName}>
            <Icon />
            <span>{t(item.labelKey)}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
