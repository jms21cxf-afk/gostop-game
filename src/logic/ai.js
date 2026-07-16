import { calculateScore } from './scoring';

const AI_PLAYER = 1;

function cardValue(card) {
  if (card.type === 'kwang') return 10;
  if (card.type === 'yul') return 5;
  if (card.type === 'tti') return 3;
  return 1;
}

function findTableMatches(table, card) {
  return table.filter((t) => t.month === card.month);
}

function scoreCardChoice(hand, table, card) {
  const matches = findTableMatches(table, card);
  let score = 0;

  if (matches.length === 3) score += 20;
  else if (matches.length === 1) score += 10 + cardValue(card);
  else if (matches.length === 2) score += 8;
  else score -= 2;

  return score;
}

export function aiChooseCard(state) {
  const hand = state.players[AI_PLAYER].hand;
  const { table, difficulty } = state;

  if (difficulty === 'easy' && Math.random() < 0.25) {
    return hand[Math.floor(Math.random() * hand.length)];
  }

  let best = hand[0];
  let bestScore = -Infinity;

  for (const card of hand) {
    const s = scoreCardChoice(hand, table, card);
    if (s > bestScore) {
      bestScore = s;
      best = card;
    }
  }

  return best;
}

export function aiChooseMatch(state) {
  const { matchCandidates, pendingCard } = state;
  if (matchCandidates.length === 1) return matchCandidates[0];

  let best = matchCandidates[0];
  let bestScore = -Infinity;

  for (const candidate of matchCandidates) {
    const score = cardValue(candidate) + cardValue(pendingCard);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best;
}

export function aiChooseGoStop(state) {
  const player = state.players[AI_PLAYER];
  const { score, goCount } = player;

  if (score >= 7) return 'stop';
  if (goCount >= 2) return 'stop';
  if (score >= 5 && Math.random() > 0.3) return 'stop';
  if (score >= 3 && Math.random() > 0.5) return 'stop';
  return 'go';
}

export function isAiTurn(state) {
  return state?.currentPlayer === AI_PLAYER;
}

export function simulateCapture(player, cards) {
  return calculateScore([...player.captured, ...cards]).total;
}
