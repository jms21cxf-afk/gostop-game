/**
 * goStop.js — 고/스톱 선택 · 라운드·게임 정산
 *
 * 【호출】 gameEngine.continueAfterCapture → checkGoStop
 *         gameEngine.endTurn → endRound (덱 소진)
 * 【UI】 GameBoard → gameEngine.handleGo / handleStop (래퍼)
 */
import { dealUntilValid } from './dealChecks';
import { canGoStop } from './scoring';

/** 7점 이상이면 GO_STOP phase 로 고/스톱 선택 */
export function checkGoStop(state, playerIdx, deps) {
  const { goStopPhase } = deps;
  const player = state.players[playerIdx];
  if (canGoStop(player.score)) {
    return {
      ...state,
      phase: goStopPhase,
      message: `${player.name}님, ${player.score}점입니다! 고 할까요, 스톱 할까요?`,
    };
  }
  return state;
}

/** 덱 소진 시 라운드 정산 → 목표점수면 GAME_END, 아니면 재딜 */
export function endRound(state, deps) {
  const { gameEndPhase, playingPhase } = deps;
  const p0 = state.players[0];
  const p1 = state.players[1];
  const roundWinner = p0.score >= p1.score ? 0 : 1;

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
      phase: gameEndPhase,
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
    phase: playingPhase,
    ppungBonus: 0,
    message: roundMsg,
  };
}

/** 고 — goCount+1 후 턴 계속 (endTurn 은 gameEngine 에서 주입) */
export function applyGo(state, deps) {
  const { emitEvent, playingPhase, endTurn } = deps;
  const playerIdx = state.currentPlayer;
  const newPlayers = state.players.map((p, i) =>
    i === playerIdx ? { ...p, goCount: p.goCount + 1 } : p,
  );

  const newState = emitEvent({
    ...state,
    players: newPlayers,
    phase: playingPhase,
    pendingCard: null,
    matchCandidates: [],
    matchSource: null,
    pendingDualCard: null,
    dualResumeAfter: null,
    message: `${state.players[playerIdx].name}님이 고를 외쳤습니다!`,
  }, { type: 'go', playerIdx, cards: [] });

  return endTurn(newState);
}

/** 스톱 — score × (1+goCount) 누적, 목표점수면 GAME_END 아니면 새 판 */
export function applyStop(state, deps) {
  const { gameEndPhase, playingPhase } = deps;
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
      phase: gameEndPhase,
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
    phase: playingPhase,
    ppungBonus: 0,
    pendingCard: null,
    matchCandidates: [],
    matchSource: null,
    pendingDualCard: null,
    dualResumeAfter: null,
    message: stopMsg,
  };
}
