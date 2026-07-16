import { getCardBackPath } from '../data/cardImages';

/** 바닥에 깔리기 전 카드가 쌓여 있다가 뒤집히는 더미 */
export default function FloorFlipPile({ active }) {
  return (
    <div className={`floor-flip-pile ${active ? 'floor-flip-pile-active' : ''}`} aria-hidden="true">
      <div className="floor-flip-stack">
        <img src={getCardBackPath()} alt="" className="floor-flip-card floor-flip-3" draggable={false} />
        <img src={getCardBackPath()} alt="" className="floor-flip-card floor-flip-2" draggable={false} />
        <img src={getCardBackPath()} alt="" className="floor-flip-card floor-flip-1" draggable={false} />
      </div>
      <span className="floor-flip-label">뒤집는 더미</span>
    </div>
  );
}
