import { createDeck } from '../data/cards';
import { dealCards } from './deck';

function countByMonth(cards) {
  const counts = {};
  for (const card of cards) {
    counts[card.month] = (counts[card.month] || 0) + 1;
  }
  return counts;
}

/** 손패에 같은 달 4장 (초가리) */
export function findFourInHand(hand) {
  const counts = countByMonth(hand);
  return Number(Object.entries(counts).find(([, n]) => n >= 4)?.[0]) || null;
}

/** 바닥에 같은 달 4장 */
export function findFourOnTable(table) {
  const counts = countByMonth(table);
  return Number(Object.entries(counts).find(([, n]) => n >= 4)?.[0]) || null;
}

/** 딜 직후 재패가 필요한지 검사 */
export function checkDealIssue({ table, player1Hand, player2Hand }) {
  const p0Month = findFourInHand(player1Hand);
  if (p0Month) {
    return { type: 'chogari', month: p0Month, playerIdx: 0 };
  }
  const p1Month = findFourInHand(player2Hand);
  if (p1Month) {
    return { type: 'chogari', month: p1Month, playerIdx: 1 };
  }
  const tableMonth = findFourOnTable(table);
  if (tableMonth) {
    return { type: 'table_four', month: tableMonth };
  }
  return null;
}

function issueMessage(issue, players) {
  if (!issue) return null;
  if (issue.type === 'chogari') {
    const name = players?.[issue.playerIdx]?.name || (issue.playerIdx === 0 ? '플레이어' : '컴퓨터');
    return `${name} 손패에 ${issue.month}월 4장(초가리)! 다시 나눕니다.`;
  }
  if (issue.type === 'table_four') {
    return `바닥에 ${issue.month}월 4장! 다시 나눕니다.`;
  }
  return '특수 패 배치 · 다시 나눕니다.';
}

/** 초가리/바닥4장 없을 때까지 최대 20번 재딜 */
export function dealUntilValid(players = null) {
  const maxAttempts = 20;
  let lastIssue = null;

  for (let i = 0; i < maxAttempts; i++) {
    const deck = createDeck();
    const dealt = dealCards(deck);
    const issue = checkDealIssue(dealt);
    if (!issue) {
      return {
        ...dealt,
        redeals: i,
        dealMessage: i > 0 && lastIssue ? issueMessage(lastIssue, players) : null,
      };
    }
    lastIssue = issue;
  }

  const deck = createDeck();
  const dealt = dealCards(deck);
  return { ...dealt, redeals: maxAttempts, dealMessage: null };
}

/** 먹은 패에 같은 달 4장 모두 모음 (총통) */
export function findChongtongMonths(captured) {
  const counts = countByMonth(captured || []);
  return Object.entries(counts)
    .filter(([, n]) => n >= 4)
    .map(([month]) => Number(month));
}
