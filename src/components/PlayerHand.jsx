import Card from './Card';
import { sortHand } from '../data/cards';

export default function PlayerHand({
  cards,
  onCardClick,
  isActive,
  playerName,
  position,
  isAi = false,
  thinking = false,
  previewCardId = null,
}) {
  const sorted = sortHand(cards);

  return (
    <div className={`player-hand player-${position} ${isActive ? 'active' : ''} ${previewCardId ? 'ai-previewing' : ''}`}>
      <div className="hand-row">
        {position === 'bottom' && (
          <div className="hand-side-info">
            <span className="player-name">{playerName}</span>
            <span className="hand-count">패 {cards.length}장</span>
            {isActive && <span className="turn-indicator">▶ 내 차례</span>}
          </div>
        )}

        <div className="hand-cards">
          {isAi ? (
            sorted.map((card, i) => {
              const isPreview = card.id === previewCardId;
              return (
                <div
                  key={card.id}
                  className={`ai-card-wrap ${isPreview ? 'ai-card-preview' : ''}`}
                  style={{ '--fan-rot': `${(i - (sorted.length - 1) / 2) * 3}deg` }}
                >
                  <Card
                    card={card}
                    faceDown={!isPreview}
                    size={isPreview ? 'ai-preview' : 'ai'}
                    selected={isPreview}
                  />
                </div>
              );
            })
          ) : (
            sorted.map((card) => (
              <Card
                key={card.id}
                card={card}
                onClick={onCardClick}
                disabled={!isActive}
                size="xl"
              />
            ))
          )}
        </div>

        {position === 'top' && (
          <div className="hand-side-info hand-side-right">
            <span className="player-name">🤖 {playerName}</span>
            <span className="hand-count">패 {cards.length}장</span>
            {previewCardId && (
              <span className="turn-indicator ai-playing">▶ 카드 냄!</span>
            )}
            {isActive && !previewCardId && (
              <span className="turn-indicator ai-thinking">
                {thinking ? '💭 생각 중' : 'AI 차례'}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
