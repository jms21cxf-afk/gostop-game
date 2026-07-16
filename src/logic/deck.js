import { createDeck } from '../data/cards';

export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealCards(deck) {
  const shuffled = shuffleDeck(deck);
  const table = shuffled.slice(0, 8);
  const player1Hand = shuffled.slice(8, 18);
  const player2Hand = shuffled.slice(18, 28);
  const stock = shuffled.slice(28);

  return { table, player1Hand, player2Hand, stock };
}
