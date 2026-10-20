import { useContext, useEffect } from 'react';
import { SocketContext } from '@/context';
/** Socket invalidations are coalesced. Reconciliation never clears rendered data or replays writes. */
/**
 * Returning to the window only reconciles after a meaningful absence. Returning
 * from another application or tab for a few seconds must not fire the whole
 * read model again; the socket already delivers live changes and the bounded
 * 60s fallback covers missed events and sleep/network changes.
 */
const AWAY_REFRESH_MS = 30000;
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
    let awaySince = 0;
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
    const away = () => {
      if (!awaySince) awaySince = Date.now();
    };
    const visible = () => {
      if (document.visibilityState !== 'visible') {
        away();
        return;
      }
      if (awaySince && Date.now() - awaySince >= AWAY_REFRESH_MS) schedule();
      awaySince = 0;
    };
    const names = [
      ...new Set([...eventKey.split('|').filter(Boolean), 'connect'])
    ];
    names.forEach((event) => socket?.on(event, schedule));
    window.addEventListener('online', schedule);
    window.addEventListener('blur', away);
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
      window.removeEventListener('blur', away);
      window.removeEventListener('focus', visible);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [socket, refresh, eventKey, scope]);
}
