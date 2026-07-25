/**
 * cardPlay.js — 바닥 카드 처리: 매칭 / 뻥 / 바닥에 놓기
 *
 * 【호출】 gameEngine.playCardFromHand, flipStockCard, chooseMatch
 * 【분기】 3장→뻥, 1장→먹기, 2장→CHOOSE_MATCH, 0장→바닥
 */
import { isDualYulPiCard } from '../data/cards';

/** 같은 달 카드 = 매칭 후보 */
function findMatches(table, card) {
  return table.filter((t) => t.month === card.month);
}

function removeFromTable(table, cards) {
  const ids = new Set(cards.map((c) => c.id));
  return table.filter((t) => !ids.has(t.id));
}

/** 먹은 패에 추가 (9월 쌍피면 dualPending — dualCapture.js 가 이후 처리) */
function captureCards(player, cards) {
  const normalized = cards.map((c) =>
    isDualYulPiCard(c) ? { ...c, dualPending: true } : c,
  );
  return {
    ...player,
    captured: [...player.captured, ...normalized],
  };
}

/** 1장 맞춤 — playedCard + tableCard 먹기 */
export function processMatch(state, playerIdx, playedCard, tableCard, isFromStock, deps) {
  const { emitEvent, updatePlayerScore } = deps;
  const player = state.players[playerIdx];
  const cardsToCapture = [playedCard, tableCard];
  const newTable = removeFromTable(state.table, [tableCard]);

  let newPlayer = captureCards(player, cardsToCapture);
  newPlayer = updatePlayerScore(newPlayer);

  const source = isFromStock ? '덱' : '패';
  const action = `${state.players[playerIdx].name}님이 ${playedCard.month}월 카드를 냈습니다 (${source}).`;

  return emitEvent({
    ...state,
    players: state.players.map((p, i) => (i === playerIdx ? newPlayer : p)),
    table: newTable,
    message: action,
    lastAction: action,
  }, {
    type: isFromStock ? 'flip_stock' : 'play_hand',
    playerIdx,
    cards: cardsToCapture,
    from: isFromStock ? 'stock' : 'hand',
    to: 'captured',
    faceDown: isFromStock,
  });
}

/** 매칭 없음 — 바닥에 깔기 */
export function processNoMatch(state, playerIdx, playedCard, isFromStock, deps) {
  const { emitEvent } = deps;
  const source = isFromStock ? '덱' : '패';
  const action = `${playedCard.month}월 카드가 바닥에 놓였습니다 (${source}).`;

  return emitEvent({
    ...state,
    table: [...state.table, playedCard],
    message: action,
    lastAction: action,
  }, {
    type: isFromStock ? 'flip_stock' : 'play_hand',
    playerIdx,
    cards: [playedCard],
    from: isFromStock ? 'stock' : 'hand',
    to: 'table',
    faceDown: isFromStock,
  });
}

/** 같은 달 3장 + 낸 1장 = 뻥(4장 한 번에 먹기) */
export function processPpung(state, playerIdx, playedCard, matches, isFromStock, deps) {
  const { emitEvent, updatePlayerScore } = deps;
  const player = state.players[playerIdx];
  const allCards = [playedCard, ...matches];
  const newTable = removeFromTable(state.table, matches);

  let newPlayer = captureCards(player, allCards);
  newPlayer = updatePlayerScore(newPlayer);

  const source = isFromStock ? '덱' : '패';
  const action = `뻥! ${state.players[playerIdx].name}님이 ${playedCard.month}월 4장을 모두 냈습니다! (${source})`;

  return emitEvent({
    ...state,
    players: state.players.map((p, i) => (i === playerIdx ? newPlayer : p)),
    table: newTable,
    message: action,
    lastAction: action,
    ppungBonus: state.ppungBonus + 1,
  }, {
    type: 'ppung',
    playerIdx,
    cards: allCards,
    from: isFromStock ? 'stock' : 'hand',
    to: 'captured',
    faceDown: isFromStock,
  });
}

/**
 * 카드 1장 처리 분기 (패·덱 공통)
 * 3장→뻥, 1장→먹기, 2장→선택 UI, 0장→바닥
 */
export function handleCardPlay(state, playerIdx, card, isFromStock, deps) {
  const { chooseMatchPhase } = deps;
  const matches = findMatches(state.table, card);

  if (matches.length === 3) {
    return processPpung(state, playerIdx, card, matches, isFromStock, deps);
  }

  if (matches.length === 1) {
    return processMatch(state, playerIdx, card, matches[0], isFromStock, deps);
  }

  if (matches.length === 2) {
    return {
      ...state,
      phase: chooseMatchPhase,
      pendingCard: card,
      matchCandidates: matches,
      matchSource: isFromStock ? 'stock' : 'hand',
      message: `바닥에 ${card.month}월 카드가 2장 있어요! 맞출 카드를 터치해서 고르세요.`,
    };
  }

  return processNoMatch(state, playerIdx, card, isFromStock, deps);
}
