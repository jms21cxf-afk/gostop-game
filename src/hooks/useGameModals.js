import { useState, useCallback } from 'react';
import {
  PHASE,
  chooseCaptureType,
  handleGo as engineHandleGo,
  handleStop as engineHandleStop,
} from '../logic/gameEngine';
import { playSound, unlockAudio } from '../utils/sounds';

/**
 * 도움말·9월 선택·고/스톱·게임 종료 모달 연결
 */
export function useGameModals({ gameState, setGameState, resetAiState }) {
  const [showHelp, setShowHelp] = useState(false);

  const isChoosingCapture =
    gameState?.phase === PHASE.CHOOSE_CAPTURE_TYPE && gameState?.currentPlayer === 0;
  const isPlayerGoStop =
    gameState?.phase === PHASE.GO_STOP && gameState?.currentPlayer === 0;
  const isGameEnd = gameState?.phase === PHASE.GAME_END;

  const handleChooseCaptureType = useCallback(
    (asType) => {
      playSound('match');
      setGameState((prev) => (prev ? chooseCaptureType(prev, asType) : prev));
    },
    [setGameState],
  );

  const handleGo = useCallback(() => {
    unlockAudio();
    playSound('go');
    resetAiState?.();
    setGameState((prev) => (prev ? engineHandleGo(prev) : prev));
  }, [resetAiState, setGameState]);

  const handleStop = useCallback(() => {
    unlockAudio();
    playSound('stop');
    resetAiState?.();
    setGameState((prev) => (prev ? engineHandleStop(prev) : prev));
  }, [resetAiState, setGameState]);

  return {
    showHelp,
    setShowHelp,
    isChoosingCapture,
    isPlayerGoStop,
    isGameEnd,
    handleChooseCaptureType,
    handleGo,
    handleStop,
  };
}
