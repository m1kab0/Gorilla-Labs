import { useCallback, useState } from 'react';

/**
 * Tracks which list items are mid-delete so the list can render a
 * collapse animation instead of the row vanishing instantly. The caller
 * fires its delete mutation in parallel with startExit(key) — once the
 * mutation succeeds and the item drops out of the query data, the row
 * unmounts naturally after the animation has had time to play.
 */
export function useExitTransition() {
  const [exitingKeys, setExitingKeys] = useState(() => new Set());

  const startExit = useCallback((key) => {
    setExitingKeys((prev) => new Set(prev).add(key));
  }, []);

  const cancelExit = useCallback((key) => {
    setExitingKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const isExiting = useCallback((key) => exitingKeys.has(key), [exitingKeys]);

  return { startExit, cancelExit, isExiting };
}
