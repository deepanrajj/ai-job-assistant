import { describe, expect, it } from 'vitest';

import { navClassName } from './appShell.utils';

describe('appShell utils', () => {
  it('builds active, inactive, and icon-only sidebar nav classes', () => {
    expect(navClassName({ isActive: true })).toContain('bg-primary-100');
    expect(navClassName({ isActive: false })).toContain('hover:bg-primary-50');
    expect(navClassName({ collapsed: true, isActive: true })).toContain('justify-center');
  });
});
