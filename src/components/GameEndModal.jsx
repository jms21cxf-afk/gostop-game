import { useEffect } from 'react';
import Fireworks from './Fireworks';
import { playSound } from '../utils/sounds';

export default function GameEndModal({ players, winnerName, message, onNewGame }) {
  const winner = players.find((p) => p.name === winnerName);
  const playerWon = winner ? !winner.isAi : players[0].name === winnerName;

  useEffect(() => {
    if (playerWon) playSound('win');
  }, [playerWon]);

  return (
    <div className={`modal-overlay game-end-overlay ${playerWon ? 'game-end-win' : 'game-end-lose'}`}>
      {playerWon && <Fireworks />}
      <div className={`modal-content game-end-modal ${playerWon ? 'game-end-modal-win' : 'game-end-modal-lose'}`}>
        {playerWon ? (
          <>
            <h2>🎊 축하합니다!</h2>
            <p className="winner-text winner-text-celebrate">{message}</p>
            <p className="game-end-sub">멋진 승리입니다! 🏆</p>
          </>
        ) : (
          <>
            <h2>😢 아쉽네요...</h2>
            <p className="winner-text loser-text">{message}</p>
            <p className="game-end-sub game-end-retry">💪 다시 도전하세요!</p>
          </>
        )}

        <div className="final-scores">
          {players.map((p) => (
            <div
              key={p.name}
              className={`final-score-item ${p.name === winnerName ? 'final-score-winner' : ''}`}
            >
              <span>{p.isAi ? '🤖 ' : ''}{p.name}</span>
              <strong>{p.totalScore}점</strong>
            </div>
          ))}
        </div>

        <button className="btn btn-primary btn-large" onClick={onNewGame}>
          {playerWon ? '메인으로 돌아가기' : '다시 도전하기'}
        </button>
      </div>
    </div>
  );
}
