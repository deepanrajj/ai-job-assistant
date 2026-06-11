import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button, Card, EmptyState } from '../../components/ui';
import { useTranslation } from '../../i18n';
import { APP_PATHS } from '../../routes/paths';

/**
 * Renders a helpful fallback for URLs that do not match an application route.
 *
 * @returns {JSX.Element} Not found page.
 */
export const NotFoundPage: FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Card padding="none">
      <EmptyState
        action={
          <Button onClick={() => navigate(APP_PATHS.DASHBOARD)}>
            {t('route.notFound.goToDashboard')}
          </Button>
        }
        description={t('route.notFound.description')}
        title={t('route.notFound.message')}
      />
    </Card>
  );
};
