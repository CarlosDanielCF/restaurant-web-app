import type { Dispatch, DispatchItem } from './fulfillment.types';

export interface KitchenCard {
  dispatch: Dispatch;
  items: DispatchItem[];
  density: 'normal' | 'dense' | 'ultra-dense';
}

export function buildKitchenCards(dispatches: Dispatch[]): KitchenCard[] {
  return [...dispatches]
    .sort((left, right) => {
      const time =
        new Date(left.confirmedAt).getTime() -
        new Date(right.confirmedAt).getTime();
      return time || left.id.localeCompare(right.id);
    })
    .map((dispatch) => {
      const items = dispatch.items.filter(
        (item) => item.status === 'ACTIVE' && item.pending > 0
      );
      return {
        dispatch,
        items,
        density:
          items.length > 7
            ? 'ultra-dense'
            : items.length > 3
              ? 'dense'
              : 'normal'
      } as KitchenCard;
    })
    .filter((card) => card.items.length > 0);
}

export function kitchenCardPage(
  cards: KitchenCard[],
  page: number,
  cardsPerPage: number
): KitchenCard[] {
  const start = page * cardsPerPage;
  return cards.slice(start, start + cardsPerPage);
}
