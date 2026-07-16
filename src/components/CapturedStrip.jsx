import { calculateScore } from '../logic/scoring';
import { groupCapturedByType } from '../data/cards';
import Card from './Card';

export default function CapturedStrip({
  captured,
  playerName,
  side,
  score,
  hiddenIds = [],
  landingIds = [],
}) {
  const hidden = new Set(hiddenIds);
  const visible = (captured || []).filter((c) => !hidden.has(c.id));
  const { yaku } = calculateScore(captured || []);

  const grouped = groupCapturedByType(visible);

  const piTotal = grouped.pi.reduce((s, p) => s + (p.piValue || 1), 0);
  const totalCards = (captured || []).length;

  return (
    <aside className={`captured-strip captured-${side}`}>
      <div className="captured-strip-header">
        <span className="captured-strip-title">{playerName}</span>
        <span className="captured-strip-score">{score}점 · {totalCards}장</span>
      </div>

      {yaku.length > 0 && (
        <div className="captured-yaku-row">
          {yaku.map((y, i) => (
            <span key={i} className="yaku-badge-sm">{y.name}</span>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="captured-empty">{totalCards === 0 ? '먹은 패 없음' : '...'}</p>
      ) : (
        <div className="captured-strip-groups">
          {grouped.kwang.length > 0 && (
            <div className="captured-strip-group">
              <span className="strip-label">광</span>
              <div className="strip-cards">
                {grouped.kwang.map((c) => (
                  <div key={c.id} className={landingIds.includes(c.id) ? 'captured-card-landing' : ''}>
                    <Card card={c} size="captured" disabled />
                  </div>
                ))}
              </div>
            </div>
          )}
          {grouped.yul.length > 0 && (
            <div className="captured-strip-group">
              <span className="strip-label">엽</span>
              <div className="strip-cards">
                {grouped.yul.map((c) => (
                  <div key={c.id} className={landingIds.includes(c.id) ? 'captured-card-landing' : ''}>
                    <Card card={c} size="captured" disabled />
                  </div>
                ))}
              </div>
            </div>
          )}
          {grouped.tti.length > 0 && (
            <div className="captured-strip-group">
              <span className="strip-label">띠</span>
              <div className="strip-cards">
                {grouped.tti.map((c) => (
                  <div key={c.id} className={landingIds.includes(c.id) ? 'captured-card-landing' : ''}>
                    <Card card={c} size="captured" disabled />
                  </div>
                ))}
              </div>
            </div>
          )}
          {grouped.pi.length > 0 && (
            <div className="captured-strip-group">
              <span className="strip-label">피{piTotal}</span>
              <div className="strip-cards">
                {grouped.pi.map((c) => (
                  <div key={c.id} className={landingIds.includes(c.id) ? 'captured-card-landing' : ''}>
                    <Card card={c} size="captured" disabled />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
