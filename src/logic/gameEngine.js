import { dealUntilValid } from './dealChecks';
import { calculateScore, canGoStop } from './scoring';

export const PHASE = {
  START: 'start',
  PLAYING: 'playing',
  CHOOSE_MATCH: 'choose_match',
  GO_STOP: 'go_stop',
  ROUND_END: 'round_end',
  GAME_END: 'game_end',
};

function emitEvent(state, event) {
  const seq = (state.eventSeq || 0) + 1;
  const newEvent = { ...event, seq };
  return {
    ...state,
    eventSeq: seq,
    lastEvent: newEvent,
    eventQueue: [...(state.eventQueue || []), newEvent],
  };
}

export function createInitialState(playerName = '나', aiName = '컴퓨터') {
  const players = [
    { name: playerName, hand: [], captured: [], score: 0, totalScore: 0, goCount: 0, isAi: false },
    { name: aiName, hand: [], captured: [], score: 0, totalScore: 0, goCount: 0, isAi: true },
  ];
  const { table, player1Hand, player2Hand, stock, dealMessage } = dealUntilValid(players);
  players[0].hand = player1Hand;
  players[1].hand = player2Hand;

  const startMsg = dealMessage
    ? `${dealMessage} ${playerName}님 차례 · ① 패에서 카드 1장을 고르세요`
    : `${playerName}님 차례 · ① 패에서 카드 1장을 고르세요`;

  return {
    phase: PHASE.PLAYING,
    currentPlayer: 0,
    players,
    table,
    stock,
    message: startMsg,
    lastAction: null,
    pendingCard: null,
    matchCandidates: [],
    matchSource: null,
    round: 1,
    targetScore: 7,
    winner: null,
    ppungBonus: 0,
    eventSeq: 0,
    lastEvent: null,
    eventQueue: [],
  };
}

function findMatches(table, card) {
  return table.filter((t) => t.month === card.month);
}

function removeFromTable(table, cards) {
  const ids = new Set(cards.map((c) => c.id));
  return table.filter((t) => !ids.has(t.id));
}

function captureCards(player, cards) {
  return {
    ...player,
    captured: [...player.captured, ...cards],
  };
}

function updatePlayerScore(player) {
  const { total } = calculateScore(player.captured);
  return { ...player, score: total };
}

function processMatch(state, playerIdx, playedCard, tableCard, isFromStock = false) {
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

function processNoMatch(state, playerIdx, playedCard, isFromStock = false) {
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

function processPpung(state, playerIdx, playedCard, matches, isFromStock = false) {
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

function handleCardPlay(state, playerIdx, card, isFromStock = false) {
  const matches = findMatches(state.table, card);

  if (matches.length === 3) {
    return processPpung(state, playerIdx, card, matches, isFromStock);
  }

  if (matches.length === 1) {
    return processMatch(state, playerIdx, card, matches[0], isFromStock);
  }

  if (matches.length === 2) {
    return {
      ...state,
      phase: PHASE.CHOOSE_MATCH,
      pendingCard: card,
      matchCandidates: matches,
      matchSource: isFromStock ? 'stock' : 'hand',
      message: `바닥에 ${card.month}월 카드가 2장 있어요! 맞출 카드를 터치해서 고르세요.`,
    };
  }

  return processNoMatch(state, playerIdx, card, isFromStock);
}

function checkGoStop(state, playerIdx) {
  const player = state.players[playerIdx];
  if (canGoStop(player.score)) {
    return {
      ...state,
      phase: PHASE.GO_STOP,
      message: `${player.name}님, ${player.score}점입니다! 고 할까요, 스톱 할까요?`,
    };
  }
  return state;
}

function endTurn(state) {
  const nextPlayer = state.currentPlayer === 0 ? 1 : 0;
  const nextName = state.players[nextPlayer].name;

  if (state.stock.length === 0) {
    return endRound(state);
  }

  const stepMsg = nextPlayer === 0
    ? `${nextName}님 차례 · ① 패에서 카드 1장을 고르세요`
    : `🤖 ${nextName} 차례입니다...`;

  return {
    ...state,
    currentPlayer: nextPlayer,
    phase: PHASE.PLAYING,
    message: stepMsg,
    pendingCard: null,
    matchCandidates: [],
    matchSource: null,
  };
}

function endRound(state) {
  const p0 = state.players[0];
  const p1 = state.players[1];
  const roundWinner = p0.score >= p1.score ? 0 : 1;
  const winner = state.players[roundWinner];

  const newPlayers = state.players.map((p, i) => ({
    ...p,
    totalScore: p.totalScore + (i === roundWinner ? p.score : 0),
    captured: [],
    score: 0,
    goCount: 0,
  }));

  const gameWinner = newPlayers.find((p) => p.totalScore >= state.targetScore);

  if (gameWinner) {
    return {
      ...state,
      players: newPlayers,
      phase: PHASE.GAME_END,
      winner: gameWinner.name,
      message: `🎉 ${gameWinner.name}님이 ${gameWinner.totalScore}점으로 승리했습니다!`,
    };
  }

  const { table, player1Hand, player2Hand, stock, dealMessage } = dealUntilValid(newPlayers);

  const roundMsg = dealMessage
    ? `${dealMessage} ${state.round + 1}판! ${state.players[roundWinner].name}님 차례`
    : `${state.round + 1}판 시작! ${state.players[roundWinner].name}님 차례입니다.`;

  return {
    ...state,
    players: newPlayers.map((p, i) => ({
      ...p,
      hand: i === 0 ? player1Hand : player2Hand,
    })),
    table,
    stock,
    currentPlayer: roundWinner,
    round: state.round + 1,
    phase: PHASE.PLAYING,
    ppungBonus: 0,
    message: roundMsg,
  };
}

export function playCardFromHand(state, cardId) {
  if (state.phase !== PHASE.PLAYING) return state;
  if (state.pendingCard) return state;

  const playerIdx = state.currentPlayer;
  const player = state.players[playerIdx];
  const card = player.hand.find((c) => c.id === cardId);
  if (!card) return state;

  const newHand = player.hand.filter((c) => c.id !== cardId);
  let newState = {
    ...state,
    players: state.players.map((p, i) =>
      i === playerIdx ? { ...p, hand: newHand } : p
    ),
    pendingCard: card,
    matchSource: 'hand',
  };

  newState = handleCardPlay(newState, playerIdx, card, false);

  if (newState.phase === PHASE.CHOOSE_MATCH) {
    return newState;
  }

  return flipStockCard(newState);
}

function flipStockCard(state) {
  if (state.stock.length === 0) {
    return endTurn(state);
  }

  const [flipped, ...remainingStock] = state.stock;
  const playerIdx = state.currentPlayer;

  let newState = {
    ...state,
    stock: remainingStock,
    pendingCard: flipped,
  };

  newState = handleCardPlay(newState, playerIdx, flipped, true);

  if (newState.phase === PHASE.CHOOSE_MATCH) {
    return newState;
  }

  newState = checkGoStop(newState, playerIdx);
  if (newState.phase === PHASE.GO_STOP) {
    return newState;
  }

  return endTurn(newState);
}

export function chooseMatch(state, tableCardId) {
  if (state.phase !== PHASE.CHOOSE_MATCH) return state;

  const playerIdx = state.currentPlayer;
  const playedCard = state.pendingCard;
  const tableCard = state.matchCandidates.find((c) => c.id === tableCardId);
  if (!tableCard) return state;

  const isFromStock = state.matchSource === 'stock';
  let newState = processMatch(state, playerIdx, playedCard, tableCard, isFromStock);

  newState = {
    ...newState,
    phase: PHASE.PLAYING,
    pendingCard: null,
    matchCandidates: [],
    matchSource: null,
  };

  if (isFromStock) {
    newState = checkGoStop(newState, playerIdx);
    if (newState.phase === PHASE.GO_STOP) return newState;
    return endTurn(newState);
  }

  return flipStockCard(newState);
}

export function handleGo(state) {
  const playerIdx = state.currentPlayer;
  const newPlayers = state.players.map((p, i) =>
    i === playerIdx ? { ...p, goCount: p.goCount + 1 } : p
  );

  const newState = emitEvent({
    ...state,
    players: newPlayers,
    phase: PHASE.PLAYING,
    pendingCard: null,
    matchCandidates: [],
    matchSource: null,
    message: `${state.players[playerIdx].name}님이 고를 외쳤습니다!`,
  }, { type: 'go', playerIdx, cards: [] });

  return endTurn(newState);
}

export function handleStop(state) {
  const playerIdx = state.currentPlayer;
  const player = state.players[playerIdx];
  const multiplier = 1 + player.goCount;

  const newPlayers = state.players.map((p, i) => {
    if (i === playerIdx) {
      return { ...p, totalScore: p.totalScore + p.score * multiplier };
    }
    return p;
  });

  const updatedPlayer = newPlayers[playerIdx];
  if (updatedPlayer.totalScore >= state.targetScore) {
    return {
      ...state,
      players: newPlayers,
      phase: PHASE.GAME_END,
      winner: updatedPlayer.name,
      message: `🎉 ${updatedPlayer.name}님이 ${updatedPlayer.totalScore}점으로 승리했습니다!`,
    };
  }

  const { table, player1Hand, player2Hand, stock, dealMessage } = dealUntilValid(newPlayers);

  const stopMsg = dealMessage
    ? `${dealMessage} 스톱! ${player.name}님 ${player.score * multiplier}점. ${state.round + 1}판 시작!`
    : `스톱! ${player.name}님이 ${player.score * multiplier}점 획득. ${state.round + 1}판 시작!`;

  return {
    ...state,
    players: newPlayers.map((p, i) => ({
      ...p,
      hand: i === 0 ? player1Hand : player2Hand,
      captured: [],
      score: 0,
      goCount: 0,
    })),
    table,
    stock,
    currentPlayer: playerIdx,
    round: state.round + 1,
    phase: PHASE.PLAYING,
    ppungBonus: 0,
    pendingCard: null,
    matchCandidates: [],
    matchSource: null,
    message: stopMsg,
  };
}

export function startNewGame(playerName, targetScore = 7, difficulty = 'normal') {
  const state = createInitialState(playerName, '컴퓨터');
  return { ...state, targetScore, difficulty, phase: PHASE.PLAYING };
}
