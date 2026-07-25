import { useEffect, useState } from 'react';
import { getCardBackPath } from '../data/cardImages';

export default function Card({ card, onClick, selected, disabled, size = 'normal', faceDown }) {
  const [src, setSrc] = useState(card?.image ?? '');

  useEffect(() => {
    setSrc(card?.image ?? '');
  }, [card?.image]);

  if (faceDown || !card) {
    return (
      <button
        className={`card card-back card-${size} ${selected ? 'card-selected' : ''}`}
        disabled
        aria-label="뒷면 카드"
      >
        <img src={getCardBackPath()} alt="" className="card-img" draggable={false} />
      </button>
    );
  }

  return (
    <button
      className={`card card-${size} card-image ${selected ? 'card-selected' : ''} ${disabled ? 'card-disabled' : ''}`}
      onClick={() => !disabled && onClick?.(card)}
      disabled={disabled}
      aria-label={`${card.month}월 ${card.label}`}
      data-month={card.month}
    >
      <img
        src={src}
        alt={`${card.month}월 ${card.label}`}
        className="card-img"
        draggable={false}
        onError={() => { if (card.fallback && src !== card.fallback) setSrc(card.fallback); }}
      />
      {size !== 'table' && size !== 'flying' && (
        <span className={`card-month-badge ${size === 'captured' ? 'card-month-badge-sm' : ''}`}>
          {card.month}월
        </span>
      )}
    </button>
  );
}
