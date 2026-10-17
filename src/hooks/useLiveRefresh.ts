import { useContext, useEffect } from 'react';
import { SocketContext } from '@/context';
/** Socket invalidations are coalesced. Reconciliation never clears rendered data or replays writes. */
export function useLiveRefresh(
  refresh: () => Promise<unknown> | void,
  events: string[],
  scope = ''
) {
  const { socket } = useContext(SocketContext);
  const eventKey = events.join('|');
  useEffect(() => {
    let disposed = false,
      running = false,
      dirty = false;
    let scheduled: ReturnType<typeof setTimeout> | undefined;
    const update = async () => {
      if (disposed) return;
      if (running) {
        dirty = true;
        return;
      }
      running = true;
      try {
        await refresh();
      } catch {
        /* The owning view presents errors and preserves its last snapshot. */
      } finally {
        running = false;
        if (dirty && !disposed) {
          dirty = false;
          schedule();
        }
      }
    };
    const schedule = () => {
      if (scheduled || disposed) return;
      scheduled = setTimeout(() => {
        scheduled = undefined;
        void update();
      }, 120);
    };
    const visible = () => {
      if (document.visibilityState === 'visible') schedule();
    };
    const names = [
      ...new Set([...eventKey.split('|').filter(Boolean), 'connect'])
    ];
    names.forEach((event) => socket?.on(event, schedule));
    window.addEventListener('online', schedule);
    window.addEventListener('focus', visible);
    document.addEventListener('visibilitychange', visible);
    // Bounded fallback for missed events and sleep/network changes; no global second polling.
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') schedule();
    }, 60000);
    schedule();
    return () => {
      disposed = true;
      clearInterval(timer);
      clearTimeout(scheduled);
      names.forEach((event) => socket?.off(event, schedule));
      window.removeEventListener('online', schedule);
      window.removeEventListener('focus', visible);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [socket, refresh, eventKey, scope]);
}
