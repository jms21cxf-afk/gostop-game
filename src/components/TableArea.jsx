import { useState, useEffect } from 'react';
import Card from './Card';
import { getCardBackPath } from '../data/cardImages';
import { getTableCardLayout } from '../utils/tableLayout';
function useCompactLayout() {
  const [compact, setCompact] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setCompact(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return compact;
}

export default function TableArea({
  cards,
  onCardClick,
  selectable,
  stockCount,
  highlightCardId,
  chooseMonth = null,
}) {
  const compact = useCompactLayout();
  const layouts = getTableCardLayout(cards, { compact });

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

        <div className="table-cards-scatter">
          {cards.length === 0 ? (
            <p className="empty-message">바닥</p>
          ) : (
            layouts.map(({ card, style }) => {
              const isChooseCandidate = selectable && chooseMonth && card.month === chooseMonth;
              return (
                <div
                  key={card.id}
                  className={`table-card-slot ${isChooseCandidate ? 'selectable choose-candidate' : ''} ${card.id === highlightCardId ? 'ai-highlight' : ''}`}
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
