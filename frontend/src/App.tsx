import { useState } from 'react';

import {
  PrepTaskList,
  SectionCard,
  SeniorityBadge,
  SkillList
} from './components';
import type { JobAiAnalysis } from './types';
import './App.css';
import { analyzeJobDescription } from './services';

function App() {
  const [description, setDescription] =
    useState(`We are looking for a Senior Frontend Developer with experience in React, TypeScript, and modern UI frameworks.

  The ideal candidate should have knowledge of responsive design, RESTful APIs, and a passion for building intuitive user interfaces.`);
  const [question, setQuestion] = useState(
    'What should I prepare for this role?'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<JobAiAnalysis | null>(null);

  const handleAnalyze = async () => {
    if (!description.trim()) {
      setError('Please paste a job description first.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const result = await analyzeJobDescription({ description });
      setData(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-app-bg text-app-text'>
      <header className='border-b border-app-border bg-app-bg'>
        <div className='mx-auto flex max-w-7xl items-center gap-4 px-6 py-5 lg:px-8'>
          <div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-sm'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-8 w-8'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth='1.8'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M9.75 3.75h4.5a3 3 0 013 3v1.5h.75A2.25 2.25 0 0120.25 10.5v5.25A2.25 2.25 0 0118 18H6a2.25 2.25 0 01-2.25-2.25V10.5A2.25 2.25 0 016 8.25h.75v-1.5a3 3 0 013-3z'
              />
            </svg>
          </div>

          <div>
            <h1 className='text-3xl font-bold tracking-tight text-app-text'>
              AI Job Description Assistant
            </h1>
            <p className='mt-1 text-sm text-app-text-muted'>
              Paste a job description, analyze it with AI, and prepare smarter.
            </p>
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-7xl px-6 py-8 lg:px-8'>
        <div className='grid grid-cols-1 gap-8 xl:grid-cols-[1.15fr_0.85fr]'>
          <section className='rounded-3xl border border-app-border bg-app-surface p-6 shadow-sm'>
            <h2 className='mb-4 text-xl font-semibold text-primary-400'>
              Job Description Input
            </h2>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className='min-h-[320px] w-full rounded-xl border border-app-border bg-app-surface2 p-4 text-app-text placeholder:text-app-text-muted'
              placeholder='Paste the full job description here...'
            />

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className='mt-4 w-full rounded-xl bg-primary-600 py-3 text-white hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60'
            >
              {loading ? 'Analyzing...' : 'Analyze with AI'}
            </button>

            {error && (
              <div className='mt-4 rounded-xl border border-red-900 bg-red-950/40 p-3 text-sm text-red-300'>
                {error}
              </div>
            )}
          </section>

          <section className='space-y-4'>
            {!loading && !data && !error && (
              <SectionCard title='AI Analysis'>
                <p className='text-app-text-muted'>
                  Paste a job description and click “Analyze with AI” to see the
                  results here.
                </p>
              </SectionCard>
            )}

            {loading && (
              <>
                <SectionCard title='Summary'>
                  <div className='h-20 animate-pulse rounded-lg bg-app-surface2' />
                </SectionCard>

                <SectionCard title='Required Skills'>
                  <div className='space-y-3'>
                    <div className='h-4 animate-pulse rounded bg-app-surface2' />
                    <div className='h-4 animate-pulse rounded bg-app-surface2' />
                    <div className='h-4 animate-pulse rounded bg-app-surface2' />
                  </div>
                </SectionCard>

                <SectionCard title='Preparation Tasks'>
                  <div className='space-y-3'>
                    <div className='h-4 animate-pulse rounded bg-app-surface2' />
                    <div className='h-4 animate-pulse rounded bg-app-surface2' />
                    <div className='h-4 animate-pulse rounded bg-app-surface2' />
                  </div>
                </SectionCard>
              </>
            )}

            {data && !loading && (
              <>
                <SectionCard title='Summary'>
                  <p className='text-app-text-soft'>{data.summary}</p>
                </SectionCard>

                <SectionCard title='Required Skills'>
                  <SkillList items={data.requiredSkills} />
                </SectionCard>

                <SectionCard title='Nice to Have Skills'>
                  <SkillList items={data.niceToHaveSkills} />
                </SectionCard>

                <SectionCard title='Seniority'>
                  <SeniorityBadge seniority={data.seniority} />
                </SectionCard>

                <SectionCard title='Preparation Tasks'>
                  <PrepTaskList tasks={data.prepTasks} />
                </SectionCard>

                <SectionCard title='Ask AI'>
                  <div className='flex gap-2'>
                    <input
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className='flex-1 rounded-lg border border-app-border bg-app-surface2 p-2 text-app-text placeholder:text-app-text-muted'
                      placeholder='What should I prepare for this role?'
                    />
                    <button
                      type='button'
                      className='rounded-lg bg-primary-600 px-4 text-white hover:bg-primary-500'
                    >
                      Ask
                    </button>
                  </div>
                </SectionCard>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
