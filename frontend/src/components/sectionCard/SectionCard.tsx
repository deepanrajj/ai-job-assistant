import type { FC, ReactNode } from 'react';

interface ISectionCardProps {
  title: string;
  children: ReactNode;
}

export const SectionCard: FC<ISectionCardProps> = ({ title, children }) => (
  <div className='overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm'>
    <div className='border-b border-app-borderSoft bg-app-surface2 px-5 py-4'>
      <h3 className='text-lg font-semibold text-app-text'>{title}</h3>
    </div>
    <div className='px-5 py-4'>{children}</div>
  </div>
);
