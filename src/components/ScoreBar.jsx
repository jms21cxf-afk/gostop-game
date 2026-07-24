import { calculateScore } from '../logic/scoring';

export default function ScoreBar({ players, stockCount, round, targetScore }) {
  const p0 = players[0];
  const p1 = players[1];
  const y0 = calculateScore(p0.captured).yaku;
  const y1 = calculateScore(p1.captured).yaku;

  return (
    <div className="score-bar">
      <div className="score-block score-user">
        <span className="score-name">{p0.name}</span>
        <span className="score-points">{p0.score}점</span>
        <span className="score-hand">패 {p0.hand.length}장</span>
        <span className="score-total">누적 {p0.totalScore}</span>
        {y0.length > 0 && (
          <span className="score-yaku">{y0.map((y) => y.name).join(' ')}</span>
        )}
      </div>

      <div className="score-center">
        <div className="deck-mini">
          <div className="deck-stack-mini" />
          <span>덱 {stockCount}</span>
        </div>
        <span className="round-mini">{round}판 · 목표 {targetScore}점</span>
      </div>

      <div className="score-block score-ai">
        <span className="score-name">🤖 {p1.name}</span>
        <span className="score-points">{p1.score}점</span>
        <span className="score-hand">패 {p1.hand.length}장</span>
        <span className="score-total">누적 {p1.totalScore}</span>
        {y1.length > 0 && (
          <span className="score-yaku">{y1.map((y) => y.name).join(' ')}</span>
        )}
      </div>
    </div>
  );
}
