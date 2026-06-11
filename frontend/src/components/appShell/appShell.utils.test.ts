import { describe, expect, it } from 'vitest';

import { mobileNavClassName, navClassName } from './appShell.utils';

describe('appShell utils', () => {
  it('builds active and inactive desktop nav classes', () => {
    expect(navClassName({ isActive: true })).toContain('bg-primary-50');
    expect(navClassName({ isActive: false })).toContain('hover:bg-app-surface2');
  });

  it('builds active and inactive mobile nav classes', () => {
    expect(mobileNavClassName({ isActive: true })).toContain('text-primary-700');
    expect(mobileNavClassName({ isActive: false })).toContain('border-app-border');
  });
});
