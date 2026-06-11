import type { FC } from 'react';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';

import { Button, Card } from '../components/ui';
import { useTranslation } from '../i18n';
import { APP_PATHS } from './paths';

/**
 * Renders a translated fallback when a route cannot load or render.
 *
 * @returns {JSX.Element} Application route error fallback.
 */
export const RouteErrorElement: FC = () => {
  const error = useRouteError();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const status = isRouteErrorResponse(error) ? error.status : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-app-bg px-4 py-12 text-app-text">
      <Card className="w-full max-w-xl">
        {status && <p className="text-sm font-semibold text-danger-700">{status}</p>}
        <h1 className="mt-2 text-2xl font-semibold">{t('route.error.title')}</h1>
        <p className="mt-2 text-sm leading-6 text-app-textMuted">{t('route.error.description')}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => navigate(APP_PATHS.DASHBOARD)}>
            {t('route.error.goToDashboard')}
          </Button>
          <Button onClick={() => window.location.reload()} variant="secondary">
            {t('route.error.retry')}
          </Button>
        </div>
      </Card>
    </main>
  );
};
