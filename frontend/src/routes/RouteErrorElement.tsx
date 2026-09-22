import type { FC } from 'react';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';

import { Button, ErrorState } from '../components/ui';
import { useTranslation } from '../i18n';
import { APP_PATHS } from './paths';

/**
 * Renders a translated, accessible fallback when a route cannot load or
 * render - including a render exception thrown by a route's own component,
 * which `errorElement` catches the same way it catches a `loader` failure.
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
      <div className="w-full max-w-xl">
        {status && (
          <p className="mb-2 text-center text-sm font-semibold text-danger-700">{status}</p>
        )}
        <ErrorState
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => navigate(APP_PATHS.DASHBOARD)}>
                {t('route.error.goToDashboard')}
              </Button>
              <Button onClick={() => window.location.reload()} variant="secondary">
                {t('route.error.retry')}
              </Button>
            </div>
          }
          description={t('route.error.description')}
          title={t('route.error.title')}
        />
      </div>
    </main>
  );
};
