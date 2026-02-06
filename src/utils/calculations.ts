import type { GiftIdea } from '../types';

export function calculateSpentAmount(gifts: GiftIdea[]): number {
  return gifts
    .filter(gift => gift.status === 'purchased' || gift.status === 'given')
    .reduce((total, gift) => total + gift.price, 0);
}