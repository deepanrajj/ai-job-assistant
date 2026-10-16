import { useMemo, useState, type FC, type ReactNode } from 'react';

import {
  DataTablePagination,
  DataTableToolbar,
  useDataTable,
  type IDataTableColumn,
  type IDataTableSearchConfig,
} from '../../components/dataTable';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Select,
  getSegmentClassName,
} from '../../components/ui';
import { ApplicationCards } from '../../features/applications/components/ApplicationCards';
import { ApplicationsMatrix } from '../../features/applications/components/ApplicationsMatrix';
import { ApplicationsSummary } from '../../features/applications/components/ApplicationsSummary';
import { GridIcon, TableIcon } from '../../components/icons';
import { useBreakpoint } from '../../hooks';
import { useTranslation } from '../../i18n';
import {
  countApplicationDocuments,
  getDocumentTypeColumns,
  groupDocumentsByJob,
} from '../../features/applications/applications.utils';
import type { AppError } from '../../errors';
import { DOCUMENT_TYPE_TRANSLATION_KEYS, type TJob } from '../../types';
import type {
  IApplicationGroup,
  TApplicationDocument,
} from '../../features/applications/applications.types';

/**
 * Props used by the Applications page.
 */
interface IApplicationsPageProps {
  documents: TApplicationDocument[];
  error: AppError | null;
  isLoading: boolean;
  jobs: TJob[];
  onRetry: () => void;
}

/**
 * The materials card's two layouts.
 */
type TApplicationsView = 'cards' | 'matrix';

/**
 * Which jobs the list shows: all, or only those with a document not sent.
 */
type TApplicationsFilter = 'all' | 'unsent';

/**
 * Id of the materials card's heading, which names the card's region.
 */
const MATERIALS_HEADING_ID = 'application-materials-heading';

/**
 * The matrix and cards are not sorted by column, so the table hook gets
 * none.
 */
const NO_COLUMNS: IDataTableColumn<IApplicationGroup>[] = [];

/**
 * Jobs per page, as the Jobs table offers.
 */
const PAGE_SIZE_OPTIONS = [10, 25, 50];

/**
 * Lists what was sent with each application: a stats bar of submitted
 * and unsent documents, a toolbar to search and filter, and one card of
 * materials, most recent submission first, a page of jobs at a time
 * once there are more jobs than the smallest page holds.
 * From `xl` up the card switches between a matrix of jobs by document
 * type, showing which version went where, and a grid of job cards;
 * narrower screens always get the cards: below `xl` four type columns
 * would each get under 100px beside the sidebar.
 * The counts cover every job, not the current search or filter.
 *
 * @param {IApplicationsPageProps} props Component props.
 * @returns {JSX.Element} Applications page.
 */
export const ApplicationsPage: FC<IApplicationsPageProps> = ({
  documents,
  error,
  isLoading,
  jobs,
  onRetry,
}) => {
  const { t } = useTranslation();
  const groups = useMemo(() => groupDocumentsByJob(jobs, documents), [documents, jobs]);
  const counts = useMemo(() => countApplicationDocuments(groups), [groups]);
  const isWide = useBreakpoint('xl');
  const [view, setView] = useState<TApplicationsView>('matrix');
  const [filter, setFilter] = useState<TApplicationsFilter>('all');
  // Built once per data change, so each keystroke is a lookup per job.
  const searchTexts = useMemo(
    () =>
      new Map(
        groups.map((group) => [
          group,
          [
            group.job.company,
            group.job.roleTitle,
            ...group.documents.flatMap((document) => [
              document.title,
              t(DOCUMENT_TYPE_TRANSLATION_KEYS[document.type]),
            ]),
          ].join(' '),
        ]),
      ),
    [groups, t],
  );
  const search = useMemo<IDataTableSearchConfig<IApplicationGroup>>(
    () => ({
      getSearchText: (group) => searchTexts.get(group) ?? '',
      label: t('applications.search.label'),
      placeholder: t('applications.search.placeholder'),
    }),
    [searchTexts, t],
  );
  const filterPredicate = useMemo(
    () =>
      filter === 'unsent'
        ? ({ documents: jobDocuments }: IApplicationGroup) =>
            jobDocuments.some((document) => !document.submittedAt)
        : undefined,
    [filter],
  );
  // The Jobs table's search, filter, and paging, with no columns to sort.
  const table = useDataTable<IApplicationGroup>({
    columns: NO_COLUMNS,
    data: groups,
    defaultPageSize: PAGE_SIZE_OPTIONS[0],
    filterKey: filter,
    filterPredicate,
    initialSort: null,
    search,
  });
  // From every job, not this page's, so columns stay put while paging.
  const typeColumns = useMemo(() => getDocumentTypeColumns(groups), [groups]);
  const shownView: TApplicationsView = isWide ? view : 'cards';
  // Decided by every job, not the matches, so paging and its page-size
  // select stay put while searching and filtering. A size the user picked
  // keeps them shown, so it never lingers out of sight.
  const hasPaging = groups.length > PAGE_SIZE_OPTIONS[0] || table.pageSize !== PAGE_SIZE_OPTIONS[0];

  if (isLoading) return <LoadingState label={t('applications.loading')} />;

  if (error)
    return (
      <ErrorState
        action={<Button onClick={onRetry}>{t('jobs.loadErrorRetry')}</Button>}
        description={error.message}
        title={t('applications.loadErrorTitle')}
      />
    );

  const materials = (content: ReactNode, action?: ReactNode) => (
    <Card
      action={action}
      padding="none"
      subtitle={t('applications.materialsSubtitle')}
      title={t('applications.materialsTitle')}
      titleId={MATERIALS_HEADING_ID}
    >
      {content}
    </Card>
  );

  if (groups.length === 0)
    return materials(
      <EmptyState
        description={t('applications.emptyDescription')}
        title={t('applications.emptyTitle')}
      />,
    );

  const viewSwitch = isWide && (
    <div
      aria-label={t('applications.view.label')}
      className="inline-flex w-fit shrink-0 rounded-full border border-app-border bg-app-surface2 p-1"
      role="group"
    >
      {(
        [
          ['matrix', <TableIcon />, t('applications.view.matrix')],
          ['cards', <GridIcon />, t('applications.view.cards')],
        ] as const
      ).map(([option, icon, label]) => (
        <button
          aria-pressed={view === option}
          className={getSegmentClassName(view === option)}
          key={option}
          onClick={() => setView(option)}
          type="button"
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );

  const renderList = () => {
    if (table.sortedRows.length === 0)
      return (
        <EmptyState
          description={t('applications.noMatchDescription')}
          title={t('applications.noMatchTitle')}
        />
      );

    return (
      <>
        {shownView === 'matrix' ? (
          <ApplicationsMatrix columns={typeColumns} groups={table.pageRows} />
        ) : (
          <ApplicationCards groups={table.pageRows} />
        )}
        {hasPaging && (
          <DataTablePagination
            currentPageIndex={table.currentPageIndex}
            firstVisibleRow={table.firstVisibleRow}
            lastVisibleRow={table.lastVisibleRow}
            onNextPage={table.handleNextPage}
            onPageSizeChange={table.handlePageSizeChange}
            onPreviousPage={table.handlePreviousPage}
            pageCount={table.pageCount}
            pageSize={table.pageSize}
            pageSizeOptions={PAGE_SIZE_OPTIONS}
            summary={t('applications.pageSummary', {
              from: table.firstVisibleRow,
              to: table.lastVisibleRow,
              total: table.sortedRows.length,
            })}
            totalRows={table.sortedRows.length}
          />
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      <ApplicationsSummary counts={counts} />
      <DataTableToolbar<IApplicationGroup>
        filters={
          <Select
            label={t('applications.filter.label')}
            onChange={(event) => setFilter(event.target.value as TApplicationsFilter)}
            value={filter}
          >
            <option value="all">{t('applications.filter.all')}</option>
            <option value="unsent">{t('applications.filter.unsent')}</option>
          </Select>
        }
        onSearchChange={table.handleSearchChange}
        search={search}
        searchQuery={table.searchQuery}
      />
      {materials(renderList(), viewSwitch)}
    </div>
  );
};
