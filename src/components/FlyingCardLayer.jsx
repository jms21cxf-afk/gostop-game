import { useEffect, useState, useCallback } from 'react';
import Card from './Card';
import { getCardBackPath } from '../data/cardImages';
import { playSound } from '../utils/sounds';

const ZONES = {
  hand0: { x: 50, y: 84 },
  hand1: { x: 50, y: 12 },
  stock: { x: 50, y: 32 },
  pile: { x: 50, y: 52 },
  table: { x: 50, y: 52 },
  captured0: { x: 8, y: 50 },
  captured1: { x: 92, y: 50 },
};

const FLY_MS = 1600;
const PLACE_TOTAL_MS = 3200;
const FLIP_AT_PILE_MS = 700;
const STAGGER_MS = 220;
const PPUNG_FLY_MS = 1800;

function isPlaceOnTable(event) {
  return event.to === 'table' && event.type !== 'ppung';
}

export default function FlyingCardLayer({ event, onDone, onPileActive, onTableLand }) {
  const [items, setItems] = useState([]);
  const [placePhase, setPlacePhase] = useState(null);

  const finish = useCallback((cardIds) => {
    setItems([]);
    setPlacePhase(null);
    onPileActive?.(false);
    onDone?.();
    if (cardIds?.length) onTableLand?.(cardIds);
  }, [onDone, onPileActive, onTableLand]);

  useEffect(() => {
    if (!event) return undefined;
    if (!event.cards?.length) {
      onDone?.();
      return undefined;
    }

    if (isPlaceOnTable(event)) {
      const card = event.cards[0];
      const fromKey = event.type === 'flip_stock' ? 'stock' : (event.playerIdx === 0 ? 'hand0' : 'hand1');
      const from = ZONES[fromKey];

      onPileActive?.(true);
      setPlacePhase('to-pile');
      setItems([{
        id: `${event.seq}-place`,
        card,
        mode: 'place',
        from,
        faceDown: true,
      }]);

      const t1 = setTimeout(() => {
        setPlacePhase('flip');
        playSound('flipCard');
      }, FLY_MS);
      const t2 = setTimeout(() => {
        setPlacePhase('land');
        onPileActive?.(false);
        onTableLand?.([card.id]);
        playSound('place');
      }, FLY_MS + FLIP_AT_PILE_MS);
      const t3 = setTimeout(() => finish(), PLACE_TOTAL_MS);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }

    const fromKey = event.type === 'flip_stock' ? 'stock'
      : event.type === 'play_hand' ? (event.playerIdx === 0 ? 'hand0' : 'hand1')
      : 'table';
    const toKey = event.to === 'captured' ? `captured${event.playerIdx}` : 'table';

    const from = ZONES[fromKey] || ZONES.table;
    const to = ZONES[toKey] || ZONES.table;
    const duration = event.type === 'ppung' ? PPUNG_FLY_MS : FLY_MS;

    const newItems = event.cards.map((card, i) => ({
      id: `${event.seq}-${card.id}-${i}`,
      card,
      mode: 'fly',
      from,
      to,
      delay: i * STAGGER_MS,
      duration,
    }));

    setItems(newItems);
    const maxDelay = (event.cards.length - 1) * STAGGER_MS;
    const timer = setTimeout(() => finish(), duration + maxDelay + 80);

    return () => clearTimeout(timer);
  }, [event?.seq]);

  if (!items.length) return null;

  return (
    <div className="flying-layer" aria-hidden="true">
      {items.map((item) => {
        if (item.mode === 'place') {
          const pile = ZONES.pile;
          const phaseClass = placePhase === 'flip' ? 'place-flip'
            : placePhase === 'land' ? 'place-land'
            : 'place-to-pile';

          return (
            <div
              key={item.id}
              className={`flying-card flying-place ${phaseClass}`}
              style={{
                '--fx': `${item.from.x}%`,
                '--fy': `${item.from.y}%`,
                '--px': `${pile.x}%`,
                '--py': `${pile.y}%`,
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
