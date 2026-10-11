import { describe, expect, it } from 'vitest';

import { isDisplayed, navClassName } from './appShell.utils';

describe('appShell utils', () => {
  it('builds active, inactive, and icon-only sidebar nav classes', () => {
    expect(navClassName({ isActive: true })).toContain('bg-primary-100');
    expect(navClassName({ isActive: false })).toContain('hover:bg-primary-50');
    expect(navClassName({ collapsed: true, isActive: true })).toContain('justify-center');
  });

  it('treats an element under a display:none ancestor as not displayed', () => {
    const root = document.createElement('div');
    root.innerHTML =
      '<div style="display: none"><button>Hidden</button></div><div><button>Shown</button></div>';
    const [hidden, shown] = root.querySelectorAll('button');

    expect(isDisplayed(hidden, root)).toBe(false);
    expect(isDisplayed(shown, root)).toBe(true);
  });
});
