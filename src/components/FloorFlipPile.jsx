import { getCardBackPath } from '../data/cardImages';

/** 오른쪽 아래 덱 더미 — 모바일에서 ② 덱 뒤집기 출발점 */
export default function FloorFlipPile({ active, stockCount = 0 }) {
  return (
    <div className={`floor-flip-pile ${active ? 'floor-flip-pile-active' : ''}`} aria-label={stockCount > 0 ? `덱 ${stockCount}장` : '덱'}>
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
