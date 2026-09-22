import type { FC } from 'react';

import { ComingSoonPage } from '../../pages/comingSoon/ComingSoonPage';
import { useTranslation } from '../../i18n';

/**
 * Renders the Discover route as a placeholder until its workflow exists.
 *
 * @returns {JSX.Element} Discover route content.
 */
export const Component: FC = () => {
  const { t } = useTranslation();

  return (
    <ComingSoonPage
      description={t('route.comingSoon.description')}
      title={t('route.comingSoon.title')}
    />
  );
};
