import type { FC } from 'react';

interface ISkillListProps {
  items: string[];
}

export const SkillList: FC<ISkillListProps> = ({ items }) => (
  <ul className='space-y-3'>
    {items.map((item) => (
      <li key={item} className='flex items-center gap-3'>
        <span className='h-2.5 w-2.5 rounded-full bg-primary-400' />
        <span className='text-sm text-app-textSoft'>{item}</span>
      </li>
    ))}
  </ul>
);
