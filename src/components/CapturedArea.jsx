import { calculateScore } from '../logic/scoring';
import { getPiScoringValue } from '../data/cards';
import Card from './Card';

export default function CapturedArea({ captured, playerName, score, totalScore }) {
  const { yaku } = calculateScore(captured);

  const grouped = {
    kwang: captured.filter((c) => c.type === 'kwang'),
    yul: captured.filter((c) => c.type === 'yul'),
    tti: captured.filter((c) => c.type === 'tti'),
    pi: captured.filter((c) => c.type === 'pi'),
  };

  return (
    <div className="captured-area">
      <div className="captured-header">
        <h3>{playerName}</h3>
        <div className="score-display">
          <span className="round-score">이번 판: <strong>{score}점</strong></span>
          <span className="total-score">누적: <strong>{totalScore}점</strong></span>
        </div>
      </div>

      {yaku.length > 0 && (
        <div className="yaku-list">
          {yaku.map((y, i) => (
            <span key={i} className="yaku-badge">{y.name} +{y.points}</span>
          ))}
        </div>
      )}

      <div className="captured-groups">
        {grouped.kwang.length > 0 && (
          <div className="captured-group">
            <span className="group-label">광 {grouped.kwang.length}</span>
            <div className="group-cards">
              {grouped.kwang.map((c) => <Card key={c.id} card={c} size="tiny" disabled />)}
            </div>
          </div>
        )}
        {grouped.yul.length > 0 && (
          <div className="captured-group">
            <span className="group-label">엽 {grouped.yul.length}</span>
            <div className="group-cards">
              {grouped.yul.map((c) => <Card key={c.id} card={c} size="tiny" disabled />)}
            </div>
          </div>
        )}
        {grouped.tti.length > 0 && (
          <div className="captured-group">
            <span className="group-label">띠 {grouped.tti.length}</span>
            <div className="group-cards">
              {grouped.tti.map((c) => <Card key={c.id} card={c} size="tiny" disabled />)}
            </div>
          </div>
        )}
        {grouped.pi.length > 0 && (
          <div className="captured-group">
            <span className="group-label">피 {grouped.pi.reduce((s, p) => s + getPiScoringValue(p), 0)}</span>
            <div className="group-cards">
              {grouped.pi.map((c) => <Card key={c.id} card={c} size="tiny" disabled />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
