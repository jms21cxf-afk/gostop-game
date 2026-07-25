import { useState, useEffect, useCallback, useRef } from 'react';
import { PHASE, startNewGame, playCardFromHand, chooseMatch } from '../logic/gameEngine';
import {
  saveGame,
  loadGame,
  clearSavedGame,
  hasSavedGame,
  saveSettings,
  loadSettings,
} from '../storage/gameStorage';
import { unlockAudio } from '../utils/sounds';

/**
 * 게임 state · 저장/불러오기 · 플레이어 입력(패/바닥) 연결
 * processedSeqRef — GameBoard 애니메이션과 공유
 */
export function useGostopGameState({ onSessionReset, processedSeqRef }) {
  const [gameState, setGameState] = useState(null);
  const [settings, setSettings] = useState(loadSettings());
  const [saved, setSaved] = useState(hasSavedGame());
  const gameStateRef = useRef(null);

  gameStateRef.current = gameState;

  useEffect(() => {
    if (!gameState || gameState.phase === PHASE.GAME_END) return undefined;

    const timer = setTimeout(() => {
      const { eventQueue, lastEvent, ...toSave } = gameState;
      saveGame(toSave);
      setSaved(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [gameState]);

  const resetProcessedSeq = useCallback(
    (seq = 0) => {
      processedSeqRef.current = seq;
    },
    [processedSeqRef],
  );

  const handleStart = useCallback(
    (playerName, target, difficulty) => {
      unlockAudio();
      clearSavedGame();
      saveSettings({ playerName, targetScore: target, difficulty });
      setSettings({ playerName, targetScore: target, difficulty });
      setGameState(startNewGame(playerName, target, difficulty));
      setSaved(false);
      resetProcessedSeq(0);
      onSessionReset?.();
    },
    [onSessionReset, resetProcessedSeq],
  );

  const handleContinue = useCallback(() => {
    const savedState = loadGame();
    if (savedState?.players?.[0] && savedState?.players?.[1]) {
      setGameState({
        ...savedState,
        eventQueue: [],
        lastEvent: null,
        players: savedState.players.map((p) => ({
          ...p,
          hand: p.hand || [],
          captured: p.captured || [],
        })),
      });
      resetProcessedSeq(savedState.eventSeq || 0);
      onSessionReset?.();
    }
  }, [onSessionReset, resetProcessedSeq]);

  const handleCardClick = useCallback((card) => {
    setGameState((prev) => (prev ? playCardFromHand(prev, card.id) : prev));
  }, []);

  const handleTableClick = useCallback((card) => {
    setGameState((prev) => (prev ? chooseMatch(prev, card.id) : prev));
  }, []);

  const handleNewGame = useCallback(() => {
    clearSavedGame();
    setGameState(null);
    setSaved(false);
    resetProcessedSeq(0);
    onSessionReset?.();
  }, [onSessionReset, resetProcessedSeq]);

  return {
    gameState,
    setGameState,
    gameStateRef,
    settings,
    saved,
    processedSeqRef,
    handleStart,
    handleContinue,
    handleCardClick,
    handleTableClick,
    handleNewGame,
  };
}
