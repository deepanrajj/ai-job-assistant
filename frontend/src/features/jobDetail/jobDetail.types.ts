import type { FC } from 'react';

import type { TJobDetail } from '../../types';

/**
 * Represents one metadata item rendered in the job detail header.
 */
export interface IJobDetailMetadataItem {
  id: string;
  label: string;
  value: string;
}

/**
 * Props shared by job detail tab panel components.
 */
export interface IJobDetailPanelProps {
  job: TJobDetail;
}

/**
 * Represents a tab panel component rendered inside job detail tabs.
 */
export type TJobDetailPanelComponent = FC<IJobDetailPanelProps>;
