/** A pending intent survives remount/reconnection within this browser tab.
 * Never replay automatically. Clear only after authoritative success.
 * New submitted data, scope or a confirmed previous intent gets a new key.
 */
export interface PendingOperation {
  slot: string;
  key: string;
}
async function canonical(value: unknown): Promise<unknown> {
  if (value instanceof Blob)
    return {
      type: value.type,
      bytes: Array.from(new Uint8Array(await value.arrayBuffer()))
    };
  if (value instanceof FormData)
    return Promise.all(
      Array.from(value.entries()).map(async ([k, v]) => [k, await canonical(v)])
    );
  if (Array.isArray(value)) return Promise.all(value.map(canonical));
  if (value && typeof value === 'object')
    return Object.fromEntries(
      await Promise.all(
        Object.entries(value)
          .filter(([k]) => k !== 'expectedVersion' && k !== 'idempotencyKey')
          .sort(([a], [b]) => a.localeCompare(b))
          .map(async ([k, v]) => [k, await canonical(v)])
      )
    );
  return value;
}
export async function pendingOperation(
  scope: string,
  operation: string,
  data: unknown
): Promise<PendingOperation> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(
      JSON.stringify([scope, operation, await canonical(data)])
    )
  );
  const slot =
    'pending-intent:' +
    Array.from(new Uint8Array(digest), (n) =>
      n.toString(16).padStart(2, '0')
    ).join('');
  const key = sessionStorage.getItem(slot) || crypto.randomUUID();
  // Fail before sending if storage is unavailable; do not silently lose retry identity.
  sessionStorage.setItem(slot, key);
  return { slot, key };
}
export function confirmOperation(operation: PendingOperation) {
  if (sessionStorage.getItem(operation.slot) === operation.key)
    sessionStorage.removeItem(operation.slot);
}
/** The JWT subject is only a local namespace, never an authorization decision. */
export function operationScope(restaurantId?: string) {
  const payload = (localStorage.getItem('token') || '').split('.')[1];
  const userId = payload
    ? (
        JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
          sub: string;
        }
      ).sub
    : 'anonymous';
  return `${restaurantId}:${userId}`;
}
