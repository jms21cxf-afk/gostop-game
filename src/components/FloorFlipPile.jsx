import { getCardBackPath } from '../data/cardImages';

/** 바닥에 깔리기 전 카드가 쌓여 있다가 뒤집히는 더미 (모바일에서 덱 표시) */
export default function FloorFlipPile({ active, stockCount = 0 }) {
  return (
    <div className={`floor-flip-pile ${active ? 'floor-flip-pile-active' : ''}`} aria-hidden="true">
      <div className="floor-flip-stack">
        <img src={getCardBackPath()} alt="" className="floor-flip-card floor-flip-3" draggable={false} />
        <img src={getCardBackPath()} alt="" className="floor-flip-card floor-flip-2" draggable={false} />
        <img src={getCardBackPath()} alt="" className="floor-flip-card floor-flip-1" draggable={false} />
      </div>
      {stockCount > 0 && (
        <span className="floor-flip-label">덱 {stockCount}</span>
      )}
    </div>
  );
}
