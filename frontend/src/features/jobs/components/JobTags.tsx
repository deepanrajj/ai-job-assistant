import { memo, type FC } from 'react';

/**
 * Props used by the compact job tags list.
 */
interface IJobTagsProps {
  tags: string[];
}

/**
 * Renders compact tag chips for a job row.
 *
 * @param {IJobTagsProps} props Component props.
 * @param {string[]} props.tags Tag labels to display.
 * @returns {JSX.Element} Wrapped list of tag chips.
 */
const JobTagsComponent: FC<IJobTagsProps> = ({ tags }) => (
  <div className="mt-2 flex flex-wrap gap-1.5">
    {tags.map((tag) => (
      <span key={tag} className="rounded-full bg-app-surface2 px-2 py-1 text-xs text-app-textSoft">
        {tag}
      </span>
    ))}
  </div>
);

export const JobTags = memo(JobTagsComponent);
