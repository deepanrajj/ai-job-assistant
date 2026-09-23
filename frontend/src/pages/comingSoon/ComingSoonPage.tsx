import type { FC } from 'react';

import { Card, EmptyState } from '../../components/ui';

/**
 * Props used by the coming soon page.
 */
interface IComingSoonPageProps {
  description: string;
  title: string;
}

/**
 * Renders an accessible placeholder for a final nav item with no workflow yet.
 *
 * @param {IComingSoonPageProps} props Component props.
 * @returns {JSX.Element} Coming soon page.
 */
export const ComingSoonPage: FC<IComingSoonPageProps> = ({ description, title }) => (
  <Card padding="none">
    <EmptyState description={description} title={title} />
  </Card>
);
