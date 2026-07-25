import { getCardBackPath } from '../data/cardImages';

/** hooks 없음 — AI faceDown 전환·모바일 다량 렌더 시 크래시 방지 */
export default function Card({ card, onClick, selected, disabled, size = 'normal', faceDown }) {
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
        src={card.image}
        alt={`${card.month}월 ${card.label}`}
        className="card-img"
        draggable={false}
        onError={(e) => {
          const img = e.currentTarget;
          if (card.fallback && img.dataset.fallback !== '1') {
            img.dataset.fallback = '1';
            img.src = card.fallback;
          }
        }}
      />
      {size !== 'table' && size !== 'flying' && (
        <span className={`card-month-badge ${size === 'captured' ? 'card-month-badge-sm' : ''}`}>
          {card.month}월
        </span>
      )}
    </button>
  );
}
