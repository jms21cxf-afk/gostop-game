import Card from './Card';
import { getCardBackPath } from '../data/cardImages';
import { getTableCardLayout } from '../utils/tableLayout';
import FloorFlipPile from './FloorFlipPile';

export default function TableArea({
  cards,
  onCardClick,
  selectable,
  stockCount,
  highlightCardId,
  hiddenCardIds = [],
  landingCardIds = [],
  pileActive = false,
  chooseMonth = null,
}) {
  const layouts = getTableCardLayout(cards);
  const hidden = new Set(hiddenCardIds);

  return (
    <div className="table-area">
      <div className="table-felt">
        {stockCount > 0 && (
          <div className="stock-pile" aria-label={`남은 덱 ${stockCount}장`}>
            <div className="stock-stack">
              <img src={getCardBackPath()} alt="" className="stock-card stock-card-3" draggable={false} />
              <img src={getCardBackPath()} alt="" className="stock-card stock-card-2" draggable={false} />
              <img src={getCardBackPath()} alt="" className="stock-card stock-card-1" draggable={false} />
            </div>
            <span className="stock-count">덱 {stockCount}</span>
          </div>
        )}

        <FloorFlipPile active={pileActive} />

        <div className="table-cards-scatter">
          {cards.length === 0 && !pileActive ? (
            <p className="empty-message">바닥</p>
          ) : (
            layouts.map(({ card, style }) => {
              if (hidden.has(card.id)) return null;
              const isLanding = landingCardIds.includes(card.id);
              const isChooseCandidate = selectable && chooseMonth && card.month === chooseMonth;
              return (
                <div
                  key={card.id}
                  className={`table-card-slot ${isChooseCandidate ? 'selectable choose-candidate' : ''} ${card.id === highlightCardId ? 'ai-highlight' : ''} ${isLanding ? 'table-card-landing' : ''}`}
                  style={style}
                >
                  <Card
                    card={card}
                    onClick={onCardClick}
                    disabled={!isChooseCandidate}
                    size="table"
                    selected={card.id === highlightCardId || isChooseCandidate}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>
      <span className="table-label">바닥 {cards.length}장</span>
    </div>
  );
}
