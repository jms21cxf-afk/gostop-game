import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PHASE,
  startNewGame,
  playCardFromHand,
  chooseMatch,
  chooseCaptureType,
  handleGo,
  handleStop,
} from '../logic/gameEngine';
import { aiChooseCard, aiChooseMatch, aiChooseGoStop, isAiTurn } from '../logic/ai';
import { saveGame, loadGame, clearSavedGame, hasSavedGame, saveSettings, loadSettings } from '../storage/gameStorage';
import { playSound, unlockAudio } from '../utils/sounds';
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

const AI_THINK_MS = 1400;
const AI_PREVIEW_MS = 1200;
const TURN_REST_MS = 2400;
const ANIM_GAP_MS = 950;
const CAPTURE_LAND_MS = 800;

function getQueuedPrehideEvents(gameState, processedSeq, animEvent, animQueue) {
  const queueSeqs = new Set(animQueue.map((e) => e.seq));
  const waiting = animEvent ? animQueue.slice(1) : animQueue;
  const notInQueueYet = (gameState?.eventQueue ?? []).filter(
    (e) => e.seq > processedSeq && !queueSeqs.has(e.seq),
  );
  return [...waiting, ...notInQueueYet];
}

function getPrehiddenIds(events) {
  const captured = [];
  for (const ev of events) {
    if (!ev.cards?.length) continue;
    if (ev.to === 'captured') captured.push(...ev.cards.map((c) => c.id));
  }
  return {
    captured: [...new Set(captured)],
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
      if (event.to === 'captured') {
        playSound('flipCard');
        playSound('match');
      }
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
  const [gameState, setGameState] = useState(null);
  const [settings, setSettings] = useState(loadSettings());
  const [showHelp, setShowHelp] = useState(false);
  const [saved, setSaved] = useState(hasSavedGame());
  const [aiThinking, setAiThinking] = useState(false);
  const [aiPreviewCard, setAiPreviewCard] = useState(null);
  const [aiTableHighlight, setAiTableHighlight] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [animEvent, setAnimEvent] = useState(null);
  const [animQueue, setAnimQueue] = useState([]);
  const [hiddenCapturedIds, setHiddenCapturedIds] = useState([]);
  const [landingCapturedIds, setLandingCapturedIds] = useState([]);
  const [pileActive, setPileActive] = useState(false);
  const [turnResting, setTurnResting] = useState(false);

  const processedSeqRef = useRef(0);
  const animQueueRef = useRef([]);
  const animEventRef = useRef(null);
  const gameStateRef = useRef(null);
  const aiRunningRef = useRef(false);
  const restTimerRef = useRef(null);
  const gapTimerRef = useRef(null);
  const aiTimerRef = useRef(null);
  const turnRestingRef = useRef(false);

  gameStateRef.current = gameState;
  animQueueRef.current = animQueue;
  animEventRef.current = animEvent;
  turnRestingRef.current = turnResting;

  // state.eventQueue에 아직 animQueue로 옮기기 전 이벤트가 있으면 AI가 먼저 도는 레이스 방지
  const hasPendingEvents = (gameState?.eventQueue?.some(
    (e) => e.seq > processedSeqRef.current,
  )) ?? false;
  const isBusy = animQueue.length > 0 || animEvent !== null || hasPendingEvents;
  const isLocked = isBusy || turnResting;

  const queuedPrehide = getQueuedPrehideEvents(
    gameState,
    processedSeqRef.current,
    animEvent,
    animQueue,
  );
  const prehidden = getPrehiddenIds(queuedPrehide);
  const displayHiddenCaptured = [...new Set([...hiddenCapturedIds, ...prehidden.captured])];

  useEffect(() => {
    if (gameState && gameState.phase !== PHASE.GAME_END) {
      const { eventQueue, lastEvent, ...toSave } = gameState;
      saveGame(toSave);
      setSaved(true);
    }
  }, [gameState]);

  const startNextAnimation = useCallback(() => {
    if (animEventRef.current || turnRestingRef.current) return;
    const queue = animQueueRef.current;
    if (!queue.length) return;

    const next = queue[0];
    playEventSound(next);

    // go/stop 등 카드 없는 이벤트는 애니 없이 바로 처리 (안 하면 AI 턴 영구 정지)
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
  }, []);

  useEffect(() => {
    if (isLocked || aiRunningRef.current) return;
    const state = gameStateRef.current;
    if (state && isAiTurn(state)) runAiTurn();
  }, [isLocked, hasPendingEvents, gameState?.currentPlayer, gameState?.phase, gameState?.players?.[1]?.hand?.length, runAiTurn]);

  useEffect(() => {
    const state = gameStateRef.current;
    if (state && !isAiTurn(state)) {
      resetAiState();
    }
  }, [gameState?.currentPlayer, resetAiState]);

  useEffect(() => () => {
    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    if (restTimerRef.current) clearTimeout(restTimerRef.current);
    if (gapTimerRef.current) clearTimeout(gapTimerRef.current);
  }, []);

  const handleStart = useCallback((playerName, target, difficulty) => {
    unlockAudio();
    clearSavedGame();
    saveSettings({ playerName, targetScore: target, difficulty });
    setSettings({ playerName, targetScore: target, difficulty });
    setGameState(startNewGame(playerName, target, difficulty));
    setSaved(false);
    processedSeqRef.current = 0;
    setAnimQueue([]);
    animQueueRef.current = [];
    setAnimEvent(null);
    setTurnResting(false);
    setHiddenCapturedIds([]);
    aiRunningRef.current = false;
  }, []);

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
      processedSeqRef.current = savedState.eventSeq || 0;
      setAnimQueue([]);
      animQueueRef.current = [];
      setAnimEvent(null);
      setTurnResting(false);
    }
  }, []);

  const handleCardClick = useCallback((card) => {
    if (isLocked) return;
    resetAiState();
    setGameState((prev) => playCardFromHand(prev, card.id));
  }, [isLocked, resetAiState]);

  const handleTableClick = useCallback((card) => {
    if (isLocked) return;
    setGameState((prev) => chooseMatch(prev, card.id));
  }, [isLocked]);

  const handleNewGame = useCallback(() => {
    clearSavedGame();
    setGameState(null);
    setSaved(false);
    processedSeqRef.current = 0;
    aiRunningRef.current = false;
  }, []);

  if (!gameState) {
    return (
      <StartScreen
        settings={settings}
        onStart={handleStart}
        onContinue={handleContinue}
        hasSave={saved}
      />
    );
  }

  const { players, currentPlayer, table, stock, phase, round, targetScore } = gameState;
  const isChoosing = phase === PHASE.CHOOSE_MATCH && currentPlayer === 0;
  const isChoosingCapture = phase === PHASE.CHOOSE_CAPTURE_TYPE && currentPlayer === 0;
  const isPlayerGoStop = phase === PHASE.GO_STOP && currentPlayer === 0;

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
            <button className="btn btn-small" onClick={() => setShowHelp(true)}>❓ 도움말</button>
            <button className="btn btn-small btn-danger" onClick={handleNewGame}>나가기</button>
          </div>
        </header>

        <ScoreBar players={players} stockCount={stock.length} round={round} targetScore={targetScore} />

        <div className={`message-bar ${isChoosing || isChoosingCapture ? 'message-bar-hint' : ''} ${turnResting ? 'message-bar-rest' : ''}`} role="status" aria-live="polite">
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
            onCardClick={handleTableClick}
            selectable={isChoosing}
            stockCount={stock.length}
            highlightCardId={aiTableHighlight}
            pileActive={pileActive}
            chooseMonth={isChoosing ? gameState.pendingCard?.month : null}
          />

          {isChoosing && (
            <div className="choose-hint">
              <strong>왜 고르나요?</strong> 같은 {gameState.pendingCard?.month}월이 바닥에 2장!
              <br />👆 <strong>맞출 바닥 카드</strong>를 터치하세요
            </div>
          )}

          <PlayerHand
            cards={players[0].hand}
            onCardClick={handleCardClick}
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
          onChoose={(asType) => {
            playSound('match');
            setGameState((prev) => chooseCaptureType(prev, asType));
          }}
        />
      )}

      {isPlayerGoStop && (
        <GoStopModal
          playerName={players[0].name}
          score={players[0].score}
          goCount={players[0].goCount}
          onGo={() => {
            unlockAudio();
            playSound('go');
            resetAiState();
            setGameState((prev) => handleGo(prev));
          }}
          onStop={() => {
            unlockAudio();
            playSound('stop');
            resetAiState();
            setGameState((prev) => handleStop(prev));
          }}
        />
      )}

      {phase === PHASE.GAME_END && (
        <GameEndModal
          players={players}
          winnerName={gameState.winner}
          message={gameState.message}
          onNewGame={handleNewGame}
        />
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
