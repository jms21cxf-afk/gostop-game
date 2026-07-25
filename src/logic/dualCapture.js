/**
 * dualCapture.js — 9월 국화 쌍피: 엽(yul) / 피(pi) 선택
 *
 * 【호출】 gameEngine.continueAfterCapture → promptDualChoiceIfNeeded
 * 【UI】 GameBoard → gameEngine.chooseCaptureType (래퍼)
 */
import { isDualYulPiCard, applyCaptureType } from '../data/cards';
import { aiChooseCaptureType } from './ai';

const DUAL_MESSAGE = '9월 국화는 엽 또는 피 중 어디에 둘까요?';

/** dualPending 상태인 9월 쌍피 카드 목록 */
export function getPendingDualCards(player) {
  return (player.captured || []).filter((c) => c.dualPending && isDualYulPiCard(c));
}

/** AI: 9월 카드 엽/피 자동 선택 후 턴 계속 */
function resolveDualForAi(state, playerIdx, resumeAfter, deps) {
  const { continueAfterCapture, updatePlayerScore } = deps;
  let next = state;
  let pending = getPendingDualCards(next.players[playerIdx]);
  while (pending.length > 0) {
    const card = pending[0];
    const player = next.players[playerIdx];
    const asType = aiChooseCaptureType(player, card);
    const newCaptured = player.captured.map((c) =>
      c.id === card.id ? applyCaptureType(c, asType) : c,
    );
    const updated = updatePlayerScore({ ...player, captured: newCaptured });
    next = {
      ...next,
      players: next.players.map((p, i) => (i === playerIdx ? updated : p)),
    };
    pending = getPendingDualCards(updated);
  }
  return continueAfterCapture(next, playerIdx, resumeAfter, true);
}

/**
 * 9월 선택 필요하면 CHOOSE_CAPTURE_TYPE state, 아니면 null
 * @param deps.continueAfterCapture — gameEngine 턴 연결 (순환 import 방지용 주입)
 */
export function promptDualChoiceIfNeeded(state, playerIdx, resumeAfter, deps) {
  const { chooseCapturePhase } = deps;
  const player = state.players[playerIdx];
  const pending = getPendingDualCards(player);
  if (pending.length === 0) return null;

  if (player.isAi) {
    return resolveDualForAi(state, playerIdx, resumeAfter, deps);
  }

  return {
    ...state,
    phase: chooseCapturePhase,
    pendingDualCard: pending[0],
    dualResumeAfter: resumeAfter,
    message: DUAL_MESSAGE,
  };
}

/** 9월 국화 엽('yul') / 피('pi') 선택 — gameEngine.chooseCaptureType 에서 래핑 */
export function applyCaptureTypeChoice(state, asType, deps) {
  const { chooseCapturePhase, playingPhase, continueAfterCapture, updatePlayerScore } = deps;

  if (state.phase !== chooseCapturePhase) return state;
  if (asType !== 'yul' && asType !== 'pi') return state;

  const playerIdx = state.currentPlayer;
  const card = state.pendingDualCard;
  if (!card) return state;

  const player = state.players[playerIdx];
  const newCaptured = player.captured.map((c) =>
    c.id === card.id ? applyCaptureType(c, asType) : c,
  );
  const updatedPlayer = updatePlayerScore({ ...player, captured: newCaptured });

  let newState = {
    ...state,
    players: state.players.map((p, i) => (i === playerIdx ? updatedPlayer : p)),
    pendingDualCard: null,
    phase: playingPhase,
  };

  const stillPending = getPendingDualCards(updatedPlayer);
  if (stillPending.length > 0) {
    return {
      ...newState,
      phase: chooseCapturePhase,
      pendingDualCard: stillPending[0],
      message: DUAL_MESSAGE,
    };
  }

  return continueAfterCapture(newState, playerIdx, state.dualResumeAfter, true);
}
