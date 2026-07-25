/**
 * turnFlow.js — 턴 넘기기 · 덱 뒤집기 (② 덱)
 *
 * 【호출】 gameEngine.continueAfterCapture → flipStockCard / endTurn
 *         goStop.applyGo → endTurn (주입)
 */
/** 상대에게 턴 넘김 (덱 비었으면 goStop.endRound) */
export function endTurn(state, deps) {
  const { playingPhase, endRound, goStopDeps } = deps;
  const nextPlayer = state.currentPlayer === 0 ? 1 : 0;
  const nextName = state.players[nextPlayer].name;

  if (state.stock.length === 0) {
    return endRound(state, goStopDeps);
  }

  const stepMsg = nextPlayer === 0
    ? `${nextName}님 차례 · ① 패에서 카드 1장을 고르세요`
    : `🤖 ${nextName} 차례입니다...`;

  return {
    ...state,
    currentPlayer: nextPlayer,
    phase: playingPhase,
    message: stepMsg,
    pendingCard: null,
    matchCandidates: [],
    matchSource: null,
    pendingDualCard: null,
    dualResumeAfter: null,
  };
}

/** ② 덱에서 카드 1장 뒤집기 — cardPlay 후 continueAfterCapture(END_TURN) */
export function flipStockCard(state, deps) {
  const {
    endTurn,
    endTurnDeps,
    handleCardPlay,
    cardPlayDeps,
    continueAfterCapture,
    resumeEndTurn,
    chooseMatchPhase,
  } = deps;

  if (state.stock.length === 0) {
    return endTurn(state, endTurnDeps);
  }

  const [flipped, ...remainingStock] = state.stock;
  const playerIdx = state.currentPlayer;

  let newState = {
    ...state,
    stock: remainingStock,
    pendingCard: flipped,
  };

  newState = handleCardPlay(newState, playerIdx, flipped, true, cardPlayDeps);

  if (newState.phase === chooseMatchPhase) {
    return newState;
  }

  return continueAfterCapture(newState, playerIdx, resumeEndTurn);
}
