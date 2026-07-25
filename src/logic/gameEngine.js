/**
 * gameEngine.js — 고스톱 턴·규칙 허브
 *
 * 【역할】 패 내기 → 바닥 매칭/뻥 → 덱 뒤집기 → 9월 엽·피 → 고/스톱 → 턴/라운드
 * 【다른 파일】 scoring.js, cardPlay.js, dualCapture.js, goStop.js, turnFlow.js, dealChecks, ai.js
 * 【UI 연결】 GameBoard.jsx 가 아래 export 함수들을 호출함
 *
 * 【한 턴 흐름】
 *   playCardFromHand (① 패)
 *     → handleCardPlay → processMatch | processPpung | processNoMatch | CHOOSE_MATCH
 *     → continueAfterCapture → (9월 선택?) → flipStockCard (② 덱)
 *       → handleCardPlay (같은 분기)
 *       → continueAfterCapture → checkGoStop → endTurn
 *
 * 【모듈】 dualCapture · cardPlay · goStop · turnFlow — gameEngine 은 연결(orchestration)만
 */
import { dealUntilValid } from './dealChecks';
import { calculateScore } from './scoring';
import { promptDualChoiceIfNeeded, applyCaptureTypeChoice } from './dualCapture';
import { handleCardPlay, processMatch } from './cardPlay';
import { checkGoStop, endRound, applyGo, applyStop } from './goStop';
import { endTurn as endTurnFlow, flipStockCard as flipStockCardFlow } from './turnFlow';

/** 게임 진행 단계 (UI가 phase 보고 화면·입력 잠금) */
export const PHASE = {
  START: 'start',
  PLAYING: 'playing',
  CHOOSE_MATCH: 'choose_match',           // 바닥 2장 중 선택
  CHOOSE_CAPTURE_TYPE: 'choose_capture_type', // 9월 국화 엽/피
  GO_STOP: 'go_stop',
  ROUND_END: 'round_end',
  GAME_END: 'game_end',
};

/** 카드 처리 후 다음에 할 일 (덱 뒤집기 vs 턴 종료) */
export const RESUME_AFTER = {
  FLIP_STOCK: 'flip_stock',
  END_TURN: 'end_turn',
};

// ─── 애니메이션용 이벤트 큐 ─────────────────────────────────────

/** FlyingCardLayer 애니메이션용 — state.eventQueue 에 쌓음 */
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

// ─── 게임 시작 ─────────────────────────────────────────────────

/** 첫 판 state 생성 (유효한 딜까지 dealChecks 에서 재시도) */
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
    pendingDualCard: null,
    dualResumeAfter: null,
    round: 1,
    targetScore: 7,
    winner: null,
    ppungBonus: 0,
    eventSeq: 0,
    lastEvent: null,
    eventQueue: [],
  };
}

function updatePlayerScore(player) {
  const { total } = calculateScore(player.captured);
  return { ...player, score: total };
}

/** cardPlay.js 에 주입하는 이벤트·점수·phase */
function getCardPlayDeps() {
  return {
    emitEvent,
    updatePlayerScore,
    chooseMatchPhase: PHASE.CHOOSE_MATCH,
  };
}

/** dualCapture.js 에 주입하는 phase·턴 연결 */
function getDualCaptureDeps() {
  return {
    chooseCapturePhase: PHASE.CHOOSE_CAPTURE_TYPE,
    playingPhase: PHASE.PLAYING,
    updatePlayerScore,
    continueAfterCapture,
  };
}

/** goStop.endRound 에 필요한 phase (endTurn 주입 불필요) */
function getRoundSettlementDeps() {
  return {
    gameEndPhase: PHASE.GAME_END,
    playingPhase: PHASE.PLAYING,
  };
}

/** turnFlow.endTurn 에 주입 */
function getEndTurnDeps() {
  return {
    playingPhase: PHASE.PLAYING,
    endRound,
    goStopDeps: getRoundSettlementDeps(),
  };
}

function endTurn(state) {
  return endTurnFlow(state, getEndTurnDeps());
}

/** turnFlow.flipStockCard 에 주입 */
function getFlipStockDeps() {
  return {
    endTurn: endTurnFlow,
    endTurnDeps: getEndTurnDeps(),
    handleCardPlay,
    cardPlayDeps: getCardPlayDeps(),
    continueAfterCapture,
    resumeEndTurn: RESUME_AFTER.END_TURN,
    chooseMatchPhase: PHASE.CHOOSE_MATCH,
  };
}

function flipStockCard(state) {
  return flipStockCardFlow(state, getFlipStockDeps());
}

/** goStop.js 에 주입하는 phase·턴·이벤트 */
function getGoStopDeps() {
  return {
    goStopPhase: PHASE.GO_STOP,
    gameEndPhase: PHASE.GAME_END,
    playingPhase: PHASE.PLAYING,
    emitEvent,
    endTurn,
  };
}

// ─── 카드 처리 후 연결 (허브) ──────────────────────────────────

/**
 * 먹기/뻥 직후 공통 후처리
 * 1) 9월 엽·피?  2) 덱 뒤집기?  3) 고/스톱·턴 종료?
 */
function continueAfterCapture(state, playerIdx, resumeAfter, skipDualCheck = false) {
  if (!skipDualCheck) {
    const prompted = promptDualChoiceIfNeeded(
      state,
      playerIdx,
      resumeAfter,
      getDualCaptureDeps(),
    );
    if (prompted) return prompted;
  }

  if (resumeAfter === RESUME_AFTER.FLIP_STOCK) {
    return flipStockCard(state);
  }

  if (resumeAfter === RESUME_AFTER.END_TURN) {
    let newState = checkGoStop(state, playerIdx, getGoStopDeps());
    if (newState.phase === PHASE.GO_STOP) return newState;
    return endTurn(newState);
  }

  return state;
}

// ─── UI가 호출하는 export (공개 API) ───────────────────────────

/** ① 패에서 카드 1장 — 이후 자동으로 ② 덱 뒤집기까지 진행 */
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

  newState = handleCardPlay(newState, playerIdx, card, false, getCardPlayDeps());

  if (newState.phase === PHASE.CHOOSE_MATCH) {
    return newState;
  }

  return continueAfterCapture(newState, playerIdx, RESUME_AFTER.FLIP_STOCK);
}

/** 바닥 2장 중 맞출 카드 선택 (CHOOSE_MATCH) */
export function chooseMatch(state, tableCardId) {
  if (state.phase !== PHASE.CHOOSE_MATCH) return state;

  const playerIdx = state.currentPlayer;
  const playedCard = state.pendingCard;
  const tableCard = state.matchCandidates.find((c) => c.id === tableCardId);
  if (!tableCard) return state;

  const isFromStock = state.matchSource === 'stock';
  let newState = processMatch(
    state,
    playerIdx,
    playedCard,
    tableCard,
    isFromStock,
    getCardPlayDeps(),
  );

  newState = {
    ...newState,
    phase: PHASE.PLAYING,
    pendingCard: null,
    matchCandidates: [],
    matchSource: null,
  };

  if (isFromStock) {
    return continueAfterCapture(newState, playerIdx, RESUME_AFTER.END_TURN);
  }

  return continueAfterCapture(newState, playerIdx, RESUME_AFTER.FLIP_STOCK);
}

/** 9월 국화 엽('yul') / 피('pi') 선택 — 로직은 dualCapture.js */
export function chooseCaptureType(state, asType) {
  return applyCaptureTypeChoice(state, asType, getDualCaptureDeps());
}

/** 고 — goStop.js */
export function handleGo(state) {
  return applyGo(state, getGoStopDeps());
}

/** 스톱 — goStop.js */
export function handleStop(state) {
  return applyStop(state, getGoStopDeps());
}

/** 시작 화면에서 새 게임 */
export function startNewGame(playerName, targetScore = 7, difficulty = 'normal') {
  const state = createInitialState(playerName, '컴퓨터');
  return { ...state, targetScore, difficulty, phase: PHASE.PLAYING };
}
