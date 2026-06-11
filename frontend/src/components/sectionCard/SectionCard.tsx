import type { FC, ReactNode } from 'react';

import { Card } from '../ui/Card';

/**
 * Props used by the titled section card.
 */
interface ISectionCardProps {
  title: string;
  children: ReactNode;
}

/**
 * Renders a titled section container around arbitrary child content.
 *
 * @param {ISectionCardProps} props Component props.
 * @param {string} props.title Section heading shown in the card header.
 * @param {ReactNode} props.children Content rendered inside the section body.
 * @returns {JSX.Element} Framed section card.
 */
export const SectionCard: FC<ISectionCardProps> = ({ title, children }) => (
  <Card title={title} bodyClassName="px-5 py-4" padding="none">
    {children}
  </Card>
);
