import { useState, useEffect, useCallback, useRef } from 'react';
import { PHASE } from '../logic/gameEngine';
import { isAiTurn } from '../logic/ai';
import { playSound } from '../utils/sounds';
import { useGostopGameState } from '../hooks/useGostopGameState';
import { useAiTurn } from '../hooks/useAiTurn';
import { useGameModals } from '../hooks/useGameModals';
import StartScreen from './StartScreen';
import PlayerHand from './PlayerHand';
import TableArea from './TableArea';
import GoStopModal from './GoStopModal';
import DualCaptureModal from './DualCaptureModal';
import GameEndModal from './GameEndModal';
import HelpModal from './HelpModal';
import MuteButton from './MuteButton';
import ScoreBar from './ScoreBar';
import FlyingCardLayer from './FlyingCardLayer';
import CapturedStrip from './CapturedStrip';

const TURN_REST_MS = 2400;
const ANIM_GAP_MS = 950;
const CAPTURE_LAND_MS = 800;

function getQueuedPrehideEvents(gameState, processedSeq, animEvent, animQueue) {
  const queueSeqs = new Set(animQueue.map((e) => e.seq));
  const waiting = animEvent ? animQueue.slice(1) : animQueue;
  const notInQueueYet = (gameState?.eventQueue ?? []).filter(
    (e) => e.seq > processedSeq && !queueSeqs.has(e.seq),
  );
  // 재생 중인 이벤트도 prehide 대상 (바닥·먹은패가 애니 전에 보이지 않게)
  const current = animEvent ? [animEvent] : [];
  return [...current, ...waiting, ...notInQueueYet];
}

function getPrehiddenIds(events) {
  const captured = [];
  const table = [];
  for (const ev of events) {
    if (!ev.cards?.length) continue;
    if (ev.to === 'captured') captured.push(...ev.cards.map((c) => c.id));
    if (ev.to === 'table') table.push(...ev.cards.map((c) => c.id));
  }
  return {
    captured: [...new Set(captured)],
    table: [...new Set(table)],
  };
}

function playEventSound(event) {
  if (!event?.type) return;
  switch (event.type) {
    case 'play_hand':
      playSound('playCard');
      if (event.to === 'captured') playSound('match');
      break;
    case 'flip_stock':
      playSound('flipCard');
      if (event.to === 'captured') playSound('match');
      break;
    case 'ppung':
      playSound('ppung');
      break;
    case 'go':
      if (event.playerIdx !== 0) playSound('go');
      break;
    case 'stop':
      if (event.playerIdx !== 0) playSound('stop');
      break;
    default:
      break;
  }
}

function getDisplayMessage({
  statusMessage,
  turnResting,
  gameState,
  aiThinking,
  aiPreviewCard,
  isChoosing,
  isChoosingCapture,
  isBusy,
  animEvent,
  animQueue,
}) {
  if (statusMessage) return statusMessage;

  if (turnResting && gameState) {
    if (isAiTurn(gameState)) return '🤖 컴퓨터 차례 · 잠시 쉬어요...';
    return '✅ 한 번 쉬어요 · 이제 ① 패에서 카드를 고르세요';
  }

  if (isBusy) {
    const ev = animEvent || animQueue[0];
    if (ev?.type === 'flip_stock') return '② 덱에서 카드를 뒤집는 중...';
    if (ev?.type === 'play_hand' && ev?.to === 'captured') return '✨ 짝! 먹은 패로 가져갑니다...';
    if (ev?.type === 'play_hand') return '① 카드를 냈어요 · 곧 ② 덱을 뒤집습니다...';
  }

  if (isChoosingCapture) {
    return '9월 국화를 먹었어요! 👇 엽 또는 피 중 어디에 둘지 고르세요';
  }

  if (isChoosing) {
    const month = gameState.pendingCard?.month;
    const fromDeck = gameState.matchSource === 'stock';
    return fromDeck
      ? `덱에서 ${month}월! 바닥 ${month}월 2장 → 👆 맞출 카드 고르세요`
      : `${month}월 냈는데 바닥에 ${month}월 2장! 👆 맞출 카드 고르세요`;
  }

  if (aiPreviewCard) return `🤖 컴퓨터 ① ${aiPreviewCard.month}월 카드를 냅니다...`;
  if (aiThinking && gameState && isAiTurn(gameState)) return '🤖 컴퓨터가 생각하고 있습니다...';

  return gameState?.message || '';
}

export default function GameBoard() {
  const processedSeqRef = useRef(0);
  const animQueueRef = useRef([]);
  const animEventRef = useRef(null);
  const turnRestingRef = useRef(false);
  const restTimerRef = useRef(null);
  const gapTimerRef = useRef(null);

  const [animEvent, setAnimEvent] = useState(null);
  const [animQueue, setAnimQueue] = useState([]);
  const [hiddenCapturedIds, setHiddenCapturedIds] = useState([]);
  const [landingCapturedIds, setLandingCapturedIds] = useState([]);
  const [pileActive, setPileActive] = useState(false);
  const [turnResting, setTurnResting] = useState(false);

  animQueueRef.current = animQueue;
  animEventRef.current = animEvent;
  turnRestingRef.current = turnResting;

  const resetAnimationSession = useCallback(() => {
    setAnimQueue([]);
    animQueueRef.current = [];
    setAnimEvent(null);
    setTurnResting(false);
    setHiddenCapturedIds([]);
    setLandingCapturedIds([]);
  }, []);

  const {
    gameState,
    setGameState,
    gameStateRef,
    settings,
    saved,
    handleStart,
    handleContinue,
    handleCardClick: playCardFromHandClick,
    handleTableClick: chooseMatchClick,
    handleNewGame,
  } = useGostopGameState({
    processedSeqRef,
    onSessionReset: resetAnimationSession,
  });

  const hasPendingEvents =
    (gameState?.eventQueue?.some((e) => e.seq > processedSeqRef.current)) ?? false;
  const isBusy = animQueue.length > 0 || animEvent !== null || hasPendingEvents;
  const isLocked = isBusy || turnResting;

  const {
    aiThinking,
    aiPreviewCard,
    aiTableHighlight,
    statusMessage,
    resetAiState,
    aiRunningRef,
  } = useAiTurn({
    gameState,
    setGameState,
    gameStateRef,
    processedSeqRef,
    isLocked,
    hasPendingEvents,
    animQueueRef,
    animEventRef,
    turnRestingRef,
  });

  const {
    showHelp,
    setShowHelp,
    isChoosingCapture,
    isPlayerGoStop,
    isGameEnd,
    handleChooseCaptureType,
    handleGo,
    handleStop,
  } = useGameModals({ gameState, setGameState, resetAiState });

  const resetSession = useCallback(() => {
    resetAnimationSession();
    resetAiState();
    aiRunningRef.current = false;
  }, [resetAnimationSession, resetAiState, aiRunningRef]);

  const onStart = useCallback(
    (playerName, target, difficulty) => {
      handleStart(playerName, target, difficulty);
      resetSession();
    },
    [handleStart, resetSession],
  );

  const onContinue = useCallback(() => {
    handleContinue();
    resetAiState();
  }, [handleContinue, resetAiState]);

  const onNewGame = useCallback(() => {
    handleNewGame();
    resetSession();
  }, [handleNewGame, resetSession]);

  const onCardClick = useCallback(
    (card) => {
      if (isLocked) return;
      resetAiState();
      playCardFromHandClick(card);
    },
    [isLocked, resetAiState, playCardFromHandClick],
  );

  const onTableClick = useCallback(
    (card) => {
      if (isLocked) return;
      chooseMatchClick(card);
    },
    [isLocked, chooseMatchClick],
  );

  const queuedPrehide = getQueuedPrehideEvents(
    gameState,
    processedSeqRef.current,
    animEvent,
    animQueue,
  );
  const prehidden = getPrehiddenIds(queuedPrehide);
  const displayHiddenCaptured = [...new Set([...hiddenCapturedIds, ...prehidden.captured])];
  const displayHiddenTable = prehidden.table;

  const startNextAnimation = useCallback(() => {
    if (animEventRef.current || turnRestingRef.current) return;
    const queue = animQueueRef.current;
    if (!queue.length) return;

    const next = queue[0];
    playEventSound(next);

    if (!next.cards?.length) {
      processedSeqRef.current = next.seq;
      setAnimQueue((prev) => {
        const remaining = prev.slice(1);
        animQueueRef.current = remaining;

        if (gapTimerRef.current) clearTimeout(gapTimerRef.current);
        if (restTimerRef.current) clearTimeout(restTimerRef.current);

        if (remaining.length > 0) {
          gapTimerRef.current = setTimeout(() => startNextAnimation(), ANIM_GAP_MS);
        } else {
          setTurnResting(true);
          restTimerRef.current = setTimeout(() => {
            setTurnResting(false);
          }, TURN_REST_MS);
        }

        return remaining;
      });
      return;
    }

    if (next.to === 'captured') {
      setHiddenCapturedIds((prev) => [...new Set([...prev, ...next.cards.map((c) => c.id)])]);
    }

    setAnimEvent(next);
  }, []);

  const finishAnimation = useCallback(() => {
    setAnimEvent((current) => {
      if (current) {
        processedSeqRef.current = current.seq;
        if (current.to === 'captured') {
          const ids = current.cards.map((c) => c.id);
          setHiddenCapturedIds((prev) => prev.filter((id) => !ids.includes(id)));
          setLandingCapturedIds((prev) => [...new Set([...prev, ...ids])]);
          setTimeout(() => {
            setLandingCapturedIds((prev) => prev.filter((id) => !ids.includes(id)));
          }, CAPTURE_LAND_MS);
        }
      }
      return null;
    });

    setAnimQueue((prev) => {
      const remaining = prev.slice(1);
      animQueueRef.current = remaining;

      if (gapTimerRef.current) clearTimeout(gapTimerRef.current);
      if (restTimerRef.current) clearTimeout(restTimerRef.current);

      if (remaining.length > 0) {
        gapTimerRef.current = setTimeout(() => startNextAnimation(), ANIM_GAP_MS);
      } else {
        setTurnResting(true);
        restTimerRef.current = setTimeout(() => {
          setTurnResting(false);
        }, TURN_REST_MS);
      }

      return remaining;
    });
  }, [startNextAnimation]);

  useEffect(() => {
    if (!gameState?.eventQueue?.length) return;
    const fresh = gameState.eventQueue.filter((e) => e.seq > processedSeqRef.current);
    if (!fresh.length) return;

    setAnimQueue((prev) => {
      const existing = new Set(prev.map((e) => e.seq));
      const added = fresh.filter((e) => !existing.has(e.seq));
      if (!added.length) return prev;
      const next = [...prev, ...added];
      animQueueRef.current = next;
      return next;
    });
  }, [gameState?.eventSeq, gameState?.eventQueue]);

  useEffect(() => {
    if (!animQueue.length || animEvent || turnResting) return;
    startNextAnimation();
  }, [animQueue.length, animEvent, turnResting, startNextAnimation]);

  useEffect(
    () => () => {
      if (restTimerRef.current) clearTimeout(restTimerRef.current);
      if (gapTimerRef.current) clearTimeout(gapTimerRef.current);
    },
    [],
  );

  if (!gameState) {
    return (
      <StartScreen
        settings={settings}
        onStart={onStart}
        onContinue={onContinue}
        hasSave={saved}
      />
    );
  }

  if (!gameState.players?.[0] || !gameState.players?.[1]) {
    return (
      <StartScreen
        settings={settings}
        onStart={onStart}
        onContinue={onContinue}
        hasSave={false}
      />
    );
  }

  const { players, currentPlayer, table, stock, phase, round, targetScore } = gameState;
  const isChoosing = phase === PHASE.CHOOSE_MATCH && currentPlayer === 0;

  const displayMessage = getDisplayMessage({
    statusMessage,
    turnResting,
    gameState,
    aiThinking,
    aiPreviewCard,
    isChoosing,
    isChoosingCapture,
    isBusy,
    animEvent,
    animQueue,
  });

  return (
    <div className="game-board">
      <div className="game-top-bar">
        <header className="game-header compact-header">
          <h1 className="header-title">🎴 고스톱</h1>
          <div className="header-actions">
            <MuteButton />
            <button type="button" className="btn btn-small" onClick={() => setShowHelp(true)}>
              ❓ 도움말
            </button>
            <button type="button" className="btn btn-small btn-danger" onClick={onNewGame}>
              나가기
            </button>
          </div>
        </header>

        <ScoreBar
          players={players}
          stockCount={stock.length}
          round={round}
          targetScore={targetScore}
        />

        <div
          className={`message-bar ${isChoosing || isChoosingCapture ? 'message-bar-hint' : ''} ${turnResting ? 'message-bar-rest' : ''}`}
          role="status"
          aria-live="polite"
        >
          {displayMessage}
        </div>
      </div>

      <div className="play-area">
        <CapturedStrip
          side="left"
          playerName={players[0].name}
          captured={players[0].captured}
          score={players[0].score}
          hiddenIds={displayHiddenCaptured}
          landingIds={landingCapturedIds}
        />

        <div className="play-center">
          <FlyingCardLayer
            event={animEvent}
            onDone={finishAnimation}
            onPileActive={setPileActive}
          />

          <PlayerHand
            cards={players[1].hand}
            playerName={players[1].name}
            position="top"
            isActive={currentPlayer === 1 && !isLocked}
            isAi
            thinking={aiThinking}
            previewCardId={!isLocked && currentPlayer === 1 ? aiPreviewCard?.id : null}
          />

          <TableArea
            cards={table}
            onCardClick={onTableClick}
            selectable={isChoosing}
            stockCount={stock.length}
            highlightCardId={aiTableHighlight}
            pileActive={pileActive}
            chooseMonth={isChoosing ? gameState.pendingCard?.month : null}
            hiddenIds={displayHiddenTable}
          />

          {isChoosing && (
            <div className="choose-hint">
              <strong>왜 고르나요?</strong> 같은 {gameState.pendingCard?.month}월이 바닥에 2장!
              <br />👆 <strong>맞출 바닥 카드</strong>를 터치하세요
            </div>
          )}

          <PlayerHand
            cards={players[0].hand}
            onCardClick={onCardClick}
            playerName={players[0].name}
            position="bottom"
            isActive={currentPlayer === 0 && phase === PHASE.PLAYING && !isLocked}
          />
        </div>

        <CapturedStrip
          side="right"
          playerName={`🤖 ${players[1].name}`}
          captured={players[1].captured}
          score={players[1].score}
          hiddenIds={displayHiddenCaptured}
          landingIds={landingCapturedIds}
        />
      </div>

      {isChoosingCapture && (
        <DualCaptureModal
          card={gameState.pendingDualCard}
          onChoose={handleChooseCaptureType}
        />
      )}

      {isPlayerGoStop && (
        <GoStopModal
          playerName={players[0].name}
          score={players[0].score}
          goCount={players[0].goCount}
          onGo={handleGo}
          onStop={handleStop}
        />
      )}

      {isGameEnd && (
        <GameEndModal
          players={players}
          winnerName={gameState.winner}
          message={gameState.message}
          onNewGame={onNewGame}
        />
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
