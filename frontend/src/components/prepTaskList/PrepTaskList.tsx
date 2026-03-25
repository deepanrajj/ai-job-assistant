import type { FC } from 'react';

interface IPrepTaskListProps {
  tasks: string[];
}

export const PrepTaskList: FC<IPrepTaskListProps> = ({ tasks }) => (
  <ul className='space-y-3'>
    {tasks.map((task) => (
      <li key={task} className='flex items-start gap-3'>
        <span className='mt-1.5 h-2.5 w-2.5 rounded-full bg-emerald-400' />
        <span className='text-sm text-app-textSoft'>{task}</span>
      </li>
    ))}
  </ul>
);
