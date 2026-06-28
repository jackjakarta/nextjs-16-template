import React from 'react';

export function useIsScreenSmallerThan(breakpoint: number) {
  const mediaQuery = `(max-width: ${breakpoint - 1}px)`;

  const subscribe = React.useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(mediaQuery);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [mediaQuery],
  );

  const getSnapshot = React.useCallback(() => {
    return window.matchMedia(mediaQuery).matches;
  }, [mediaQuery]);

  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function getServerSnapshot() {
  return false;
}
