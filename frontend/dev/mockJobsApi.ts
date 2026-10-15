import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

/*
 * TEMPORARY DEV-ONLY MOCK - not part of the app bundle.
 *
 * Serves `/api/jobs` and its notes, tasks, contacts, and timeline, plus
 * `/api/timeline-events`, from memory inside the Vite dev server, so every
 * page has data to show without the backend and database running. Data
 * resets when the dev server restarts. Any other `/api` request still goes
 * to the backend proxy.
 *
 * Off by default. Turn it on with `MOCK_JOBS_API=true` in
 * `frontend/.env.development.local` (gitignored), then restart
 * `npm run dev:frontend`. Remove the line, or set it to false, to use the
 * real backend again.
 */

type TStatus = 'WISHLIST' | 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';

/**
 * A stored record; every resource here is a flat JSON object with an id.
 */
type TRecord = Record<string, unknown> & { id: string };

/**
 * One seed job and the statuses it moved through, with days ago for each.
 */
interface ISeedJob {
  company: string;
  description: string;
  history: [TStatus, number][];
  jobUrl: string | null;
  location: string | null;
  roleTitle: string;
  salaryMax: number | null;
  salaryMin: number | null;
  source: string | null;
}

const SEED_JOBS: ISeedJob[] = [
  {
    company: 'Celonis',
    description: 'Build the process mining UI with React and TypeScript.',
    history: [['WISHLIST', 2]],
    jobUrl: 'https://example.com/jobs/celonis-frontend',
    location: 'Munich',
    roleTitle: 'Senior Frontend Engineer',
    salaryMax: 95000,
    salaryMin: 80000,
    source: 'LINKEDIN',
  },
  {
    company: 'Personio',
    description: 'Own the platform services behind payroll.',
    history: [['WISHLIST', 9]],
    jobUrl: null,
    location: 'Berlin',
    roleTitle: 'Platform Engineer',
    salaryMax: null,
    salaryMin: null,
    source: 'COMPANY_WEBSITE',
  },
  {
    company: 'N26',
    description: 'Kotlin and Spring Boot services for payments.',
    history: [
      ['WISHLIST', 30],
      ['APPLIED', 27],
    ],
    jobUrl: 'https://example.com/jobs/n26-backend',
    location: 'Berlin',
    roleTitle: 'Backend Engineer',
    salaryMax: 90000,
    salaryMin: 75000,
    source: 'LINKEDIN',
  },
  {
    company: 'Zalando',
    description: 'Design system and storefront performance.',
    history: [['APPLIED', 12]],
    jobUrl: 'https://example.com/jobs/zalando-frontend',
    location: 'Remote EU',
    roleTitle: 'Frontend Engineer',
    salaryMax: 85000,
    salaryMin: 70000,
    source: 'INDEED',
  },
  {
    company: 'Delivery Hero',
    description: 'Logistics APIs at scale.',
    history: [['APPLIED', 5]],
    jobUrl: null,
    location: 'Berlin',
    roleTitle: 'Software Engineer, Logistics',
    salaryMax: null,
    salaryMin: null,
    source: 'XING',
  },
  {
    company: 'SAP',
    description: 'Full-stack work on the analytics cloud.',
    history: [
      ['APPLIED', 40],
      ['INTERVIEW', 21],
    ],
    jobUrl: 'https://example.com/jobs/sap-fullstack',
    location: 'Walldorf',
    roleTitle: 'Full Stack Developer',
    salaryMax: 88000,
    salaryMin: 72000,
    source: 'COMPANY_WEBSITE',
  },
  {
    company: 'Trade Republic',
    description: 'Mobile-first trading features.',
    history: [
      ['WISHLIST', 35],
      ['APPLIED', 24],
      ['INTERVIEW', 10],
    ],
    jobUrl: 'https://example.com/jobs/trade-republic',
    location: 'Berlin',
    roleTitle: 'Senior Software Engineer',
    salaryMax: 110000,
    salaryMin: 90000,
    source: 'REFERRAL',
  },
  {
    company: 'HelloFresh',
    description: 'Data platform and pipelines.',
    history: [
      ['APPLIED', 50],
      ['INTERVIEW', 33],
      ['OFFER', 4],
    ],
    jobUrl: null,
    location: 'Berlin',
    roleTitle: 'Data Engineer',
    salaryMax: 92000,
    salaryMin: 82000,
    source: 'LINKEDIN',
  },
  {
    company: 'Contentful',
    description: 'APIs for the content platform.',
    history: [
      ['APPLIED', 45],
      ['REJECTED', 31],
    ],
    jobUrl: 'https://example.com/jobs/contentful-api',
    location: 'Remote',
    roleTitle: 'API Engineer',
    salaryMax: null,
    salaryMin: null,
    source: 'OTHER',
  },
  {
    company: 'Siemens',
    description: 'Industrial IoT dashboards.',
    history: [
      ['APPLIED', 38],
      ['INTERVIEW', 26],
      ['REJECTED', 15],
    ],
    jobUrl: null,
    location: 'Munich',
    roleTitle: 'Frontend Developer',
    salaryMax: 78000,
    salaryMin: 65000,
    source: 'INDEED',
  },
  {
    company: 'GetYourGuide',
    description: 'Search and discovery for experiences.',
    history: [
      ['WISHLIST', 20],
      ['WITHDRAWN', 14],
    ],
    jobUrl: null,
    location: 'Zurich',
    roleTitle: 'Search Engineer',
    salaryMax: null,
    salaryMin: null,
    source: 'LINKEDIN',
  },
  {
    company: 'Spotify',
    description: 'Client platform for web playback.',
    history: [['APPLIED', 1]],
    jobUrl: 'https://example.com/jobs/spotify-web',
    location: 'Stockholm',
    roleTitle: 'Web Engineer',
    salaryMax: null,
    salaryMin: null,
    source: 'COMPANY_WEBSITE',
  },
];

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (days: number, hour = 10): string => {
  const date = new Date(Date.now() - days * DAY);

  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};
const daysAhead = (days: number): string => daysAgo(-days).slice(0, 10);

let counter = 0;
const nextId = (prefix: string): string => {
  counter += 1;
  return `mock-${prefix}-${counter}`;
};

const jobs: TRecord[] = [];
const events: TRecord[] = [];
const notesByJob = new Map<string, TRecord[]>();
const tasksByJob = new Map<string, TRecord[]>();
const contactsByJob = new Map<string, TRecord[]>();

/**
 * Records a status change, as the backend does on create and on update.
 */
const addEvent = (jobId: string, previousStatus: TStatus | null, nextStatus: TStatus, at: string) =>
  events.push({
    createdAt: at,
    description: '',
    id: nextId('event'),
    jobId,
    nextStatus,
    previousStatus,
    type: 'STATUS_CHANGE',
  });

SEED_JOBS.forEach(({ history, ...fields }) => {
  const id = nextId('job');
  const [[firstStatus, firstDays]] = history;
  const [lastStatus, lastDays] = history[history.length - 1];

  jobs.push({
    ...fields,
    createdAt: daysAgo(firstDays),
    id,
    status: lastStatus,
    updatedAt: daysAgo(lastDays),
  });
  addEvent(id, null, firstStatus, daysAgo(firstDays));
  history
    .slice(1)
    .forEach(([status, days], index) => addEvent(id, history[index][0], status, daysAgo(days)));
});

const jobByCompany = (company: string): string =>
  (jobs.find((job) => job.company === company) as TRecord).id;

notesByJob.set(jobByCompany('Trade Republic'), [
  {
    body: 'Recruiter call went well. System design round next.',
    createdAt: daysAgo(9),
    id: nextId('note'),
    updatedAt: daysAgo(9),
  },
]);
notesByJob.set(jobByCompany('HelloFresh'), [
  {
    body: 'Offer received. Compare with the SAP process before replying.',
    createdAt: daysAgo(4),
    id: nextId('note'),
    updatedAt: daysAgo(4),
  },
]);
tasksByJob.set(jobByCompany('Trade Republic'), [
  {
    createdAt: daysAgo(9),
    dueDate: daysAhead(3),
    id: nextId('task'),
    status: 'TODO',
    title: 'Prepare system design interview',
    updatedAt: daysAgo(9),
  },
]);
tasksByJob.set(jobByCompany('HelloFresh'), [
  {
    createdAt: daysAgo(4),
    dueDate: daysAhead(5),
    id: nextId('task'),
    status: 'TODO',
    title: 'Reply to the offer',
    updatedAt: daysAgo(4),
  },
]);
contactsByJob.set(jobByCompany('Trade Republic'), [
  {
    createdAt: daysAgo(10),
    email: 'recruiter@example.com',
    id: nextId('contact'),
    lastContactedAt: daysAgo(9),
    name: 'Alex Recruiter',
    notes: null,
    phone: null,
    profileUrl: null,
    type: 'RECRUITER',
    updatedAt: daysAgo(10),
  },
]);

const send = (res: ServerResponse, status: number, body?: unknown) => {
  res.statusCode = status;
  if (body === undefined) {
    res.end();
    return;
  }
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
};

const notFound = (res: ServerResponse) => send(res, 404, { message: 'Not found' });

const readBody = (req: IncomingMessage): Promise<Record<string, unknown>> =>
  new Promise((resolve) => {
    let raw = '';

    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => resolve(raw ? (JSON.parse(raw) as Record<string, unknown>) : {}));
  });

/**
 * List, create, update, and delete for one job's notes, tasks, or contacts.
 */
const handleChildren = async (
  req: IncomingMessage,
  res: ServerResponse,
  store: Map<string, TRecord[]>,
  jobId: string,
  childId: string | undefined,
) => {
  const items = store.get(jobId) ?? [];
  const now = new Date().toISOString();

  store.set(jobId, items);
  if (!childId && req.method === 'GET') return send(res, 200, items);
  if (!childId && req.method === 'POST') {
    const item = { ...(await readBody(req)), createdAt: now, id: nextId('item'), updatedAt: now };

    items.push(item);
    return send(res, 201, item);
  }

  const index = items.findIndex((item) => item.id === childId);

  if (index < 0) return notFound(res);
  if (req.method === 'PUT') {
    items[index] = {
      ...items[index],
      ...(await readBody(req)),
      id: items[index].id,
      updatedAt: now,
    };
    return send(res, 200, items[index]);
  }
  if (req.method === 'DELETE') {
    items.splice(index, 1);
    return send(res, 204);
  }

  return notFound(res);
};

const handle = async (req: IncomingMessage, res: ServerResponse): Promise<boolean> => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  const now = new Date().toISOString();

  if (parts[0] !== 'api') return false;

  if (parts[1] === 'timeline-events' && parts.length === 2) {
    const page = Number(url.searchParams.get('page') ?? 0);
    const size = Math.min(Number(url.searchParams.get('size') ?? 100), 100);
    const sorted = [...events].sort((a, b) =>
      String(a.createdAt).localeCompare(String(b.createdAt)),
    );

    send(res, 200, {
      content: sorted.slice(page * size, page * size + size),
      page,
      size,
      totalElements: sorted.length,
      totalPages: Math.ceil(sorted.length / size),
    });
    return true;
  }

  if (parts[1] !== 'jobs') return false;

  const [, , jobId, child, childId] = parts;

  if (!jobId) {
    if (req.method === 'GET') send(res, 200, jobs);
    else if (req.method === 'POST') {
      const body = await readBody(req);
      const status = (body.status as TStatus | undefined) ?? 'WISHLIST';
      const job = { ...body, createdAt: now, id: nextId('job'), status, updatedAt: now };

      jobs.push(job);
      addEvent(job.id, null, status, now);
      send(res, 201, job);
    } else notFound(res);
    return true;
  }

  const index = jobs.findIndex((job) => job.id === jobId);

  if (index < 0) {
    notFound(res);
    return true;
  }

  if (child === 'timeline') {
    send(
      res,
      200,
      events
        .filter((event) => event.jobId === jobId)
        .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt))),
    );
    return true;
  }
  if (child === 'notes') await handleChildren(req, res, notesByJob, jobId, childId);
  else if (child === 'tasks') await handleChildren(req, res, tasksByJob, jobId, childId);
  else if (child === 'contacts') await handleChildren(req, res, contactsByJob, jobId, childId);
  else if (child) notFound(res);
  else if (req.method === 'GET') send(res, 200, jobs[index]);
  else if (req.method === 'PUT') {
    const body = await readBody(req);
    const previous = jobs[index].status as TStatus;

    jobs[index] = { ...jobs[index], ...body, id: jobId, updatedAt: now };
    if (body.status && body.status !== previous)
      addEvent(jobId, previous, body.status as TStatus, now);
    send(res, 200, jobs[index]);
  } else if (req.method === 'DELETE') {
    jobs.splice(index, 1);
    send(res, 204);
  } else notFound(res);

  return true;
};

/**
 * Vite plugin that answers the jobs API from memory in the dev server. Its
 * middleware runs before Vite's proxy, so only the routes above are
 * intercepted.
 *
 * @returns {Plugin} Dev-server-only plugin.
 */
export const mockJobsApi = (): Plugin => ({
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      handle(req, res)
        .then((handled) => {
          if (!handled) next();
        })
        .catch(next);
    });
  },
  name: 'mock-jobs-api',
});
