import { useEffect, useState, useCallback } from 'react';
import Card from './Card';
import { getCardBackPath } from '../data/cardImages';
import { playSound } from '../utils/sounds';

const ZONES = {
  hand0: { x: 50, y: 84 },
  hand1: { x: 50, y: 12 },
  stock: { x: 50, y: 32 },
  table: { x: 50, y: 52 },
  pile: { x: 84, y: 56 },
  captured0: { x: 8, y: 50 },
  captured1: { x: 92, y: 50 },
};

const FLY_MS = 1600;
const FLIP_AT_PILE_MS = 550;
const FLY_TO_TABLE_MS = 700;
const PILE_DRAW_MS = 80;
const FLIP_STOCK_PLACE_MS = PILE_DRAW_MS + FLIP_AT_PILE_MS + FLY_TO_TABLE_MS + 80;
const STAGGER_MS = 220;
const PPUNG_FLY_MS = 1800;

function isFlipStockToTable(event) {
  return event?.type === 'flip_stock' && event.to === 'table';
}

function isHandToTable(event) {
  return event?.type === 'play_hand' && event.to === 'table';
}

export default function FlyingCardLayer({ event, onDone, onPileActive }) {
  const [items, setItems] = useState([]);
  const [placePhase, setPlacePhase] = useState(null);

  const finish = useCallback(() => {
    setItems([]);
    setPlacePhase(null);
    onPileActive?.(false);
    onDone?.();
  }, [onDone, onPileActive]);

  useEffect(() => {
    if (!event) return undefined;
    if (!event.cards?.length) {
      onDone?.();
      return undefined;
    }

    // ② 덱: 뒤집는 더미에서 뒤집고 → 바닥
    if (isFlipStockToTable(event)) {
      const card = event.cards[0];
      const pile = ZONES.pile;
      const table = ZONES.table;

      onPileActive?.(true);
      setPlacePhase('at-pile');
      setItems([{
        id: `${event.seq}-place`,
        card,
        mode: 'place',
        pile,
        table,
      }]);

      const t0 = setTimeout(() => {
        setPlacePhase('flip');
        playSound('flipCard');
      }, PILE_DRAW_MS);
      const t1 = setTimeout(() => {
        setPlacePhase('fly-table');
        playSound('place');
      }, PILE_DRAW_MS + FLIP_AT_PILE_MS);
      const t2 = setTimeout(() => finish(), FLIP_STOCK_PLACE_MS);

      return () => {
        clearTimeout(t0);
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }

    // ① 패: 매칭 없으면 패 → 바닥 직행
    if (isHandToTable(event)) {
      const card = event.cards[0];
      const from = ZONES[event.playerIdx === 0 ? 'hand0' : 'hand1'];
      const to = ZONES.table;

      setItems([{
        id: `${event.seq}-hand-table`,
        card,
        mode: 'fly',
        from,
        to,
        delay: 0,
        duration: FLY_MS,
      }]);

      const timer = setTimeout(() => finish(), FLY_MS + 80);
      return () => clearTimeout(timer);
    }

    const toKey = event.to === 'captured' ? `captured${event.playerIdx}` : 'table';
    const duration = event.type === 'ppung' ? PPUNG_FLY_MS : FLY_MS;

    const newItems = event.cards.map((card, i) => {
      let fromKey;
      if (event.type === 'flip_stock') {
        fromKey = i === 0 ? 'pile' : 'table';
      } else if (event.type === 'play_hand') {
        fromKey = i === 0 ? (event.playerIdx === 0 ? 'hand0' : 'hand1') : 'table';
      } else if (event.type === 'ppung') {
        fromKey = i === 0
          ? (event.from === 'stock' ? 'pile' : (event.playerIdx === 0 ? 'hand0' : 'hand1'))
          : 'table';
      } else {
        fromKey = 'table';
      }

      const from = ZONES[fromKey] || ZONES.table;
      const to = ZONES[toKey] || ZONES.table;
      return {
        id: `${event.seq}-${card.id}-${i}`,
        card,
        mode: 'fly',
        from,
        to,
        delay: i * STAGGER_MS,
        duration,
      };
    });

    if (event.type === 'flip_stock' && event.to === 'captured') {
      onPileActive?.(true);
    }

    setItems(newItems);
    const maxDelay = (event.cards.length - 1) * STAGGER_MS;
    const timer = setTimeout(() => finish(), duration + maxDelay + 80);

    return () => clearTimeout(timer);
  }, [event?.seq, finish, onDone, onPileActive]);

  if (!items.length) return null;

  return (
    <div className="flying-layer" aria-hidden="true">
      {items.map((item) => {
        if (item.mode === 'place') {
          const phaseClass = placePhase === 'flip' ? 'place-flip'
            : placePhase === 'fly-table' ? 'place-fly-table'
            : 'place-at-pile';

          return (
            <div
              key={item.id}
              className={`flying-card flying-place ${phaseClass}`}
              style={{
                '--px': `${item.pile.x}%`,
                '--py': `${item.pile.y}%`,
                '--tx': `${item.table.x}%`,
                '--ty': `${item.table.y}%`,
              }}
            >
              <div className="flip-card-3d">
                <div className="flip-face flip-back">
                  <img src={getCardBackPath()} alt="" className="card-img" draggable={false} />
                </div>
                <div className="flip-face flip-front">
                  <Card card={item.card} size="flying" disabled />
                </div>
              </div>
            </div>
          );
        }

        return (
          <div
            key={item.id}
            className="flying-card flying-fly"
            style={{
              '--fx': `${item.from.x}%`,
              '--fy': `${item.from.y}%`,
              '--tx': `${item.to.x}%`,
              '--ty': `${item.to.y}%`,
              '--fly-ms': `${item.duration}ms`,
              animationDelay: `${item.delay}ms`,
            }}
          >
            <Card card={item.card} size="flying" disabled />
          </div>
        );
      })}
    </div>
  );
}
