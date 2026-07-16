import { useState } from 'react';
import HelpModal from './HelpModal';
import MuteButton from './MuteButton';

const AI_NAME = '컴퓨터';
const DIFFICULTIES = [
  { value: 'easy', label: '쉬움 (AI가 가끔 실수)' },
  { value: 'normal', label: '보통' },
];

export default function StartScreen({ settings, onStart, onContinue, hasSave }) {
  const [playerName, setPlayerName] = useState(settings.playerName);
  const [target, setTarget] = useState(settings.targetScore);
  const [difficulty, setDifficulty] = useState(settings.difficulty || 'normal');
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="start-screen">
      <div className="start-top-bar">
        <MuteButton />
      </div>
      <div className="start-content">
        <h1 className="game-title">🎴 고스톱</h1>
        <p className="game-subtitle">컴퓨터와 함께하는 화투 · 손패 10장</p>

        <div className="start-form">
          <label className="form-label">
            내 이름
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="이름 입력"
              className="form-input"
            />
          </label>

          <label className="form-label">
            상대
            <input type="text" value={`🤖 ${AI_NAME}`} disabled className="form-input" />
          </label>

          <label className="form-label">
            목표 점수
            <select
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="form-input"
            >
              <option value={3}>3점 (빠른 게임)</option>
              <option value={7}>7점 (보통)</option>
              <option value={12}>12점 (긴 게임)</option>
            </select>
          </label>

          <label className="form-label">
            난이도
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="form-input"
            >
              {DIFFICULTIES.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="start-buttons">
          <button
            className="btn btn-primary btn-large"
            onClick={() => onStart(playerName || '나', target, difficulty)}
          >
            게임 시작
          </button>

          {hasSave && (
            <button className="btn btn-secondary btn-large" onClick={onContinue}>
              이어하기
            </button>
          )}

          <button className="btn btn-help btn-large" onClick={() => setShowHelp(true)}>
            ❓ 게임 방법
          </button>
        </div>
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
