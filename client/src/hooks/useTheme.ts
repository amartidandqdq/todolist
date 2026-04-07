import { useState, useEffect, useCallback } from 'react';

/** Supported theme values */
type Theme = 'light' | 'dark' | 'system';

/**
 * Manage light/dark theme with localStorage persistence.
 * Applies `data-theme` attribute on `<html>` element.
 * Defaults to system preference via `prefers-color-scheme`.
 * @returns { theme, setTheme, toggle }
 */
export function useTheme(): { theme: Theme; setTheme: (t: Theme) => void; toggle: () => void } {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  const applyTheme = useCallback((t: Theme): void => {
    if (t === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
  }, []);

  useEffect(() => { applyTheme(theme); }, [theme, applyTheme]);

  const setTheme = useCallback((t: Theme): void => {
    setThemeState(t);
    localStorage.setItem('theme', t);
    applyTheme(t);
  }, [applyTheme]);

  const toggle = useCallback((): void => {
    const current = document.documentElement.getAttribute('data-theme');
    const isDark = current === 'dark' || (!current && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setTheme(isDark ? 'light' : 'dark');
  }, [setTheme]);

  return { theme, setTheme, toggle };
}
