import type { Account, Line } from './types';
import type { Dispatch } from './fulfillment.types';

/** A late socket reconciliation cannot replace a newer authoritative account. */
export function reconcileAccounts(current: Account[], incoming: Account[]) {
  const existing = new Map(current.map((account) => [account.id, account]));
  return incoming.map((account) => {
    const previous = existing.get(account.id);
    return previous && previous.version > account.version ? previous : account;
  });
}

/** Routing belongs to the captured server line, never to product names or categories. */
export function requiresProduction(lines: Line[]) {
  return lines.some(
    (line) =>
      line.status === 'ACTIVE' &&
      !Number(line.confirmedQuantity) &&
      (line.requiresKitchen === true || Number(line.requiresKitchen) === 1)
  );
}

export function commandLabel(
  dispatch: Pick<Dispatch, 'commandNumber' | 'sequenceNumber'>
) {
  return `Comanda ${dispatch.commandNumber ?? dispatch.sequenceNumber}${dispatch.commandNumber == null ? ' · histórico' : ''}`;
}
