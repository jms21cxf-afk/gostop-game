import { useState, useEffect, useCallback, useRef } from 'react';
import { PHASE, playCardFromHand, chooseMatch, handleGo, handleStop } from '../logic/gameEngine';
import { aiChooseCard, aiChooseMatch, aiChooseGoStop, isAiTurn } from '../logic/ai';
import { playSound } from '../utils/sounds';

const AI_THINK_MS = 1400;
const AI_PREVIEW_MS = 1200;

/**
 * AI 턴 — 생각·미리보기·패/매칭/고·스톱 자동 처리
 */
export function useAiTurn({
  gameState,
  setGameState,
  gameStateRef,
  processedSeqRef,
  isLocked,
  hasPendingEvents,
  animQueueRef,
  animEventRef,
  turnRestingRef,
}) {
  const [aiThinking, setAiThinking] = useState(false);
  const [aiPreviewCard, setAiPreviewCard] = useState(null);
  const [aiTableHighlight, setAiTableHighlight] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const aiRunningRef = useRef(false);
  const aiTimerRef = useRef(null);

  const resetAiState = useCallback(() => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    aiTimerRef.current = null;
    aiRunningRef.current = false;
    setAiThinking(false);
    setAiPreviewCard(null);
    setAiTableHighlight(null);
    setStatusMessage('');
  }, []);

  const runAiTurn = useCallback(() => {
    if (aiRunningRef.current) return;
    const state = gameStateRef.current;
    if (!state || !isAiTurn(state) || turnRestingRef.current) return;
    if (animQueueRef.current.length || animEventRef.current) return;
    if (state.eventQueue?.some((e) => e.seq > processedSeqRef.current)) return;

    const aiPhases = [PHASE.PLAYING, PHASE.CHOOSE_MATCH, PHASE.GO_STOP];
    if (!aiPhases.includes(state.phase)) return;

    aiRunningRef.current = true;
    setAiThinking(true);

    aiTimerRef.current = setTimeout(() => {
      const cur = gameStateRef.current;
      if (!cur || !isAiTurn(cur)) {
        aiRunningRef.current = false;
        setAiThinking(false);
        return;
      }

      if (cur.phase === PHASE.PLAYING) {
        const card = aiChooseCard(cur);
        if (!card) {
          aiRunningRef.current = false;
          setAiThinking(false);
          return;
        }
        setAiPreviewCard(card);
        setStatusMessage(`🤖 컴퓨터 ① ${card.month}월 카드를 냅니다...`);
        setAiThinking(false);

        aiTimerRef.current = setTimeout(() => {
          setAiPreviewCard(null);
          setStatusMessage('');
          setGameState((s) => (s ? playCardFromHand(s, card.id) : s));
          aiRunningRef.current = false;
        }, AI_PREVIEW_MS);
        return;
      }

      if (cur.phase === PHASE.CHOOSE_MATCH) {
        const match = aiChooseMatch(cur);
        setAiTableHighlight(match.id);
        setStatusMessage(`🤖 컴퓨터가 ${match.month}월과 맞춥니다...`);
        setAiThinking(false);

        aiTimerRef.current = setTimeout(() => {
          setAiTableHighlight(null);
          setStatusMessage('');
          setGameState((s) => (s ? chooseMatch(s, match.id) : s));
          aiRunningRef.current = false;
        }, AI_PREVIEW_MS);
        return;
      }

      if (cur.phase === PHASE.GO_STOP) {
        const choice = aiChooseGoStop(cur);
        playSound(choice === 'go' ? 'go' : 'stop');
        setGameState((s) => {
          if (!s) return s;
          return choice === 'go' ? handleGo(s) : handleStop(s);
        });
        aiRunningRef.current = false;
        setAiThinking(false);
      }
    }, AI_THINK_MS);
  }, [
    animEventRef,
    animQueueRef,
    gameStateRef,
    processedSeqRef,
    setGameState,
    turnRestingRef,
  ]);

  useEffect(() => {
    if (isLocked || aiRunningRef.current) return;
    const state = gameStateRef.current;
    if (state && isAiTurn(state)) runAiTurn();
  }, [
    isLocked,
    hasPendingEvents,
    gameState?.currentPlayer,
    gameState?.phase,
    gameState?.players?.[1]?.hand?.length,
    runAiTurn,
    gameStateRef,
  ]);

  useEffect(() => {
    const state = gameStateRef.current;
    if (state && !isAiTurn(state)) {
      resetAiState();
    }
  }, [gameState?.currentPlayer, resetAiState, gameStateRef]);

  useEffect(
    () => () => {
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    },
    [],
  );

  return {
    aiThinking,
    aiPreviewCard,
    aiTableHighlight,
    statusMessage,
    resetAiState,
    aiRunningRef,
  };
}
