import type { FC } from 'react';
import { useParams } from 'react-router-dom';

import { JobDetailPage } from '../../pages/jobDetail/JobDetailPage';
import { useJobs } from '../../features/jobs';

/**
 * Renders the job detail route with saved local job detail data.
 *
 * @returns {JSX.Element} Job detail route content.
 */
export const Component: FC = () => {
  const { jobId = '' } = useParams();
  const {
    createNote,
    createTask,
    deleteJob,
    deleteNote,
    deleteTask,
    jobs,
    saveJobAiAnalysis,
    updateJobStatus,
    updateNote,
    updateTask,
  } = useJobs();

  return (
    <JobDetailPage
      jobId={jobId}
      jobs={jobs}
      onAnalyzeJob={saveJobAiAnalysis}
      onCreateNote={createNote}
      onCreateTask={createTask}
      onDeleteJob={deleteJob}
      onDeleteNote={deleteNote}
      onDeleteTask={deleteTask}
      onStatusChange={updateJobStatus}
      onUpdateNote={updateNote}
      onUpdateTask={updateTask}
    />
  );
};
