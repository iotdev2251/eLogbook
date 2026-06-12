import { useEffect } from 'react';

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(containerRef, active) {
  useEffect(() => {
    if (!active || !containerRef.current) return undefined;

    const root = containerRef.current;
    const previouslyFocused = document.activeElement;

    const getFocusables = () => [...root.querySelectorAll(FOCUSABLE)].filter(
      (el) => !el.disabled && !el.hidden,
    );

    const focusFirst = () => {
      const items = getFocusables();
      (items[0] ?? root).focus();
    };

    focusFirst();

    const onKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const items = getFocusables();
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    root.addEventListener('keydown', onKeyDown);

    return () => {
      root.removeEventListener('keydown', onKeyDown);
      if (previouslyFocused?.focus) {
        previouslyFocused.focus();
      }
    };
  }, [active, containerRef]);
}
